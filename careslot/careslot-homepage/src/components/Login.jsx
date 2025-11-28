import React, { useState } from 'react';
import './Login.css';

const Login = ({ onForgotPasswordClick, onRegisterClick, onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!username || !password) {
      alert('Vui lòng nhập đầy đủ thông tin.');
      return;
    }

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // XÓA BỎ: Không cần lưu token ở đây nữa, AuthContext sẽ làm việc đó.
        // localStorage.setItem('token', data.token);
        if (onLoginSuccess) {
          // SỬA LẠI: Truyền cả token lên cho App.jsx xử lý
          onLoginSuccess(data.token);
        }
      } else {
        alert(`Lỗi: ${data.message}`);
      }
    } catch (error) {
      console.error("Login error:", error);
      alert('Không thể kết nối đến server.');
    }
  };

  return (
    <div className="login-container">
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
            onClick={(e) => { e.preventDefault(); if (onForgotPasswordClick) onForgotPasswordClick(); }}
          >
            Quên mật khẩu
          </a>
          <button type="submit" className="login-btn">
            <span role="img" aria-label="user">👤</span> Đăng nhập
          </button>
        </div>
      </form>
      <div className="switch-form-link">
        Bạn chưa có tài khoản? <a href="#" onClick={(e) => { e.preventDefault(); if (onRegisterClick) onRegisterClick(); }}>Đăng ký ngay</a>
      </div>
    </div>
  );
};

export default Login;