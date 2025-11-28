import React, { useState, useEffect } from 'react';
import './Admin.css';

const AdminUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        setMessage('');
        const token = localStorage.getItem('token');
        const response = await fetch('/api/admin/users', {
          headers: { 'Authorization': `Bearer ${token}` },
          signal
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Không thể tải danh sách người dùng.');
        }
        const data = await response.json();
        setUsers(data);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
    
    return () => { 
      controller.abort(); 
    };
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    const originalUsers = [...users];
    setUsers(currentUsers =>
      currentUsers.map(user =>
        user.id === userId ? { ...user, role: newRole } : user
      )
    );
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Có lỗi xảy ra.');
      }
      setMessage(data.message);
    } catch (error) {
      setError(`Lỗi: ${error.message}`);
      setUsers(originalUsers);
    }
  };

  const handleResetPassword = async (userId, userEmail) => {
    if (window.confirm(`Bạn có chắc muốn gửi email reset mật khẩu cho ${userEmail}?`)) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        setMessage(data.message);
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleDelete = async (userId, username) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa người dùng "${username}"?`)) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        setUsers(users.filter(user => user.id !== userId));
        setMessage(data.message);
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-container">
      <h1>Quản lý người dùng</h1>
      {loading && <p>Đang tải...</p>}
      {error && <p className="admin-message error">{error}</p>}
      {message && <p className="admin-message success">{message}</p>}

      <div className="search-bar">
        <input
          type="text"
          placeholder="Tìm kiếm theo tên hoặc email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="admin-search-input"
        />
      </div>

      {!loading && !error && (
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên đăng nhập</th>
                <th>Email</th>
                <th>Vai trò</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    <select
                      className="admin-select"
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      disabled={user.id === JSON.parse(atob(localStorage.getItem('token').split('.')[1])).id}
                    >
                      <option value="user">User</option>
                      <option value="doctor">Doctor</option>
                      <option value="receptionist">Receptionist</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="actions">
                    <button
                      onClick={() => handleResetPassword(user.id, user.email)}
                      className="btn-edit"
                    >
                      Reset Pass
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(user.id, user.username)}
                      disabled={user.id === JSON.parse(atob(localStorage.getItem('token').split('.')[1])).id}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;