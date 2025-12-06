import React, { useState, useEffect, useMemo } from 'react';
import './PatientManagement.css';

const apiRequest = async (url) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:5000${url}`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch data');
    return response.json();
};

// SỬA LẠI: Thêm prop 'role' để xác định vai trò
const PatientManagement = ({ role }) => {
    const [patients, setPatients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [expandedHistoryId, setExpandedHistoryId] = useState(null);

    // SỬA LẠI: API endpoint sẽ thay đổi dựa trên vai trò
    const patientsApiUrl = role === 'doctor' ? '/api/doctor/patients' : '/api/receptionist/patients';
    const historyApiUrlPrefix = role === 'doctor' ? '/api/doctor/patients' : '/api/receptionist/patients';

    useEffect(() => {
        // SỬA LẠI: Sử dụng URL API động
        apiRequest(patientsApiUrl)
            .then(data => {
                setPatients(data);
                setLoading(false);
            })
            .catch(error => {
                console.error(error);
                setLoading(false);
            });
    }, [patientsApiUrl]); // Phụ thuộc vào URL để fetch lại khi role thay đổi

    const filteredPatients = useMemo(() => {
        if (!searchTerm) return patients;
        return patients.filter(p =>
            p.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.patient_phone.includes(searchTerm)
        );
    }, [patients, searchTerm]);

    const handleSelectPatient = (patient) => {
        setSelectedPatient(patient);
        setHistoryLoading(true);
        setExpandedHistoryId(null);
        // SỬA LẠI: Sử dụng prefix API đúng
        apiRequest(`${historyApiUrlPrefix}/${patient.patient_phone}/history`)
            .then(data => {
                setHistory(data);
                setHistoryLoading(false);
            })
            .catch(error => {
                console.error(error);
                setHistoryLoading(false);
            });
    };

    const handleToggleHistoryDetail = (id) => {
        setExpandedHistoryId(prevId => (prevId === id ? null : id));
    };

    // ...existing code...
return (
        <div className="patient-management">
            <h1>Quản lý Bệnh nhân</h1>
            <div className="patient-layout">
                <div className="patient-list-container">
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên hoặc SĐT..."
                        className="search-input"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    {/* Thêm div mới ở đây để tạo vùng cuộn */}
                    <div className="list-scroll-area">
                        {loading ? <p>Đang tải danh sách...</p> : (
                            <ul className="patient-list">
                                {filteredPatients.map((p, idx) => (
                                    <li
                                        key={p.patient_id ?? `${p.patient_phone}-${idx}`}
                                        className={`patient-item ${selectedPatient?.patient_phone === p.patient_phone ? 'active' : ''}`}
                                        onClick={() => handleSelectPatient(p)}
                                    >
                                        <strong>{p.patient_name}</strong>
                                        <span>{p.patient_phone}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
                <div className="patient-details-container">
                    {selectedPatient ? (
                        <>
                            <h2>Lịch sử khám của: {selectedPatient.patient_name}</h2>
                            {historyLoading ? <p>Đang tải lịch sử...</p> : (
                                <div className="history-list">
                                    {history.length > 0 ? history.map(h => (
                                        <div 
                                            key={h.id} 
                                            className={`history-item ${expandedHistoryId === h.id ? 'expanded' : ''}`}
                                            onClick={() => handleToggleHistoryDetail(h.id)}
                                        >
                                            <div className="history-item-header">
                                                <div>
                                                    <strong>Ngày khám: {new Date(h.appointment_time).toLocaleString('vi-VN')}</strong>
                                                    {/* SỬA LẠI: Hiển thị tên bác sĩ cho lễ tân */}
                                                    {role === 'receptionist' && <p><strong>Bác sĩ:</strong> {h.doctor_name}</p>}
                                                    <p><strong>Dịch vụ:</strong> {h.service_name}</p>
                                                </div>
                                                <span className={`status-badge status-${h.status}`}>{h.status}</span>
                                            </div>
                                            {expandedHistoryId === h.id && (
                                                <div className="history-item-details">
                                                    <p><strong>Chẩn đoán:</strong> {h.diagnosis || 'Chưa có'}</p>
                                                    <p><strong>Ghi chú của bác sĩ:</strong> {h.notes || 'Không có'}</p>
                                                </div>
                                            )}
                                        </div>
                                    )) : <p>Bệnh nhân này chưa có lịch sử khám.</p>}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="placeholder-text">
                            <p>Chọn một bệnh nhân từ danh sách bên trái để xem chi tiết lịch sử khám bệnh.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PatientManagement;