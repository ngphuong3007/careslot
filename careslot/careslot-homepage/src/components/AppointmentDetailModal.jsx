import React, { useState, useEffect } from 'react';
import './AppointmentDetailModal.css';
import BookingModal from './BookingModal';
import { apiRequest } from '../utils/api';

// SỬA LẠI: Thêm prop onSaveSuccess
const AppointmentDetailModal = ({ appointmentId, onClose, onSaveSuccess }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [diagnosis, setDiagnosis] = useState('');
    const [notes, setNotes] = useState('');
    const [message, setMessage] = useState('');
    
    const [isRebooking, setIsRebooking] = useState(false);

    useEffect(() => {
        if (!appointmentId) return;
        const fetchDetails = async () => {
            try {
                setLoading(true);
                const result = await apiRequest(`/api/doctor/appointments/${appointmentId}/details`);
                setData(result);
                if (result.currentNote) {
                    setDiagnosis(result.currentNote.diagnosis || '');
                    setNotes(result.currentNote.notes || '');
                } else {
                    setDiagnosis('');
                    setNotes('');
                }
                setMessage('');
                setError('');
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [appointmentId]);

    const handleSaveNote = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            await apiRequest(`/api/doctor/appointments/${appointmentId}/notes`, {
                method: 'POST',
                body: JSON.stringify({ diagnosis, notes }),
            });
            setMessage('Lưu ghi chú thành công!');
            // THÊM MỚI: Gọi callback để tải lại dữ liệu ở component cha
            if (onSaveSuccess) {
                onSaveSuccess();
            }
        } catch (err) {
            setError(err.message);
        }
    };

    // THÊM MỚI: Hàm cập nhật trạng thái
    const handleUpdateStatus = async (newStatus) => {
        setMessage('');
        setError('');
        try {
            await apiRequest(`/api/doctor/appointments/${appointmentId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus }),
            });
            setMessage(`Đã cập nhật trạng thái thành công!`);
            // THÊM MỚI: Gọi callback để tải lại dữ liệu ở component cha
            if (onSaveSuccess) {
                onSaveSuccess();
            }
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <div className="modal-overlay"><div className="modal-content"><p>Đang tải...</p></div></div>;
    if (error) return <div className="modal-overlay"><div className="modal-content"><p className="error-message">{error}</p><button onClick={onClose}>Đóng</button></div></div>;
    if (!data) return null;

    const { details, history } = data;

    const rebookingInitialData = {
        patientName: `Tái khám: ${details.patient_name}`,
        patientPhone: details.patient_phone,
        serviceId: details.service_id,
        doctorId: details.doctor_id,
    };

    return (
        <>
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content appointment-detail-modal" onClick={e => e.stopPropagation()}>
                    <button className="close-button" onClick={onClose}>×</button>
                    <h2>Chi tiết lịch hẹn</h2>
                    
                    <div className="modal-section">
                        <h4>Thông tin bệnh nhân</h4>
                        <p><strong>Tên:</strong> {details.patient_name}</p>
                        <p><strong>SĐT:</strong> {details.patient_phone}</p>
                    </div>

                    <div className="modal-section">
                        <h4>Thông tin lịch hẹn</h4>
                        <p><strong>Dịch vụ:</strong> {details.service_name}</p>
                        <p><strong>Trạng thái hiện tại:</strong> {details.status}</p>
                    </div>

                    <div className="modal-section">
                        <h4>Ghi chú chẩn đoán</h4>
                        <form onSubmit={handleSaveNote}>
                            <input 
                                type="text" 
                                placeholder="Chẩn đoán..." 
                                value={diagnosis} 
                                onChange={e => setDiagnosis(e.target.value)} 
                            />
                            <textarea 
                                placeholder="Ghi chú chi tiết về tình trạng và phương pháp điều trị..."
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                            ></textarea>
                            <div className="form-actions">
                                <button type="submit">Lưu ghi chú</button>
                                <button type="button" className="complete-btn" onClick={() => handleUpdateStatus('completed')}>Hoàn thành</button>
                                <button type="button" className="cancel-btn" onClick={() => handleUpdateStatus('cancelled')}>Hủy lịch</button>
                                <button type="button" className="rebook-btn" onClick={() => setIsRebooking(true)}>
                                    Tái khám
                                </button>
                            </div>
                            {message && <p className="success-message" style={{marginTop: '10px'}}>{message}</p>}
                        </form>
                    </div>

                    <div className="modal-section">
                        <h4>Lịch sử khám trước đây</h4>
                        {history && history.length > 0 ? (
                            <ul className="history-list">
                                {history.map(item => (
                                    <li key={item.id}>
                                        <p><strong>Ngày khám:</strong> {new Date(item.appointment_time).toLocaleString('vi-VN')}</p>
                                        <p><strong>Bác sĩ:</strong> {item.doctor_name}</p>
                                        <p><strong>Chẩn đoán:</strong> {item.diagnosis || 'Không có'}</p>
                                    </li>
                                ))}
                            </ul>
                        ) : <p>Không tìm thấy lịch sử khám.</p>}
                    </div>
                </div>
            </div>

            {isRebooking && (
                <BookingModal 
                    onClose={() => setIsRebooking(false)}
                    initialData={rebookingInitialData}
                    isReExam={true}
                />
            )}
        </>
    );
};

export default AppointmentDetailModal;