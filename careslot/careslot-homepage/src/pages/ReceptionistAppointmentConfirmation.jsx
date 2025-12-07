import React, { useState, useEffect, useCallback } from 'react';
import './ReceptionistAppointmentConfirmation.css';
import { apiRequest } from '../utils/api';

const ReceptionistAppointmentConfirmation = () => {
    const [pendingAppointments, setPendingAppointments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [feedback, setFeedback] = useState({});

    const fetchPendingAppointments = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await apiRequest('/api/receptionist/pending-appointments');
            setPendingAppointments(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPendingAppointments();
    }, [fetchPendingAppointments]);

    const handleCancel = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn hủy lịch hẹn này không?')) {
            return;
        }
        setFeedback(prev => ({ ...prev, [id]: { loading: true, error: null } }));
        try {
            await apiRequest(`/api/receptionist/appointments/${id}/cancel`, { method: 'POST' });
            // Xóa lịch hẹn đã hủy khỏi danh sách
            setPendingAppointments(prev => prev.filter(app => app.id !== id));
        } catch (err) {
            setFeedback(prev => ({ ...prev, [id]: { loading: false, error: err.message } }));
        }
    };

    const handleConfirm = async (id) => {
        setFeedback(prev => ({ ...prev, [id]: { loading: true, error: null } }));
        try {
            await apiRequest(`/api/receptionist/appointments/${id}/confirm`, { method: 'POST' });
            // Xóa lịch hẹn đã xác nhận khỏi danh sách
            setPendingAppointments(prev => prev.filter(app => app.id !== id));
        } catch (err) {
            setFeedback(prev => ({ ...prev, [id]: { loading: false, error: err.message } }));
        }
    };

    if (isLoading) return <p>Đang tải danh sách lịch hẹn...</p>;
    if (error) return <p className="error-message">Lỗi: {error}</p>;

    return (
        <div className="confirmation-dashboard">
            <h1>Xác nhận Lịch hẹn</h1>
            {pendingAppointments.length === 0 ? (
                <p>Không có lịch hẹn nào đang chờ xác nhận.</p>
            ) : (
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
                        {pendingAppointments.map(app => (
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
                                        onClick={() => handleConfirm(app.id)}
                                        disabled={feedback[app.id]?.loading}
                                        className="confirm-btn"
                                    >
                                        {feedback[app.id]?.loading ? 'Đang xử lý...' : 'Xác nhận'}
                                    </button>
                                    <button
                                            onClick={() => handleCancel(app.id)}
                                            disabled={feedback[app.id]?.loading}
                                            className="cancel-btn"
                                        >
                                            {feedback[app.id]?.loading ? '...' : 'Hủy'}
                                        </button>
                                    {feedback[app.id]?.error && <div className="feedback-error">{feedback[app.id].error}</div>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default ReceptionistAppointmentConfirmation;