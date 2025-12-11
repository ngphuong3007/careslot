import React, { useState } from 'react';
import './Login.css';
import { apiRequest } from '../utils/api';

// onBack: quay lại màn hình đăng nhập
// onClose: đóng hẳn modal (nếu có)
const Register = ({ onBack, onClose }) => {
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
        alert(data.message + '\nBây giờ bạn có thể đăng nhập.');
      } else {
        alert('Đăng ký thành công.');
      }

      if (onBack) onBack();
    } catch (error) {
      alert(error.message || 'Không thể kết nối đến server.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="login-container">
          {onClose && (
            <button
              type="button"
              className="close-button"
              onClick={onClose}
            >
              ×
            </button>
          )}

          <h2 className="login-title">Đăng Ký Tài Khoản</h2>
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-row">
              <label htmlFor="username">Tên Đăng Nhập</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="login-row">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="login-row">
              <label htmlFor="password">Mật Khẩu</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="login-actions">
              <a
                href="#"
                className="forgot-link"
                onClick={(e) => {
                  e.preventDefault();
                  if (onBack) onBack();
                }}
              >
                Đã có tài khoản? Đăng nhập
              </a>
              <button type="submit" className="login-btn">
                Đăng ký
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;