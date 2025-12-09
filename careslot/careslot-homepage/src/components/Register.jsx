import React, { useState } from 'react';
import './Login.css';
import { apiRequest } from '../utils/api';

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
    const data = await apiRequest('/api/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });

    if (data && data.message) {
      alert(data.message + "\nBây giờ bạn có thể đăng nhập.");
      if (onBack) onBack();
    } else {
      alert('Đăng ký thành công.');
      if (onBack) onBack();
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