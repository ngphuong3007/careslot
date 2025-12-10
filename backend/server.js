// ==================================================
// === KHAI BÁO & CẤU HÌNH =========================
// ==================================================
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const db = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const sgTransport = require('nodemailer-sendgrid-transport');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { Server } = require("socket.io");


const app = express();
const port = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'careslot_12345';
const GUEST_USER_ID = 9999;

const allowedOrigins = (
  process.env.CORS_ORIGINS ||
  'http://localhost:3000,https://careslot.vercel.app'
)
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
};

app.use(cors(corsOptions));

// --- Middlewares ---
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Cấu hình Upload File ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Lưu trữ người dùng đang online { userId: socketId }
let onlineUsers = {};

const addOnlineUser = (userId, socketId) => {
  onlineUsers[userId] = socketId;
  io.emit('user:update_online_status', Object.keys(onlineUsers));
};

const removeOnlineUser = (socketId) => {
  const userId = Object.keys(onlineUsers).find(key => onlineUsers[key] === socketId);
  if (userId) {
    delete onlineUsers[userId];
    io.emit('user:update_online_status', Object.keys(onlineUsers));
  }
};

const getSocketIdByUserId = (userId) => onlineUsers[userId];

// Logic xử lý kết nối Socket.IO
io.on('connection', (socket) => {
  console.log(`[Socket.IO] Người dùng đã kết nối: ${socket.id}`);

  socket.on('user:online', (userId) => {
    console.log(`[Socket.IO] User ${userId} online với socket ${socket.id}`);
    addOnlineUser(userId, socket.id);
  });

  socket.on('chat:request_conversation', async ({ userId, anonymousName, type }) => {
    try {
        if (!userId && !anonymousName) {
            return; // Không có thông tin để bắt đầu chat
        }

        const roleToFind = type === 'doctor' ? 'doctor' : 'receptionist';
        const onlineUserIds = Object.keys(onlineUsers).length ? Object.keys(onlineUsers) : [0];

        const [availableStaff] = await db.query(
            `SELECT id FROM users WHERE role = ? AND id IN (?)`,
            [roleToFind, onlineUserIds]
        );

        if (availableStaff.length > 0) {
            const staff = availableStaff[0];
            
            // Sửa lại câu query để xử lý cả 2 trường hợp
            const sql = `INSERT INTO conversations (user_id, anonymous_name, staff_id, type, status) VALUES (?, ?, ?, ?, 'active')`;
            const params = [userId || null, anonymousName || null, staff.id, type];
            
            const [result] = await db.query(sql, params);
            const conversationId = result.insertId;
            
            const [newConv] = await db.query('SELECT * FROM conversations WHERE id = ?', [conversationId]);

            socket.emit('chat:conversation_started', newConv[0]);
            const staffSocketId = getSocketIdByUserId(staff.id);
            if (staffSocketId) {
                io.to(staffSocketId).emit('chat:conversation_started', newConv[0]);
            }
        } else {
            socket.emit('chat:no_staff_available', { type });
        }
    } catch (error) {
        console.error("[Socket.IO] Lỗi khi tạo cuộc trò chuyện:", error);
    }
  });

  socket.on('chat:send_message', async ({ conversationId, senderId, receiverId, content }) => {
  try {
    const safeSenderId =
      senderId && Number(senderId) > 0 ? Number(senderId) : GUEST_USER_ID;

    const [result] = await db.query(
      `INSERT INTO messages (conversation_id, sender_id, content)
       VALUES (?, ?, ?)`,
      [conversationId, safeSenderId, content]
    );
    const [rows] = await db.query('SELECT * FROM messages WHERE id = ?', [result.insertId]);
    const newMessage = rows[0];

    // Cập nhật thời gian hoạt động cuối của cuộc trò chuyện
    await db.query(
      `UPDATE conversations SET updated_at = NOW() WHERE id = ?`,
      [conversationId]
    );

    // 1. Gửi lại cho socket đang gửi (staff hoặc guest)
    socket.emit('chat:receive_message', newMessage);

    for (const [id, s] of io.sockets.sockets) {
      if (id !== socket.id) {
        s.emit('chat:receive_message', newMessage);
      }
    }
  } catch (err) {
    console.error('[Socket.IO] Lỗi khi gửi tin nhắn:', err);
  }
});

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Người dùng đã ngắt kết nối: ${socket.id}`);
    removeOnlineUser(socket.id);
  });
});

// --- Cấu hình Gửi Email ---
const transporter = nodemailer.createTransport(sgTransport({
  auth: { api_key: process.env.SENDGRID_API_KEY }
}));

const canSendMail = Boolean(process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL);
const safeSendMail = (options = {}) => {
  if (!canSendMail) {
    console.warn('[Mailer] SENDGRID cấu hình thiếu, bỏ qua việc gửi email:', options.subject || '(no subject)');
    return Promise.resolve();
  }
  return transporter.sendMail(options);
};

const normalizeDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// ==================================================
// === MIDDLEWARE XÁC THỰC & PHÂN QUYỀN ============
// ==================================================
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') next();
  else res.status(403).json({ message: 'Yêu cầu quyền Admin.' });
};

const isDoctor = (req, res, next) => {
    if (req.user && req.user.role === 'doctor') next();
    else res.status(403).json({ message: 'Yêu cầu quyền Bác sĩ.' });
};

const isReceptionist = (req, res, next) => {
    if (req.user && req.user.role === 'receptionist') next();
    else res.status(403).json({ message: 'Yêu cầu quyền Lễ tân.' });
};

// ==================================================
// === HÀM HỖ TRỢ ==================================
// ==================================================
const generateDefaultTimeSlots = () => {
    const slots = [];
    const startHour = 8;
    const endHour = 17;
    for (let h = startHour; h < endHour; h++) {
        slots.push(`${String(h).padStart(2, '0')}:00`);
        slots.push(`${String(h).padStart(2, '0')}:30`);
    }
    return slots;
};

const sendFakeSms = async (phoneNumber, message) => {
    console.log(`=> Gửi SMS tới SĐT: ${phoneNumber}`);
    console.log(`=> Nội dung: "${message}"`);
    console.log("-----------------------\n");
    return Promise.resolve({ status: 'sent', sid: `fake_sms_${Date.now()}` });
};

// ==================================================
// === API XÁC THỰC (AUTH) ==========================
// ==================================================
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ message: 'Vui lòng nhập đủ thông tin.' });
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hashedPassword]);
    res.status(201).json({ message: 'Đăng ký thành công!' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi đăng ký hoặc Tên đăng nhập/Email đã tồn tại.' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    const user = rows[0];
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng.' });
    }
    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      phone: user.phone,
      full_name: user.full_name,
      email: user.email,
      gender: user.gender,
      address: user.address,
      date_of_birth: normalizeDate(user.date_of_birth)
    };
    if (user.role === 'doctor') {
      const [doctorRows] = await db.query('SELECT id FROM doctors WHERE user_id = ?', [user.id]);
      if (doctorRows.length > 0) payload.doctor_id = doctorRows[0].id;
    }
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
    res.json({ message: 'Đăng nhập thành công!', token, user: payload });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi đăng nhập.' });
  }
});

app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Vui lòng nhập email.' });
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];
    if (!user) return res.json({ message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được mật khẩu mới.' });
    const newPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);
    const mailOptions = {
      from: process.env.SENDGRID_FROM_EMAIL || 'no-reply@careslot.com',
      to: user.email,
      subject: '[CareSlot] Mật khẩu mới của bạn',
      html: `<p>Xin chào ${user.username},</p><p>Bạn đã yêu cầu cấp lại mật khẩu. Mật khẩu mới của bạn là: <b>${newPassword}</b></p><p>Vui lòng đăng nhập bằng mật khẩu này và đổi lại mật khẩu để đảm bảo an toàn.</p><p>Trân trọng,<br/>Đội ngũ CareSlot</p>`,
    };
    await safeSendMail(mailOptions);
    res.json({ message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được mật khẩu mới.' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server.' });
  }
});

app.post('/api/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin.' });
    const [rows] = await db.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    const user = rows[0];
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Mật khẩu hiện tại không chính xác.' });
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, req.user.id]);
    res.json({ message: 'Đổi mật khẩu thành công!' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server.' });
  }
});

// ==================================================
// === API CHO NGƯỜI DÙNG (USER) ===================
// ==================================================
app.get('/api/user/profile', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
         id,
         username,
         email,
         role,
         full_name,
         phone,
         gender,
         DATE_FORMAT(date_of_birth, '%Y-%m-%d') AS date_of_birth,
         address
       FROM users
       WHERE id = ?`,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('[/api/user/profile] error:', err);
    res.status(500).json({ message: 'Lỗi server khi lấy thông tin người dùng.' });
  }
});

app.put('/api/user/profile', verifyToken, async (req, res) => {
    try {
        const { full_name, date_of_birth, gender, address, email, phone } = req.body;
        const userId = req.user.id;

        await db.query(
            'UPDATE users SET full_name = ?, date_of_birth = ?, gender = ?, address = ?, email = ?, phone = ? WHERE id = ?',
            [full_name || null, date_of_birth || null, gender || null, address || null, email || null, phone || null, userId]
        );

        const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
        const updatedUser = rows[0];

        const payload = { 
            id: updatedUser.id, 
            username: updatedUser.username, 
            role: updatedUser.role, 
            phone: updatedUser.phone, 
            full_name: updatedUser.full_name, 
            email: updatedUser.email, 
            gender: updatedUser.gender,
            address: updatedUser.address,
            date_of_birth: normalizeDate(updatedUser.date_of_birth)
        };
        
        if (updatedUser.role === 'doctor') {
            const [doctorRows] = await db.query('SELECT id FROM doctors WHERE user_id = ?', [updatedUser.id]);
            if (doctorRows.length > 0) payload.doctor_id = doctorRows[0].id;
        }

        const newToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

        res.json({ 
            message: 'Cập nhật hồ sơ thành công!',
            token: newToken,
            user: payload 
        });

    } catch (error) {
        console.error("Lỗi khi cập nhật hồ sơ:", error);
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
});

app.get('/api/user/dependents', verifyToken, async (req, res) => {
    try {
        const [dependents] = await db.query(
            `SELECT id, guardian_user_id, name,
                    DATE_FORMAT(dob, '%Y-%m-%d') AS dob,
                    gender, relationship, phone
             FROM dependent_profiles
             WHERE guardian_user_id = ?`,
            [req.user.id]
        );
        res.json(dependents);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
});

app.post('/api/user/dependents', verifyToken, async (req, res) => {
    const { name, dob, gender, relationship, phone } = req.body;
    if (!name || !relationship) return res.status(400).json({ message: 'Tên và mối quan hệ là bắt buộc.' });
    try {
        const [result] = await db.query(
            'INSERT INTO dependent_profiles (guardian_user_id, name, dob, gender, relationship, phone) VALUES (?, ?, ?, ?, ?, ?)',
            [req.user.id, name, dob, gender, relationship, phone]
        );
        res.status(201).json({ message: 'Tạo hồ sơ thành công!', id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ' });
    }
});

// ==================================================
// === API CÔNG KHAI (PUBLIC) =======================
// ==================================================
app.get('/api/services', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM services');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi từ server' });
  }
});

app.get('/api/doctors', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, specialty, service_id, image_url FROM doctors WHERE is_active = TRUE'
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách bác sĩ.' });
  }
});

app.get('/api/doctors/:id/schedule', async (req, res) => {
  const { id } = req.params;
  const { date } = req.query;
  if (!date) return res.status(400).json({ message: 'Vui lòng cung cấp ngày.' });
  try {
    const [scheduleRows] = await db.query('SELECT time_slots, is_day_off FROM doctor_schedules WHERE doctor_id = ? AND work_date = ?', [id, date]);
    let availableSlots = [];
    if (scheduleRows.length > 0) {
      const specificSchedule = scheduleRows[0];
      if (!specificSchedule.is_day_off) availableSlots = specificSchedule.time_slots ? JSON.parse(specificSchedule.time_slots) : [];
    } else {
      availableSlots = generateDefaultTimeSlots();
    }
    const [bookedSlots] = await db.query('SELECT appointment_time FROM appointments WHERE doctor_id = ? AND DATE(appointment_time) = ? AND status != "cancelled"', [id, date]);
    const bookedTimes = new Set(bookedSlots.map(slot => new Date(slot.appointment_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })));
    const today = new Date();
    const targetDate = new Date(date);
    const isToday = today.toDateString() === targetDate.toDateString();
    const finalSchedule = availableSlots.map(timeStr => {
        const slotTime = new Date(`${date}T${timeStr}:00`);
        const isPast = isToday && slotTime < today;
        return { time: `${date}T${timeStr}:00`, status: isPast || bookedTimes.has(timeStr) ? 'booked' : 'available' };
    });
    res.json(finalSchedule);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

app.get('/api/public/appointments/lookup', async (req, res) => {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ message: 'Vui lòng cung cấp số điện thoại để tra cứu.' });
    try {
        const query = `SELECT a.id, a.patient_name, a.appointment_time, a.status, s.name AS service_name, d.name AS doctor_name FROM appointments a JOIN services s ON a.service_id = s.id JOIN doctors d ON a.doctor_id = d.id WHERE a.patient_phone = ? ORDER BY a.appointment_time DESC`;
        const [appointments] = await db.query(query, [phone]);
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
});

app.post('/api/appointments', async (req, res) => {
    const { service_id, patient_name, patient_phone, patient_dob, patient_email, doctor_id, appointment_time, user_id, dependent_id } = req.body;
    if (!service_id || !patient_name || !patient_phone || !doctor_id || !appointment_time) {
        return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin bắt buộc.' });
    }
    try {
        const [existing] = await db.query('SELECT id FROM appointments WHERE doctor_id = ? AND appointment_time = ? AND status NOT IN (?)', [doctor_id, appointment_time, 'cancelled']);
        if (existing.length > 0) {
            return res.status(409).json({ message: 'Khung giờ này đã có người đặt.' });
        }
        const [result] = await db.query(
            'INSERT INTO appointments (service_id, patient_name, patient_phone, patient_email, patient_dob, doctor_id, appointment_time, user_id, dependent_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [service_id, patient_name, patient_phone, patient_email || null, patient_dob || null, doctor_id, appointment_time, user_id, dependent_id || null, 'pending']
        );
        res.status(201).json({ message: 'Đặt lịch thành công! Vui lòng chờ xác nhận.', appointmentId: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
});

// ==================================================
// === API CHO ADMIN ================================
// ==================================================
app.get('/api/admin/users', verifyToken, isAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, username, email, role, full_name, phone FROM users'
    );
    res.json(rows);
  } catch (err) {
    console.error('[/api/admin/users] error:', err);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách người dùng.' });
  }
});

app.put('/api/admin/users/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    const { id } = req.params;
    const validRoles = ['user', 'admin', 'doctor', 'receptionist'];
    if (!role || !validRoles.includes(role)) return res.status(400).json({ message: 'Vai trò không hợp lệ.' });
    await db.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    res.json({ message: 'Cập nhật vai trò người dùng thành công!' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

app.delete('/api/admin/users/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (parseInt(id, 10) === req.user.id) return res.status(400).json({ message: 'Bạn không thể tự xóa chính mình.' });
    await db.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'Xóa người dùng thành công!' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

app.post('/api/admin/users/:id/reset-password', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT email, username FROM users WHERE id = ?', [id]);
    const user = rows[0];
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
    const newPassword = Math.random().toString(36).slice(-8);
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, id]);
    const mailOptions = {
      from: process.env.SENDGRID_FROM_EMAIL,
      to: user.email,
      subject: '[CareSlot] Mật khẩu của bạn đã được reset',
      html: `<p>Xin chào ${user.username},</p><p>Quản trị viên đã reset mật khẩu cho tài khoản của bạn.</p><p>Mật khẩu mới của bạn là: <b>${newPassword}</b></p><p>Vui lòng đăng nhập bằng mật khẩu này và đổi lại mật khẩu ngay để đảm bảo an toàn.</p><p>Trân trọng,<br/>Đội ngũ CareSlot</p>`,
    };
    await safeSendMail(mailOptions);
    res.json({ message: `Đã reset và gửi mật khẩu mới tới email ${user.email}.` });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi reset mật khẩu.' });
  }
});

app.get('/api/admin/services', verifyToken, isAdmin, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM services ORDER BY id DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi từ server' });
  }
});

app.post('/api/admin/services', verifyToken, isAdmin, async (req, res) => {
  try {
    const { name, description, price } = req.body;
    if (!name || !description || !price) return res.status(400).json({ message: 'Vui lòng nhập đủ thông tin dịch vụ.' });
    await db.query('INSERT INTO services (name, description, price) VALUES (?, ?, ?)', [name, description, price]);
    res.status(201).json({ message: 'Thêm dịch vụ thành công!' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi thêm dịch vụ.' });
  }
});

app.put('/api/admin/services/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price } = req.body;
    await db.query('UPDATE services SET name = ?, description = ?, price = ? WHERE id = ?', [name, description, price, id]);
    res.json({ message: 'Cập nhật dịch vụ thành công!' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi cập nhật dịch vụ.' });
  }
});

app.delete('/api/admin/services/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM services WHERE id = ?', [id]);
    res.json({ message: 'Xóa dịch vụ thành công!' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi xóa dịch vụ.' });
  }
});

app.get('/api/admin/doctors', verifyToken, isAdmin, async (req, res) => {
  try {
    const query = `SELECT d.*, u.username FROM doctors d LEFT JOIN users u ON d.user_id = u.id ORDER BY d.id DESC`;
    const [doctors] = await db.query(query);
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách bác sĩ.' });
  }
});

app.post('/api/admin/doctors', verifyToken, isAdmin, upload.single('image'), async (req, res) => {
  try {
    const { name, specialty, bio } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    if (!name || !specialty) return res.status(400).json({ message: 'Tên và chuyên khoa là bắt buộc.' });
    await db.query('INSERT INTO doctors (name, specialty, bio, image_url) VALUES (?, ?, ?, ?)', [name, specialty, bio, imageUrl]);
    res.status(201).json({ message: 'Thêm bác sĩ thành công!' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi thêm bác sĩ.' });
  }
});

app.put('/api/admin/doctors/:id', verifyToken, isAdmin, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, specialty, bio } = req.body;
    let imageUrl = req.body.image_url;
    if (req.file) imageUrl = `/uploads/${req.file.filename}`;
    await db.query('UPDATE doctors SET name = ?, specialty = ?, bio = ?, image_url = ? WHERE id = ?', [name, specialty, bio, imageUrl, id]);
    res.json({ message: 'Cập nhật thông tin bác sĩ thành công!' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi cập nhật bác sĩ.' });
  }
});

app.delete('/api/admin/doctors/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM doctors WHERE id = ?', [id]);
    res.json({ message: 'Xóa bác sĩ thành công!' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi xóa bác sĩ.' });
  }
});

app.put('/api/admin/doctors/:id/toggle-active', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    await db.query('UPDATE doctors SET is_active = ? WHERE id = ?', [isActive, id]);
    const message = isActive ? 'Kích hoạt bác sĩ thành công!' : 'Vô hiệu hóa bác sĩ thành công!';
    res.json({ message });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server.' });
  }
});

app.get('/api/admin/appointments', verifyToken, isAdmin, async (req, res) => {
  try {
    const sql = `SELECT a.id, a.patient_name, a.patient_phone, a.appointment_time, a.status, a.service_id, s.name AS service_name, a.doctor_id, d.name AS doctor_name FROM appointments a JOIN services s ON a.service_id = s.id LEFT JOIN doctors d ON a.doctor_id = d.id ORDER BY a.appointment_time DESC`;
    const [appointments] = await db.query(sql);
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi từ server' });
  }
});

app.put('/api/admin/appointments/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, doctor_id } = req.body;
    const updates = [];
    const values = [];
    if (status) {
      const validStatus = ['pending', 'confirmed', 'completed', 'cancelled'];
      if (!validStatus.includes(status)) return res.status(400).json({ message: 'Trạng thái không hợp lệ.' });
      updates.push('status = ?');
      values.push(status);
    }
    if (doctor_id !== undefined) {
        updates.push('doctor_id = ?');
        values.push(doctor_id);
    }
    if (updates.length === 0) return res.status(400).json({ message: 'Không có thông tin nào để cập nhật.' });
    values.push(id);
    const sql = `UPDATE appointments SET ${updates.join(', ')} WHERE id = ?`;
    await db.query(sql, values);
    res.json({ message: 'Cập nhật lịch hẹn thành công!' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi cập nhật lịch hẹn.' });
  }
});

// ==================================================
// === API CHO BÁC SĨ (DOCTOR) ======================
// ==================================================
app.get('/api/doctor/appointments/range', verifyToken, isDoctor, async (req, res) => {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ message: 'Vui lòng cung cấp ngày bắt đầu và ngày kết thúc.' });
    try {
        const [doctorRows] = await db.query('SELECT id FROM doctors WHERE user_id = ?', [req.user.id]);
        if (doctorRows.length === 0) return res.status(404).json({ message: 'Không tìm thấy hồ sơ bác sĩ.' });
        const doctorId = doctorRows[0].id;
        const query = `SELECT a.id, a.patient_name, a.appointment_time, a.status, s.name as service_name FROM appointments a JOIN services s ON a.service_id = s.id WHERE a.doctor_id = ? AND a.appointment_time >= ? AND a.appointment_time < DATE_ADD(?, INTERVAL 1 DAY) ORDER BY a.appointment_time ASC`;
        const [appointments] = await db.query(query, [doctorId, startDate, endDate]);
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
});

app.get('/api/doctor/appointments', verifyToken, isDoctor, async (req, res) => {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: 'Vui lòng cung cấp ngày để xem lịch.' });
    try {
        const [doctorRows] = await db.query('SELECT id FROM doctors WHERE user_id = ?', [req.user.id]);
        if (doctorRows.length === 0) return res.status(404).json({ message: 'Không tìm thấy hồ sơ bác sĩ cho tài khoản này.' });
        const doctorId = doctorRows[0].id;
        const query = `SELECT a.*, s.name as service_name FROM appointments a JOIN services s ON a.service_id = s.id WHERE a.doctor_id = ? AND DATE(a.appointment_time) = ? ORDER BY a.appointment_time ASC`;
        const [appointments] = await db.query(query, [doctorId, date]);
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
});

app.put('/api/doctor/appointments/:id/status', verifyToken, isDoctor, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const [doctorRows] = await db.query('SELECT id FROM doctors WHERE user_id = ?', [req.user.id]);
        if (doctorRows.length === 0) return res.status(404).json({ message: 'Không tìm thấy hồ sơ bác sĩ.' });
        const doctorId = doctorRows[0].id;
        const [appRows] = await db.query('SELECT * FROM appointments WHERE id = ? AND doctor_id = ?', [id, doctorId]);
        if (appRows.length === 0) return res.status(403).json({ message: 'Bạn không có quyền cập nhật lịch hẹn này.' });
        await db.query('UPDATE appointments SET status = ? WHERE id = ?', [status, id]);
        res.json({ message: 'Cập nhật trạng thái thành công', status: status });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
});

app.get('/api/doctor/appointments/:id/details', verifyToken, isDoctor, async (req, res) => {
    try {
        const { id } = req.params;
        const [appointmentRows] = await db.query(`SELECT a.*, s.name as service_name, u.date_of_birth, u.gender FROM appointments a JOIN services s ON a.service_id = s.id LEFT JOIN users u ON a.user_id = u.id WHERE a.id = ?`, [id]);
        if (appointmentRows.length === 0) return res.status(404).json({ message: 'Không tìm thấy lịch hẹn.' });
        const appointmentDetails = appointmentRows[0];
        const [historyRows] = await db.query(`SELECT a.id, a.appointment_time, s.name as service_name, d.name as doctor_name, cn.diagnosis, cn.notes FROM appointments a JOIN services s ON a.service_id = s.id JOIN doctors d ON a.doctor_id = d.id LEFT JOIN clinical_notes cn ON a.id = cn.appointment_id WHERE a.patient_phone = ? AND a.id != ? AND a.status = 'completed' ORDER BY a.appointment_time DESC LIMIT 5`, [appointmentDetails.patient_phone, id]);
        const [currentNoteRows] = await db.query('SELECT * FROM clinical_notes WHERE appointment_id = ?', [id]);
        res.json({ details: appointmentDetails, history: historyRows, currentNote: currentNoteRows[0] || null });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
});

app.post('/api/doctor/appointments/:id/notes', verifyToken, isDoctor, async (req, res) => {
    try {
        const { id } = req.params;
        const { diagnosis, notes } = req.body;
        const [doctorRows] = await db.query('SELECT id FROM doctors WHERE user_id = ?', [req.user.id]);
        if (doctorRows.length === 0) return res.status(404).json({ message: 'Không tìm thấy hồ sơ bác sĩ.' });
        const doctorId = doctorRows[0].id;
        const [existingNote] = await db.query('SELECT id FROM clinical_notes WHERE appointment_id = ?', [id]);
        if (existingNote.length > 0) {
            await db.query('UPDATE clinical_notes SET diagnosis = ?, notes = ? WHERE appointment_id = ?', [diagnosis, notes, id]);
        } else {
            await db.query('INSERT INTO clinical_notes (appointment_id, doctor_id, diagnosis, notes) VALUES (?, ?, ?, ?)', [id, doctorId, diagnosis, notes]);
        }
        res.status(201).json({ message: 'Lưu ghi chú thành công!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
});

app.get('/api/doctor/schedules', verifyToken, isDoctor, async (req, res) => {
    const { year, month } = req.query;
    if (!year || !month) return res.status(400).json({ message: 'Vui lòng cung cấp năm và tháng.' });
    try {
        const [doctorRows] = await db.query('SELECT id FROM doctors WHERE user_id = ?', [req.user.id]);
        if (doctorRows.length === 0) return res.status(404).json({ message: 'Không tìm thấy hồ sơ bác sĩ.' });
        const doctorId = doctorRows[0].id;
        const [schedules] = await db.query('SELECT work_date, time_slots, is_day_off FROM doctor_schedules WHERE doctor_id = ? AND YEAR(work_date) = ? AND MONTH(work_date) = ?', [doctorId, year, month]);
        const parsedSchedules = schedules.map(s => ({ work_date: s.work_date, is_day_off: s.is_day_off, time_slots: s.time_slots ? JSON.parse(s.time_slots) : [] }));
        res.json(parsedSchedules);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
});

app.post('/api/doctor/schedules', verifyToken, isDoctor, async (req, res) => {
    const { work_date, time_slots, is_day_off } = req.body;
    if (!work_date) return res.status(400).json({ message: 'Vui lòng cung cấp ngày làm việc.' });
    try {
        const [doctorRows] = await db.query('SELECT id FROM doctors WHERE user_id = ?', [req.user.id]);
        if (doctorRows.length === 0) return res.status(404).json({ message: 'Không tìm thấy hồ sơ bác sĩ.' });
        const doctorId = doctorRows[0].id;
        const timeSlotsJson = JSON.stringify(time_slots || []);
        const sql = `INSERT INTO doctor_schedules (doctor_id, work_date, time_slots, is_day_off) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE time_slots = VALUES(time_slots), is_day_off = VALUES(is_day_off)`;
        await db.query(sql, [doctorId, work_date, timeSlotsJson, is_day_off || false]);
        res.status(201).json({ message: 'Cập nhật lịch làm việc thành công!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
});

app.get('/api/doctor/patients', verifyToken, isDoctor, async (req, res) => {
    try {
        const [doctorRows] = await db.query('SELECT id FROM doctors WHERE user_id = ?', [req.user.id]);
        if (doctorRows.length === 0) return res.status(404).json({ message: 'Không tìm thấy hồ sơ bác sĩ.' });
        const doctorId = doctorRows[0].id;
        const query = `SELECT MAX(patient_name) as patient_name, patient_phone FROM appointments WHERE doctor_id = ? AND patient_phone IS NOT NULL AND patient_phone != '' GROUP BY patient_phone ORDER BY patient_name ASC;`;
        const [patients] = await db.query(query, [doctorId]);
        res.json(patients);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
});

app.get('/api/doctor/patients/:phone/history', verifyToken, isDoctor, async (req, res) => {
    const { phone } = req.params;
    try {
        const [doctorRows] = await db.query('SELECT id FROM doctors WHERE user_id = ?', [req.user.id]);
        if (doctorRows.length === 0) return res.status(404).json({ message: 'Không tìm thấy hồ sơ bác sĩ.' });
        const doctorId = doctorRows[0].id;
        const query = `SELECT a.id, a.patient_name as patient_name_at_time, a.appointment_time, a.status, s.name as service_name, cn.diagnosis, cn.notes FROM appointments a JOIN services s ON a.service_id = s.id LEFT JOIN clinical_notes cn ON a.id = cn.appointment_id AND a.doctor_id = cn.doctor_id WHERE a.doctor_id = ? AND a.patient_phone = ? ORDER BY a.appointment_time DESC`;
        const [history] = await db.query(query, [doctorId, phone]);
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
});

// ==================================================
// === API CHO LỄ TÂN (RECEPTIONIST) ===============
// ==================================================
app.get('/api/receptionist/appointments', verifyToken, isReceptionist, async (req, res) => {
    try {
        const query = `SELECT a.id, a.patient_name, a.patient_phone, a.appointment_time, a.status, a.reminder_sent_at, d.name as doctor_name, s.name as service_name, COALESCE(u.email, a.patient_email) as patient_email FROM appointments a JOIN doctors d ON a.doctor_id = d.id JOIN services s ON a.service_id = s.id LEFT JOIN users u ON a.patient_phone = u.phone WHERE a.status = 'confirmed' AND a.reminder_sent_at IS NULL AND a.appointment_time >= CURDATE() ORDER BY a.appointment_time ASC`;
        const [appointments] = await db.query(query);
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
});

app.post('/api/receptionist/appointments/:id/remind', verifyToken, isReceptionist, async (req, res) => {
    const { id } = req.params;
    try {
        const [appRows] = await db.query(`SELECT a.patient_name, a.patient_phone, a.appointment_time, d.name as doctor_name, COALESCE(u.email, a.patient_email) as patient_email, a.reminder_sent_at FROM appointments a JOIN doctors d ON a.doctor_id = d.id LEFT JOIN users u ON a.patient_phone = u.phone WHERE a.id = ?`, [id]);
        if (appRows.length === 0) return res.status(404).json({ message: 'Không tìm thấy lịch hẹn.' });
        const appointment = appRows[0];
        if (appointment.reminder_sent_at) return res.status(400).json({ message: 'Lời nhắc cho lịch hẹn này đã được gửi trước đó.' });
        let emailSent = false;
        if (appointment.patient_email) {
            const mailOptions = { from: process.env.SENDGRID_FROM_EMAIL, to: appointment.patient_email, subject: `[CareSlot] Lời nhắc lịch hẹn của bạn`, html: `<p>Thân gửi ${appointment.patient_name},</p><p>Đây là lời nhắc cho lịch hẹn của bạn với bác sĩ ${appointment.doctor_name} vào lúc ${new Date(appointment.appointment_time).toLocaleString('vi-VN')}.</p><p>Vui lòng đến đúng giờ. Cảm ơn bạn!</p>` };
            await safeSendMail(mailOptions);
            emailSent = true;
        }
        let smsSent = false;
        if (appointment.patient_phone) {
            const smsMessage = `[CareSlot] Nhac lich hen: Ban co lich kham voi BS ${appointment.doctor_name} vao luc ${new Date(appointment.appointment_time).toLocaleString('vi-VN')}. Vui long den dung gio.`;
            await sendFakeSms(appointment.patient_phone, smsMessage);
            smsSent = true;
        }
        if (!emailSent && !smsSent) return res.status(400).json({ message: 'Không thể gửi lời nhắc vì bệnh nhân không có email hoặc SĐT.' });
        await db.query('UPDATE appointments SET reminder_sent_at = NOW() WHERE id = ?', [id]);
        res.json({ message: `Đã gửi lời nhắc thành công.` });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
});

app.get('/api/receptionist/pending-appointments', verifyToken, isReceptionist, async (req, res) => {
    try {
        const query = `SELECT a.id, a.patient_name, a.patient_phone, a.appointment_time, a.status, d.name as doctor_name, s.name as service_name, COALESCE(u.email, a.patient_email) as patient_email FROM appointments a JOIN doctors d ON a.doctor_id = d.id JOIN services s ON a.service_id = s.id LEFT JOIN users u ON a.patient_phone = u.phone WHERE a.status = 'pending' ORDER BY a.appointment_time ASC`;
        const [appointments] = await db.query(query);
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
});

app.post('/api/receptionist/appointments/:id/confirm', verifyToken, isReceptionist, async (req, res) => {
    const { id } = req.params;
    try {
        const [appRows] = await db.query(`SELECT a.status, a.patient_name, a.appointment_time, d.name as doctor_name, COALESCE(u.email, a.patient_email) as patient_email FROM appointments a JOIN doctors d ON a.doctor_id = d.id LEFT JOIN users u ON a.patient_phone = u.phone WHERE a.id = ?`, [id]);
        if (appRows.length === 0) return res.status(404).json({ message: 'Không tìm thấy lịch hẹn.' });
        const appointment = appRows[0];
        if (appointment.status !== 'pending') return res.status(400).json({ message: `Lịch hẹn đã ở trạng thái '${appointment.status}', không thể xác nhận.` });
        await db.query('UPDATE appointments SET status = ? WHERE id = ?', ['confirmed', id]);
        if (appointment.patient_email) {
            const mailOptions = { from: process.env.SENDGRID_FROM_EMAIL, to: appointment.patient_email, subject: `[CareSlot] Lịch hẹn của bạn đã được xác nhận`, html: `<p>Thân gửi ${appointment.patient_name},</p><p>Lịch hẹn của bạn với bác sĩ ${appointment.doctor_name} vào lúc ${new Date(appointment.appointment_time).toLocaleString('vi-VN')} đã được xác nhận.</p><p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi.</p>` };
            await safeSendMail(mailOptions);
        }
        res.json({ message: 'Lịch hẹn đã được xác nhận và email đã được gửi.' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
});

app.post('/api/receptionist/appointments/:id/cancel', verifyToken, isReceptionist, async (req, res) => {
    const { id } = req.params;
    try {
        const [appRows] = await db.query(`SELECT a.status, a.patient_name, a.appointment_time, d.name as doctor_name, COALESCE(u.email, a.patient_email) as patient_email FROM appointments a JOIN doctors d ON a.doctor_id = d.id LEFT JOIN users u ON a.patient_phone = u.phone WHERE a.id = ?`, [id]);
        if (appRows.length === 0) return res.status(404).json({ message: 'Không tìm thấy lịch hẹn.' });
        const appointment = appRows[0];
        if (appointment.status === 'cancelled' || appointment.status === 'completed') return res.status(400).json({ message: `Lịch hẹn đã ở trạng thái '${appointment.status}', không thể hủy.` });
        await db.query('UPDATE appointments SET status = ? WHERE id = ?', ['cancelled', id]);
        if (appointment.patient_email) {
            const mailOptions = { from: process.env.SENDGRID_FROM_EMAIL, to: appointment.patient_email, subject: `[CareSlot] Lịch hẹn của bạn đã bị hủy`, html: `<p>Thân gửi ${appointment.patient_name},</p><p>Chúng tôi rất tiếc phải thông báo lịch hẹn của bạn với bác sĩ ${appointment.doctor_name} vào lúc ${new Date(appointment.appointment_time).toLocaleString('vi-VN')} đã bị hủy.</p><p>Vui lòng liên hệ với chúng tôi nếu bạn có bất kỳ câu hỏi nào.</p>` };
            await safeSendMail(mailOptions);
        }
        res.json({ message: 'Lịch hẹn đã được hủy thành công.' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
});

app.get('/api/receptionist/patients', verifyToken, isReceptionist, async (req, res) => {
    try {
        const query = `
            SELECT p.id, p.name AS patient_name, p.dob, p.gender, p.relationship, p.phone AS patient_phone, u.full_name AS guardian_name
            FROM dependent_profiles p
            JOIN users u ON p.guardian_user_id = u.id

            UNION ALL

            SELECT u.id, u.full_name AS patient_name, u.date_of_birth AS dob, u.gender, 'Bản thân' AS relationship, u.phone AS patient_phone, u.full_name AS guardian_name
            FROM users u
            WHERE u.phone IS NOT NULL AND u.phone != ''

            UNION ALL

            SELECT NULL AS id,
                   MAX(a.patient_name) AS patient_name,
                   MAX(a.patient_dob) AS dob,
                   NULL AS gender,
                   'Bệnh nhân vãng lai' AS relationship,
                   a.patient_phone,
                   MAX(a.patient_name) AS guardian_name
            FROM appointments a
            WHERE a.patient_phone IS NOT NULL AND a.patient_phone != ''
            GROUP BY a.patient_phone

            ORDER BY patient_name ASC`;
        const [patients] = await db.query(query);
        res.json(patients);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
});

app.get('/api/receptionist/patients/:phone/history', verifyToken, isReceptionist, async (req, res) => {
    const { phone } = req.params;
    try {
        const query = `SELECT a.id, a.patient_name, a.appointment_time, a.status, s.name as service_name, d.name as doctor_name, cn.diagnosis, cn.notes FROM appointments a JOIN services s ON a.service_id = s.id JOIN doctors d ON a.doctor_id = d.id LEFT JOIN clinical_notes cn ON a.id = cn.appointment_id WHERE a.patient_phone = ? ORDER BY a.appointment_time DESC`;
        const [history] = await db.query(query, [phone]);
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
});

app.post('/api/receptionist/appointments', verifyToken, isReceptionist, async (req, res) => {
  try {
    const { patient_name, patient_phone, patient_email, service_id, doctor_id, appointment_date, appointment_slot } = req.body;
    if (!patient_name || !patient_phone || !service_id || !doctor_id || !appointment_date || !appointment_slot) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc.' });
    }

    const appointment_time = appointment_slot.includes('T')
      ? appointment_slot
      : `${appointment_date} ${appointment_slot}:00`;

    const [existing] = await db.query(
      'SELECT id FROM appointments WHERE doctor_id = ? AND appointment_time = ? AND status != "cancelled"',
      [doctor_id, appointment_time]
    );
    if (existing.length) return res.status(409).json({ message: 'Khung giờ đã có lịch.' });

    await db.query(
      `INSERT INTO appointments (service_id, patient_name, patient_phone, patient_email, doctor_id, appointment_time, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, 'confirmed', 'receptionist')`,
      [service_id, patient_name, patient_phone, patient_email || null, doctor_id, appointment_time]
    );
    res.status(201).json({ message: 'Đặt lịch thành công.' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
  }
});

app.put('/api/user/dependents/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { name, dob, gender, relationship, phone } = req.body;
    if (!name || !relationship) return res.status(400).json({ message: 'Tên và mối quan hệ là bắt buộc.' });

    const [rows] = await db.query('SELECT id FROM dependent_profiles WHERE id = ? AND guardian_user_id = ?', [id, req.user.id]);
    if (!rows.length) return res.status(404).json({ message: 'Không tìm thấy hồ sơ người thân.' });

    await db.query(
        'UPDATE dependent_profiles SET name = ?, dob = ?, gender = ?, relationship = ?, phone = ? WHERE id = ?',
        [name, dob || null, gender || null, relationship, phone || null, id]
    );
    res.json({ message: 'Cập nhật hồ sơ người thân thành công!' });
});

app.delete('/api/user/dependents/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const [rows] = await db.query('SELECT id FROM dependent_profiles WHERE id = ? AND guardian_user_id = ?', [id, req.user.id]);
    if (!rows.length) return res.status(404).json({ message: 'Không tìm thấy hồ sơ người thân.' });

    await db.query('DELETE FROM dependent_profiles WHERE id = ?', [id]);
    res.json({ message: 'Đã xóa hồ sơ người thân.' });
});

app.get('/api/admin/dashboard-metrics', verifyToken, isAdmin, async (req, res) => {
  try {
    const { range = 'week' } = req.query;

    const now = new Date();
    let start = new Date(now);

    if (range === 'day') {
      // đầu ngày hôm nay
      start.setHours(0, 0, 0, 0);
    } else if (range === 'week') {
      // Thứ 2 đầu tuần hiện tại
      const day = start.getDay(); // 0 CN, 1 T2...
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(start.setDate(diff));
      start.setHours(0, 0, 0, 0);
    } else if (range === 'month') {
      // ngày 1 của tháng hiện tại
      start = new Date(start.getFullYear(), start.getMonth(), 1);
    } else {
      return res.status(400).json({ message: 'range không hợp lệ' });
    }

    const toMySQLDateTime = (d) =>
      d.toISOString().slice(0, 19).replace('T', ' ');

    const startStr = toMySQLDateTime(start);

    // 1. Doanh thu theo ngày (chỉ confirmed + completed)
    const [revenueRows] = await db.query(
      `SELECT
         DATE(a.appointment_time) AS label,
         SUM(s.price) AS value
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       WHERE a.appointment_time >= ?
         AND a.status IN ('confirmed','completed')
       GROUP BY DATE(a.appointment_time)
       ORDER BY DATE(a.appointment_time)`,
      [startStr]
    );

    // 2. Số lịch hẹn mới (dựa vào created_at)
    const [[newAppsRow]] = await db.query(
      `SELECT COUNT(*) AS cnt
       FROM appointments
       WHERE created_at >= ?`,
      [startStr]
    );
    const newAppointments = newAppsRow?.cnt || 0;

    // 3. Tỉ lệ hủy trong khoảng thời gian
    const [[cancelRow]] = await db.query(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled
       FROM appointments
       WHERE appointment_time >= ?`,
      [startStr]
    );

    let cancelRate = 0;
    if (cancelRow.total > 0) {
      cancelRate = Math.round(
        ((cancelRow.cancelled || 0) * 100) / cancelRow.total
      );
    }

    // 4. Bác sĩ doanh thu cao nhất
    const [bestDoctorRows] = await db.query(
      `SELECT
         d.id,
         d.name,
         SUM(s.price) AS revenue
       FROM appointments a
       JOIN doctors d  ON a.doctor_id = d.id
       JOIN services s ON a.service_id = s.id
       WHERE a.appointment_time >= ?
         AND a.status IN ('confirmed','completed')
       GROUP BY d.id, d.name
       ORDER BY revenue DESC
       LIMIT 1`,
      [startStr]
    );
    const bestDoctor = bestDoctorRows.length
      ? { ...bestDoctorRows[0], revenue: Number(bestDoctorRows[0].revenue) }
      : null;

    // 5. Dịch vụ doanh thu cao nhất
    const [bestServiceRows] = await db.query(
      `SELECT
         s.id,
         s.name,
         SUM(s.price) AS revenue
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       WHERE a.appointment_time >= ?
         AND a.status IN ('confirmed','completed')
       GROUP BY s.id, s.name
       ORDER BY revenue DESC
       LIMIT 1`,
      [startStr]
    );
    const bestService = bestServiceRows.length
      ? { ...bestServiceRows[0], revenue: Number(bestServiceRows[0].revenue) }
      : null;

    const formattedRevenue = revenueRows.map((row) => ({
      label: row.label,
      value: Number(row.value || 0),
    }));

    res.json({
      revenue: formattedRevenue,
      newAppointments,
      cancelRate,
      bestDoctor,
      bestService,
    });
  } catch (error) {
    console.error('[/api/admin/dashboard-metrics] error:', error);
    res.status(500).json({ message: 'Lỗi server khi lấy số liệu dashboard.' });
  }
});

app.get('/api/chat/my-conversations', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    // Bỏ điều kiện "AND c.status IN ('active', 'pending')"
    const query = `
      SELECT c.*, 
             p.full_name as patient_name, 
             s.full_name as staff_name 
      FROM conversations c
      LEFT JOIN users p ON c.user_id = p.id
      LEFT JOIN users s ON c.staff_id = s.id
      WHERE c.staff_id = ?
      ORDER BY c.updated_at DESC
    `;
    // Sửa lại query để lấy cả conversation của guest
    const guestQuery = `
      SELECT c.*, 
             'Khách vãng lai' as patient_name,
             s.full_name as staff_name
      FROM conversations c
      LEFT JOIN users s ON c.staff_id = s.id
      WHERE c.staff_id = ? AND c.user_id IS NULL
    `;
    const userQuery = `
      SELECT c.*, 
             p.full_name as patient_name,
             s.full_name as staff_name
      FROM conversations c
      JOIN users p ON c.user_id = p.id
      LEFT JOIN users s ON c.staff_id = s.id
      WHERE c.staff_id = ? AND c.user_id IS NOT NULL
    `;

    const [guestConversations] = await db.query(guestQuery, [userId]);
    const [userConversations] = await db.query(userQuery, [userId]);

    const allConversations = [...guestConversations, ...userConversations].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

    res.json(allConversations);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách hội thoại:", error);
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách hội thoại.' });
  }
});

app.get('/api/chat/conversations/:id/messages', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const [messages] = await db.query(
            'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC',
            [id]
        );
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy tin nhắn.' });
    }
});

app.get('/api/chat/active-conversation', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        // Tìm cuộc trò chuyện gần nhất chưa được đóng
        const [rows] = await db.query(
            `SELECT * FROM conversations 
             WHERE (user_id = ? OR staff_id = ?) AND status != 'closed' 
             ORDER BY updated_at DESC LIMIT 1`,
            [userId, userId]
        );
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.json(null); // Không có cuộc trò chuyện nào đang hoạt động
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server.' });
    }
});

setInterval(async () => {
  try {
    // BƯỚC 1: Chuyển các cuộc trò chuyện của guest không hoạt động sau 2 phút sang 'expired'
    const [expiredResult] = await db.query(
      `UPDATE conversations
       SET status = 'expired'
       WHERE status = 'active'
         AND user_id IS NULL
         AND updated_at < (NOW() - INTERVAL 2 MINUTE)`
    );

    if (expiredResult.affectedRows > 0) {
        console.log(`[CRON] Đã chuyển ${expiredResult.affectedRows} cuộc trò chuyện của guest sang 'expired'.`);
    }

    // BƯỚC 2: Xóa các cuộc trò chuyện đã 'expired' hơn 2 phút
    // (tức là tổng cộng 4 phút kể từ tin nhắn cuối cùng)
    const [deleteResult] = await db.query(
      `DELETE FROM conversations
       WHERE status = 'expired'
         AND user_id IS NULL
         AND updated_at < (NOW() - INTERVAL 4 MINUTE)`
    );

    if (deleteResult.affectedRows > 0) {
        console.log(`[CRON] Đã xóa vĩnh viễn ${deleteResult.affectedRows} cuộc trò chuyện hết hạn.`);
    }

  } catch (err) {
    console.error('[CRON] Lỗi khi dọn dẹp hội thoại guest:', err);
  }
}, 30 * 1000);

// ==================================================
// === KHỞI CHẠY SERVER ============================
// ==================================================
server.listen(port, () => {
  console.log('========================================');
  console.log(`SERVER ĐÃ KHỞI ĐỘNG LẠI LÚC: ${new Date().toLocaleTimeString()}`);
  console.log(`Server đang lắng nghe tại http://localhost:${port}`);
  console.log('========================================');
});