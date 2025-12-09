import React, { useState } from 'react';
import './Login.css';
import { apiRequest } from '../utils/api';

const ForgotPassword = ({ onBack }) => {
  // State để lưu email người dùng nhập
  const [email, setEmail] = useState('');
  // State để hiển thị thông báo cho người dùng
  const [message, setMessage] = useState('');

  // Hàm xử lý khi người dùng nhấn nút "Lấy lại mật khẩu"
  const handleSubmit = async (event) => {
  event.preventDefault();
  if (!email) {
    setMessage('Vui lòng nhập email của bạn.');
    return;
  }
  setMessage('Đang xử lý, vui lòng chờ...');

  try {
    const data = await apiRequest('/api/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    setMessage(data.message || 'Vui lòng kiểm tra email của bạn.');
  } catch (error) {
    setMessage('Lỗi kết nối đến server. Vui lòng thử lại.');
  }
};

  return (
    <div className="login-container">
      <h2 className="login-title">Quên Mật Khẩu</h2>
      <p style={{textAlign: 'center', fontSize: '14px', marginBottom: '15px'}}>
        Nhập email đã đăng ký của bạn để nhận mật khẩu mới.
      </p>
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="login-row">
          {/* Sửa từ Tên đăng nhập thành Email */}
          <label htmlFor="email">Email</label>
          <input 
            type="email" 
            id="email" 
            name="email" 
            placeholder="Nhập email của bạn"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        {/* Hiển thị thông báo cho người dùng */}
        {message && <p style={{color: 'green', textAlign: 'center', marginTop: '10px'}}>{message}</p>}

        <div className="login-actions">
          <button type="button" className="login-btn" onClick={onBack}>
            Quay lại
          </button>
          <button type="submit" className="login-btn" style={{marginLeft: 12}}>
            Lấy lại mật khẩu
          </button>
        </div>
      </form>
    </div>
  );
};

export default ForgotPassword;