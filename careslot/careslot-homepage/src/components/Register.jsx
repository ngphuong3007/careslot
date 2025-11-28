import React, { useState } from 'react';
import './Login.css'; // Tái sử dụng CSS của form Login

// SỬA LẠI TÊN PROP TỪ 'onSwitchToLogin' THÀNH 'onBack'
const Register = ({ onBack }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!username || !email || !password) {
      alert('Vui lòng điền đầy đủ thông tin.');
      return;
    }

    try {
      // SỬA LẠI ĐƯỜNG DẪN FETCH ĐỂ DÙNG PROXY
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message + "\nBây giờ bạn có thể đăng nhập.");
        // SỬA LẠI TÊN HÀM Ở ĐÂY
        if (onBack) onBack(); // Tự động chuyển về form đăng nhập
      } else {
        alert(`Lỗi: ${data.message}`);
      }
    } catch (error) {
      alert('Không thể kết nối đến server.');
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">Đăng Ký Tài Khoản</h2>
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="login-row">
          <label htmlFor="username">Tên Đăng Nhập</label>
          <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div className="login-row">
          <label htmlFor="email">Email</label>
          <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="login-row">
          <label htmlFor="password">Mật Khẩu</label>
          <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div className="login-actions">
          {/* SỬA LẠI TÊN HÀM Ở ĐÂY */}
          <a href="#" className="forgot-link" onClick={(e) => { e.preventDefault(); if (onBack) onBack(); }}>
            Đã có tài khoản? Đăng nhập
          </a>
          <button type="submit" className="login-btn">
            Đăng ký
          </button>
        </div>
      </form>
    </div>
  );
};

export default Register;