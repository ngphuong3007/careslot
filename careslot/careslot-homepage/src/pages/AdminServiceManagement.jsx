import React, { useState, useEffect } from 'react';
import './Admin.css';

const AdminServiceManagement = () => {
  const [services, setServices] = useState([]);
  const [currentService, setCurrentService] = useState({ id: null, name: '', description: '', price: '', duration_minutes: 30 });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const apiRequest = async (url, options) => {
    const token = localStorage.getItem('token');
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options?.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Lỗi HTTP: ${response.status}`);
    }
    return response.json();
  };

  const fetchServices = async (signal) => {
    try {
      const data = await apiRequest('/api/admin/services', { signal });
      setServices(data);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchServices(controller.signal);
    return () => {
      controller.abort();
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentService({ ...currentService, [name]: value });
  };

  const resetForm = () => {
    setIsEditing(false);
    setCurrentService({ id: null, name: '', description: '', price: '', duration_minutes: 30 });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    const serviceData = { ...currentService };
    
    const priceValue = serviceData.price.toString().toLowerCase().trim();
    if (priceValue === 'miễn phí') {
      serviceData.price = 0;
    } else {
      const numericPrice = parseFloat(priceValue.replace(/[^0-9.-]+/g, ''));
      if (isNaN(numericPrice)) {
        setError('Giá không hợp lệ. Vui lòng nhập số hoặc "Miễn phí".');
        return;
      }
      serviceData.price = numericPrice;
    }

    const url = isEditing ? `/api/admin/services/${serviceData.id}` : '/api/admin/services';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const result = await apiRequest(url, {
        method: method,
        body: JSON.stringify(serviceData),
      });
      setMessage(result.message);
      resetForm();
      setLoading(true);
      await fetchServices();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (service) => {
    setIsEditing(true);
    setCurrentService({
      ...service,
      price: Number(service.price) === 0 ? 'Miễn phí' : service.price.toString()
    });
    window.scrollTo(0, 0);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa dịch vụ này không?')) {
      try {
        const result = await apiRequest(`/api/admin/services/${id}`, { method: 'DELETE' });
        setMessage(result.message);
        setLoading(true);
        await fetchServices();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const formatPrice = (price) => {
    const numericPrice = Number(price);
    if (numericPrice === 0) {
      return 'Miễn phí';
    }
    return `${numericPrice.toLocaleString('vi-VN')} VND`;
  };

  return (
    <div className="admin-container">
      <h1>Quản lý dịch vụ</h1>
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}

      <form onSubmit={handleSubmit} className="admin-form">
        <h2>{isEditing ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}</h2>
        <input
          type="text"
          name="name"
          value={currentService.name}
          onChange={handleInputChange}
          placeholder="Tên dịch vụ"
          required
        />
        <textarea
          name="description"
          value={currentService.description}
          onChange={handleInputChange}
          placeholder="Mô tả dịch vụ"
          required
        />
        <input
          type="text"
          name="price"
          value={currentService.price}
          onChange={handleInputChange}
          placeholder="Giá dịch vụ"
          required
        />
        <input
          type="number"
          name="duration_minutes"
          value={currentService.duration_minutes}
          onChange={handleInputChange}
          placeholder="Thời gian (phút)"
          required
          min="1"
        />
        <div className="form-actions">
          <button type="submit" className="btn-submit">{isEditing ? 'Cập nhật' : 'Thêm mới'}</button>
          {isEditing && <button type="button" onClick={resetForm} className="btn-cancel">Hủy</button>}
        </div>
      </form>

      <h2>Danh sách dịch vụ</h2>
      {loading ? <p>Đang tải...</p> : (
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên dịch vụ</th>
                <th>Mô tả</th>
                <th>Giá</th>
                <th>Thời gian (phút)</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {services.map(service => (
                <tr key={service.id}>
                  <td>{service.id}</td>
                  <td>{service.name}</td>
                  <td>{service.description}</td>
                  <td>{formatPrice(service.price)}</td>
                  <td>{service.duration_minutes}</td>
                  <td className="actions">
                    <button onClick={() => handleEdit(service)} className="btn-edit">Sửa</button>
                    <button onClick={() => handleDelete(service.id)} className="btn-delete">Xóa</button>
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

export default AdminServiceManagement;