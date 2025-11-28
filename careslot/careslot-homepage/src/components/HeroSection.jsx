import React from 'react';
import Header from './Header';
import './HeroSection.css';
import heroImg from '../assets/hero-bg.jpg';

// SỬA LẠI: Đảm bảo onLookupClick được truyền xuống Header
const HeroSection = ({ onLoginClick, onBookClick, currentUser, onLogout, onChangePasswordClick, onUserMenuClick, onLookupClick }) => {
  return (
    <section className="hero-section">
      <Header 
        onLoginClick={onLoginClick} 
        onBookClick={onBookClick} 
        currentUser={currentUser}
        onLogout={onLogout}
        onChangePasswordClick={onChangePasswordClick}
        onUserMenuClick={onUserMenuClick}
        onLookupClick={onLookupClick} // Quan trọng: Truyền prop này xuống
      />
      <div className="hero-inner">
        <div className="hero-content">
          <h1>
            Xin chào bạn đã đến<br />
            <span style={{color: "#222"}}>phòng khám <b>CARESLOT</b></span>
          </h1>
          <p>
            Careslot là phòng khám hiện đại, cung cấp dịch vụ đặt lịch khám nhanh chóng và quản lý chăm sóc sức khỏe tiện lợi, giúp bệnh nhân tiếp cận bác sĩ chuyên môn một cách dễ dàng và hiệu quả.
          </p>
          <div className="hero-actions">
            <button className="appointment-button" onClick={onBookClick}>
              <span role="img" aria-label="calendar">📅 </span> Đặt lịch ngay
            </button>
            {/* XÓA NÚT TRA CỨU THỪA Ở ĐÂY NẾU CÓ */}
          </div>
        </div>
        <img src={heroImg} alt="Careslot Hero" />
      </div>
    </section>
  );
};

export default HeroSection;