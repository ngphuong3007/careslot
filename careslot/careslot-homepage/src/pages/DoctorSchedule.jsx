import React, { useState, useEffect, useCallback } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './DoctorSchedule.css';
import { apiRequest } from '../utils/api';

// Hàm helper để chuyển đổi Date object sang chuỗi YYYY-MM-DD an toàn
const toDateKey = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Tạo danh sách các khung giờ chuẩn trong ngày
const generateTimeSlots = (start, end, interval) => {
    const slots = [];
    let currentTime = new Date(`1970-01-01T${start}:00`);
    const endTime = new Date(`1970-01-01T${end}:00`);

    while (currentTime < endTime) {
        slots.push(currentTime.toTimeString().substring(0, 5));
        currentTime.setMinutes(currentTime.getMinutes() + interval);
    }
    return slots;
};

const ALL_TIME_SLOTS = generateTimeSlots('08:00', '17:00', 30);

const DoctorSchedule = () => {
    const [schedules, setSchedules] = useState({});
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTimeSlots, setSelectedTimeSlots] = useState(new Set());
    const [isDayOff, setIsDayOff] = useState(false);
    const [activeMonth, setActiveMonth] = useState(new Date());
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // Fetch lịch làm việc của tháng hiện tại
    const fetchSchedules = useCallback(async (date) => {
        try {
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const data = await apiRequest(`/api/doctor/schedules?year=${year}&month=${month}`);
            
            const schedulesMap = data.reduce((acc, schedule) => {
                const dateKey = toDateKey(new Date(schedule.work_date));
                acc[dateKey] = {
                    time_slots: schedule.time_slots || [],
                    is_day_off: schedule.is_day_off,
                };
                return acc;
            }, {});
            setSchedules(schedulesMap);
        } catch (err) {
            setError(err.message);
        }
    }, []);

    useEffect(() => {
        fetchSchedules(activeMonth);
    }, [activeMonth, fetchSchedules]);

    // Cập nhật form khi chọn ngày mới
    useEffect(() => {
        const dateKey = toDateKey(selectedDate);
        const scheduleForDay = schedules[dateKey];
        
        // SỬA LẠI LOGIC MẶC ĐỊNH
        if (scheduleForDay) {
            // Nếu có lịch đã đăng ký, sử dụng lịch đó
            setSelectedTimeSlots(new Set(scheduleForDay.time_slots));
            setIsDayOff(scheduleForDay.is_day_off);
        } else {
            // Nếu không có lịch, mặc định là làm việc cả ngày
            setSelectedTimeSlots(new Set(ALL_TIME_SLOTS));
            setIsDayOff(false);
        }
    }, [selectedDate, schedules]);

    const handleTimeSlotChange = (slot) => {
        const newSet = new Set(selectedTimeSlots);
        if (newSet.has(slot)) {
            newSet.delete(slot);
        } else {
            newSet.add(slot);
        }
        setSelectedTimeSlots(newSet);
        setIsDayOff(false); // Nếu chọn giờ thì không phải ngày nghỉ
    };

    const handleSave = async () => {
        setMessage('');
        setError('');
        try {
            const payload = {
                work_date: toDateKey(selectedDate),
                time_slots: Array.from(selectedTimeSlots),
                is_day_off: isDayOff,
            };
            const result = await apiRequest('/api/doctor/schedules', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            setMessage(result.message);
            fetchSchedules(activeMonth); // Tải lại lịch sau khi lưu
        } catch (err) {
            setError(err.message);
        }
    };

    const handleSetDayOff = () => {
        setIsDayOff(true);
        setSelectedTimeSlots(new Set());
    };

    // Hàm để style cho các ngày trên lịch
    const tileContent = ({ date, view }) => {
        if (view === 'month') {
            const dateKey = toDateKey(date);
            const schedule = schedules[dateKey];
            
            // SỬA LẠI LOGIC HIỂN THỊ
            if (schedule) {
                if (schedule.is_day_off) {
                    // Nếu đăng ký nghỉ, hiển thị chấm đỏ
                    return <p className="schedule-dot day-off"></p>;
                }
                // Nếu có đăng ký giờ làm (dù ít hay nhiều), hiển thị chấm xanh
                if (schedule.time_slots.length > 0) {
                    return <p className="schedule-dot working-day"></p>;
                }
            } else {
                // Nếu không có lịch đăng ký, mặc định là ngày làm việc, hiển thị chấm xanh
                return <p className="schedule-dot working-day"></p>;
            }
        }
        return null;
    };

    return (
        <div className="schedule-management-container">
            <h1>Quản lý Lịch làm việc</h1>
            {error && <p className="error-message">{error}</p>}
            <div className="schedule-main">
                <div className="calendar-wrapper">
                    <Calendar
                        onChange={setSelectedDate}
                        value={selectedDate}
                        onActiveStartDateChange={({ activeStartDate }) => setActiveMonth(activeStartDate)}
                        tileContent={tileContent}
                        minDate={new Date()}
                    />
                </div>
                <div className="time-slot-editor">
                    <h3>Chỉnh sửa lịch cho ngày: {selectedDate.toLocaleDateString('vi-VN')}</h3>
                    <div className="time-slots-grid">
                        {ALL_TIME_SLOTS.map(slot => (
                            <label key={slot} className="time-slot-label">
                                <input
                                    type="checkbox"
                                    checked={selectedTimeSlots.has(slot)}
                                    onChange={() => handleTimeSlotChange(slot)}
                                    disabled={isDayOff}
                                />
                                {slot}
                            </label>
                        ))}
                    </div>
                    <div className="day-off-section">
                        <label>
                            <input
                                type="checkbox"
                                checked={isDayOff}
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        handleSetDayOff();
                                    } else {
                                        // Khi bỏ check nghỉ cả ngày, quay về trạng thái mặc định là làm full
                                        setIsDayOff(false);
                                        setSelectedTimeSlots(new Set(ALL_TIME_SLOTS));
                                    }
                                }}
                            />
                            Đăng ký nghỉ cả ngày
                        </label>
                    </div>
                    <button onClick={handleSave} className="save-schedule-btn">Lưu Lịch</button>
                    {message && <p className="success-message">{message}</p>}
                </div>
            </div>
        </div>
    );
};

export default DoctorSchedule;