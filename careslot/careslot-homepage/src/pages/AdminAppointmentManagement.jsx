import React, { useState, useEffect } from 'react';
import './Admin.css';

const AdminAppointmentManagement = () => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const apiRequest = async (url, options) => {
    const token = localStorage.getItem('token');
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options?.headers,
      },
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Có lỗi xảy ra.');
    }
    return response.json();
  };

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [appointmentsData, doctorsData] = await Promise.all([
          apiRequest('/api/admin/appointments', { signal }),
          apiRequest('/api/admin/doctors', { signal })
        ]);
        setAppointments(appointmentsData);
        setDoctors(doctorsData);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      controller.abort();
    };
  }, []);

  const handleUpdateAppointment = async (id, field, value) => {
    const updateValue = value === '' ? null : value;
    const originalAppointments = [...appointments];
    
    // Cập nhật UI ngay lập tức để người dùng thấy thay đổi
    setAppointments(prev => prev.map(app => {
        if (app.id === id) {
            const updatedApp = { ...app, [field]: updateValue };
            // Nếu thay đổi bác sĩ, cập nhật luôn doctor_name trên UI để logic filter hoạt động
            if (field === 'doctor_id') {
                const selectedDoc = doctors.find(d => d.id === parseInt(updateValue));
                updatedApp.doctor_name = selectedDoc ? selectedDoc.name : null;
            }
            return updatedApp;
        }
        return app;
    }));
    setMessage('');

    try {
      const body = { [field]: updateValue };
      const data = await apiRequest(`/api/admin/appointments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      setMessage(data.message);
    } catch (err) {
      setError(`Lỗi: ${err.message}`);
      setAppointments(originalAppointments); // Hoàn tác nếu có lỗi
    }
  };

  const handleCancelAppointment = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn hủy lịch hẹn này?')) {
      handleUpdateAppointment(id, 'status', 'cancelled');
    }
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'Chưa có';
    const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
    return new Date(dateTimeString).toLocaleDateString('vi-VN', options);
  };

  const filteredAppointments = appointments.filter(app =>
    app.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (app.doctor_name && app.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="admin-container">
      <h1>Quản lý lịch hẹn</h1>
      {loading && <p>Đang tải danh sách lịch hẹn...</p>}
      {error && <p className="admin-message error">{error}</p>}
      {message && <p className="admin-message success">{message}</p>}

      <div className="search-bar">
        <input
          type="text"
          placeholder="Tìm theo tên khách hàng, dịch vụ, bác sĩ..."
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
                <th>Tên Khách Hàng</th>
                <th>Dịch vụ</th>
                <th>Bác sĩ</th>
                <th>Ngày giờ hẹn</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map(app => (
                  <tr key={app.id}>
                    <td>{app.id}</td>
                    <td>{app.patient_name}</td>
                    <td>{app.service_name}</td>
                    <td>
                      <select 
                        className="admin-select"
                        value={app.doctor_id || ''} 
                        onChange={(e) => handleUpdateAppointment(app.id, 'doctor_id', e.target.value)}
                      >
                        <option value="">Chưa phân công</option>
                        {doctors.map(doctor => (
                          <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
                        ))}
                      </select>
                    </td>
                    <td>{formatDateTime(app.appointment_time)}</td>
                    <td>
                      <select 
                        className={`admin-select status-${(app.status || 'pending').toLowerCase()}`}
                        value={app.status || 'pending'}
                        onChange={(e) => handleUpdateAppointment(app.id, 'status', e.target.value)}
                      >
                        <option value="pending">Chờ xác nhận</option>
                        <option value="confirmed">Đã xác nhận</option>
                        <option value="completed">Đã hoàn thành</option>
                        <option value="cancelled">Đã hủy</option>
                      </select>
                    </td>
                    <td className="actions">
                      <button 
                        className="btn-delete" 
                        onClick={() => handleCancelAppointment(app.id)}
                        disabled={app.status === 'cancelled' || app.status === 'completed'}
                      >
                        Hủy
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center' }}>Không tìm thấy lịch hẹn nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminAppointmentManagement;