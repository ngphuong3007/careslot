import React, { useState } from 'react';
import './Login.css';
import { apiRequest } from '../utils/api';

const Login = ({ onForgotPasswordClick, onRegisterClick, onLoginSuccess, onClose }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!username || !password) {
      alert('Vui lòng nhập đầy đủ thông tin.');
      return;
    }

    try {
      const data = await apiRequest('/api/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      if (onLoginSuccess) {
        onLoginSuccess(data.token);
      }
    } catch (error) {
      console.error('Login error:', error);
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

          <h2 className="login-title">Đăng Nhập</h2>
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-row">
              <label htmlFor="username">Tên Đăng Nhập</label>
              <input
                type="text"
                id="username"
                name="username"
                placeholder="Nhập tên đăng nhập"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="login-row">
              <label htmlFor="password">Mật Khẩu</label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Nhập mật khẩu"
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
                  if (onForgotPasswordClick) onForgotPasswordClick();
                }}
              >
                Quên mật khẩu
              </a>
              <button type="submit" className="login-btn">
                <span role="img" aria-label="user">👤</span> Đăng nhập
              </button>
            </div>
          </form>
          <div className="switch-form-link">
            Bạn chưa có tài khoản?{' '}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (onRegisterClick) onRegisterClick();
              }}
            >
              Đăng ký ngay
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;