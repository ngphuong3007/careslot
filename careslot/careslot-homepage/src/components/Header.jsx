import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = ({ onLoginClick, onBookClick, currentUser, onLogout, onUserMenuClick, onLookupClick }) => (
  <header className="header">
    <a href="/" className="logo"> 
      <span>🩺</span>
      <span>CARESLOT</span>
    </a>
    <nav className="navigation">
      <ul>
        <li><a href="/#news">Tin Y Tế</a></li>
        <li><a href="/#doctors">Đội ngũ Bác Sĩ</a></li>
        <li><a href="/#clinic-info">Thông tin phòng khám</a></li>
        
        <li>
          <button className="header-btn lookup-btn" onClick={onLookupClick}>
            <span role="img" aria-label="search">🔍 </span> Tra cứu lịch đã đặt
          </button>
        </li>

        {currentUser ? (
          <li>
            <button className="user-welcome-button" onClick={onUserMenuClick}>
              Chào, {currentUser.username}!
            </button>
          </li>
        ) : (
          <>
            <li>
              <button className="header-btn login-btn" onClick={onLoginClick}>
                <span role="img" aria-label="user">👤</span> Đăng nhập
              </button>
            </li>
            <li>
              <button className="header-btn book-btn" onClick={onBookClick}>
                <span role="img" aria-label="calendar">📅</span> Đặt Lịch
              </button>
            </li>
          </>
        )}
      </ul>
    </nav>
  </header>
);

export default Header;