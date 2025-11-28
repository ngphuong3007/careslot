import React from 'react';
import './ClinicInfoSection.css'; // Bạn sẽ cần tạo file CSS này

const ClinicInfoSection = () => {
  return (
    <section id="clinic-info" className="clinic-info-section">
      <div className="container">
        <h2>Thông tin phòng khám</h2>
        <div className="info-grid">
          <div className="info-item">
            <h4>📍 Địa chỉ</h4>
            <p>475A Điện Biên Phủ, Thạnh Mỹ Tây, TP. Hồ Chí Minh</p>
          </div>
          <div className="info-item">
            <h4>📞 Điện thoại</h4>
            <p>(028) 3812 3456</p>
          </div>
          <div className="info-item">
            <h4>⏰ Giờ làm việc</h4>
            <p>Thứ 2 - Chủ nhật: 8:00 - 17:00</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ClinicInfoSection;