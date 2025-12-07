import React, { useState, useEffect, useCallback } from 'react';
import './ReceptionistDashboard.css';
import { apiRequest } from '../utils/api';

const ReceptionistDashboard = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [feedback, setFeedback] = useState({});

    const fetchAppointments = useCallback(() => {
        setLoading(true);
        setError('');
        setFeedback({});
        apiRequest(`/api/receptionist/appointments`)
            .then(data => {
                setAppointments(data);
            })
            .catch(err => {
                setError(err.message);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    const handleSendReminder = (id) => {
        setFeedback(prev => ({ ...prev, [id]: { loading: true } }));
        apiRequest(`/api/receptionist/appointments/${id}/remind`, { method: 'POST' })
            .then(() => {
                fetchAppointments();
            })
            .catch(err => {
                setFeedback(prev => ({ ...prev, [id]: { error: err.message } }));
            });
    };

    return (
        <div className="receptionist-dashboard">
            <h1>Gửi Lời nhắc Lịch hẹn</h1>

            {error && <p className="error-message">{error}</p>}
            {loading ? <p>Đang tải lịch hẹn...</p> : (
                <table className="appointments-table">
                    <thead>
                        <tr>
                            <th>Thời gian</th>
                            <th>Bệnh nhân</th>
                            <th>Bác sĩ</th>
                            <th>Dịch vụ</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {appointments.length > 0 ? appointments.map(app => (
                            <tr key={app.id}>
                                <td>{new Date(app.appointment_time).toLocaleString('vi-VN')}</td>
                                <td>
                                    {app.patient_name}
                                    <div className="patient-contact">SĐT: {app.patient_phone}</div>
                                    <div className="patient-contact">{app.patient_email || 'Không có email'}</div>
                                </td>
                                <td>{app.doctor_name}</td>
                                <td>{app.service_name}</td>
                                <td>
                                    <button
                                        onClick={() => handleSendReminder(app.id)}
                                        disabled={(!app.patient_email && !app.patient_phone) || feedback[app.id]?.loading}
                                        className={app.reminder_sent_at ? 'sent' : ''}
                                    >
                                        {feedback[app.id]?.loading ? 'Đang gửi...' : 'Gửi nhắc nhở'}
                                    </button>
                                    {feedback[app.id]?.error && <div className="feedback-error">{feedback[app.id].error}</div>}
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5">Không có lịch hẹn nào cần gửi lời nhắc.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default ReceptionistDashboard;