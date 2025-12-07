import React, { useState, useEffect, useCallback } from 'react';
import './DoctorDashboard.css';
import AppointmentDetailModal from '../components/AppointmentDetailModal'; // THÊM IMPORT
import { apiRequest } from '../utils/api';

const getWeekDateRange = (date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
        days: Array.from({ length: 7 }).map((_, i) => {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            return d;
        })
    };
};

const TIME_SLOTS = Array.from({ length: 18 }).map((_, i) => {
    const hour = 8 + Math.floor(i / 2);
    const minute = i % 2 === 0 ? '00' : '30';
    return `${String(hour).padStart(2, '0')}:${minute}`;
});

// --- Main Component ---
const DoctorDashboard = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [weekData, setWeekData] = useState({ days: [] });
    const [appointments, setAppointments] = useState({});
    const [loading, setLoading] = useState(true);
    
    // THÊM STATE ĐỂ QUẢN LÝ MODAL
    const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);

    const fetchAppointments = useCallback(() => {
        const range = getWeekDateRange(currentDate);
        setWeekData(range);
        setLoading(true);

        apiRequest(`/api/doctor/appointments/range?startDate=${range.start}&endDate=${range.end}`)
            .then(data => {
                const appointmentsBySlot = {};
                data.forEach(app => {
                    const appTime = new Date(app.appointment_time);
                    const dayKey = appTime.toISOString().split('T')[0];
                    const timeKey = `${String(appTime.getHours()).padStart(2, '0')}:${String(appTime.getMinutes()).padStart(2, '0')}`;
                    
                    if (!appointmentsBySlot[dayKey]) {
                        appointmentsBySlot[dayKey] = {};
                    }
                    appointmentsBySlot[dayKey][timeKey] = app;
                });
                setAppointments(appointmentsBySlot);
                setLoading(false);
            })
            .catch(error => {
                console.error(error);
                setLoading(false);
            });
    }, [currentDate]);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    // ... (các hàm goToPreviousWeek, goToNextWeek, goToToday không đổi) ...
    const goToPreviousWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 7);
        setCurrentDate(newDate);
    };

    const goToNextWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 7);
        setCurrentDate(newDate);
    };
    
    const goToToday = () => {
        setCurrentDate(new Date());
    };

    return (
        <div className="doctor-dashboard">
            {/* ... (Phần header không đổi) ... */}
            <div className="dashboard-header">
                <h2>Lịch làm việc theo Tuần</h2>
                <div className="navigation-controls">
                    <button onClick={goToPreviousWeek}>&lt; Tuần trước</button>
                    <button onClick={goToToday}>Hôm nay</button>
                    <button onClick={goToNextWeek}>Tuần sau &gt;</button>
                </div>
                <p className="week-display">
                    Tuần từ {weekData.start && new Date(weekData.start).toLocaleDateString('vi-VN')}
                    {' - '}
                    {weekData.end && new Date(weekData.end).toLocaleDateString('vi-VN')}
                </p>
            </div>

            {loading ? <p>Đang tải dữ liệu...</p> : (
                <div className="schedule-grid-container">
                    <table className="schedule-grid">
                        <thead>
                            {/* ... (Phần thead không đổi) ... */}
                            <tr>
                                <th className="time-header">Giờ</th>
                                {weekData.days.map(day => (
                                    <th key={day.toISOString()}>
                                        <div>{['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][day.getDay()]}</div>
                                        <div>{day.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {TIME_SLOTS.map(time => (
                                <tr key={time}>
                                    <td className="time-cell">{time}</td>
                                    {weekData.days.map(day => {
                                        const dayKey = day.toISOString().split('T')[0];
                                        const appointment = appointments[dayKey]?.[time];
                                        return (
                                            <td 
                                                key={dayKey} 
                                                className={`slot-cell ${appointment ? 'booked' : ''}`}
                                                // SỬA LẠI: Thêm onClick để mở modal
                                                onClick={() => appointment && setSelectedAppointmentId(appointment.id)}
                                            >
                                                {appointment && (
                                                    <div className={`appointment-card status-bg-${appointment.status}`}>
                                                        <strong>{appointment.patient_name}</strong>
                                                        <span>{appointment.service_name}</span>
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* THÊM MODAL VÀO CUỐI */}
            {selectedAppointmentId && (
                <AppointmentDetailModal 
                    appointmentId={selectedAppointmentId}
                    onClose={() => setSelectedAppointmentId(null)}
                    onSaveSuccess={() => {
                        // Tải lại dữ liệu trên dashboard sau khi lưu thành công
                        fetchAppointments();
                    }}
                />
            )}
        </div>
    );
};

export default DoctorDashboard;