import React, { useState, useEffect } from 'react';
import './DoctorSection.css';
import { apiRequest, API_BASE } from '../utils/api';

// Nhận prop currentUser từ Home.jsx
const DoctorSection = ({ currentUser }) => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/api/doctors');
      setDoctors(data);
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu bác sĩ.');
    } finally {
      setLoading(false);
    }
  };

  fetchDoctors();
}, []);

  return (
    <section id="doctors" className="doctor-section">
      <div className="container">
        <h2>Đội ngũ Bác sĩ</h2>
        <p className="section-subtitle">Các chuyên gia tận tâm và giàu kinh nghiệm của chúng tôi.</p>
        
        {loading && <p>Đang tải danh sách bác sĩ...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        
        {!loading && !error && (
          <div className="doctor-list">
            {doctors.length > 0 ? (
              doctors.map((doctor) => {
                // Kiểm tra xem bác sĩ này có phải là người dùng đang đăng nhập không
                // Giả định rằng JWT token của bạn có chứa doctor_id
                const isCurrentUser = currentUser && currentUser.role === 'doctor' && currentUser.doctor_id === doctor.id;

                return (
                  // Thêm class 'current-user-doctor' nếu là bác sĩ đang đăng nhập
                  <div key={doctor.id} className={`doctor-card ${isCurrentUser ? 'current-user-doctor' : ''}`}>
                    <img 
                      src={`${API_BASE}${doctor.image_url}`} 
                      alt={doctor.name} 
                      className="doctor-image" 
                    />
                    {/* Nếu là bác sĩ đang đăng nhập, hiển thị "Tôi" */}
                    <h3 className="doctor-name">{isCurrentUser ? 'Tôi' : doctor.name}</h3>
                    <p className="doctor-specialty">{doctor.specialty}</p>
                    {isCurrentUser && <div className="doctor-tag">Tôi</div>}
                  </div>
                );
              })
            ) : (
              <p>Hiện chưa có thông tin bác sĩ nào.</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default DoctorSection;