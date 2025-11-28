const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',      // Địa chỉ server MySQL (của XAMPP)
  user: 'root',           // User mặc định của XAMPP
  password: '',           // Password mặc định của XAMPP là rỗng
  database: 'careslot_nha_khoa', // Tên database bạn sẽ tạo cho nha khoa
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool.promise();