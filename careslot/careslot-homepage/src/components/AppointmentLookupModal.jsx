import React, { useState } from 'react';
import './AppointmentLookupModal.css';
import { apiRequest } from '../utils/api';

const AppointmentLookupModal = ({ onClose }) => {
    const [phone, setPhone] = useState('');
    const [appointments, setAppointments] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!phone) {
            setError('Vui lòng nhập số điện thoại.');
            return;
        }
        setIsLoading(true);
        setError('');
        setSearched(true);

        try {
            const data = await apiRequest(
                `/api/public/appointments/lookup?phone=${phone}`
            );
            setAppointments(data);
            } catch (err) {
            setError(err.message);
            setAppointments([]);
            } finally {
            setIsLoading(false);
            }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'pending': return 'Chờ xác nhận';
            case 'confirmed': return 'Đã xác nhận';
            case 'cancelled': return 'Đã hủy';
            case 'completed': return 'Đã hoàn thành';
            default: return status;
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content lookup-modal" onClick={e => e.stopPropagation()}>
                <button className="close-button" onClick={onClose}>×</button>
                <h2>Tra cứu Lịch hẹn</h2>
                <form onSubmit={handleSearch} className="lookup-form">
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Nhập số điện thoại của bạn"
                        required
                    />
                    <button type="submit" disabled={isLoading}>
                        {isLoading ? 'Đang tìm...' : 'Tra cứu'}
                    </button>
                </form>

                {error && <p className="error-message">{error}</p>}

                <div className="lookup-results">
                    {searched && !isLoading && (
                        appointments.length > 0 ? (
                            <ul>
                                {appointments.map((app, index) => (
                                    <li key={index} className={`appointment-item status-${app.status}`}>
                                        <div className="appointment-time">{new Date(app.appointment_time).toLocaleString('vi-VN')}</div>
                                        <div className="appointment-details">
                                            <p><strong>Bác sĩ:</strong> {app.doctor_name}</p>
                                            <p><strong>Dịch vụ:</strong> {app.service_name}</p>
                                        </div>
                                        <div className="appointment-status">{getStatusText(app.status)}</div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>Không tìm thấy lịch hẹn nào sắp tới cho số điện thoại này.</p>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default AppointmentLookupModal;