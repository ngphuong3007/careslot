import React, { useState } from 'react';
import './Login.css'; // Dùng chung CSS với Login cho tiện
import { apiRequest } from '../utils/api';

const ChangePassword = ({ onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage('Mật khẩu mới không khớp.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setMessage('Lỗi: Bạn chưa đăng nhập.');
      return;
    }

    setMessage('Đang xử lý...');

    try {
      const response = await fetch('api/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Gửi token để xác thực
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();
      setMessage(data.message);

      if (response.ok) {
        setTimeout(() => {
          onClose(); // Đóng modal sau khi thành công
        }, 2000);
      }
    } catch (error) {
      setMessage('Lỗi kết nối đến server.');
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">Đổi Mật Khẩu</h2>
      <form className="login-form" onSubmit={handleSubmit}>
        <div className="login-row">
          <label htmlFor="currentPassword">Mật khẩu hiện tại</label>
          <input type="password" id="currentPassword" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
        </div>
        <div className="login-row">
          <label htmlFor="newPassword">Mật khẩu mới</label>
          <input type="password" id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
        </div>
        <div className="login-row">
          <label htmlFor="confirmPassword">Xác nhận mật khẩu mới</label>
          <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
        </div>
        {message && <p style={{ color: message.includes('thành công') ? 'green' : 'red', textAlign: 'center' }}>{message}</p>}
        <div className="login-actions" style={{ justifyContent: 'center' }}>
          <button type="submit" className="login-btn">Xác nhận</button>
        </div>
      </form>
    </div>
  );
};

export default ChangePassword;