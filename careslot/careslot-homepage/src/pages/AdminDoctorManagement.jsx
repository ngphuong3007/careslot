import React, { useState, useEffect } from 'react';
import './Admin.css';

const AdminDoctorManagement = () => {
  const [doctors, setDoctors] = useState([]);
  const [currentDoctor, setCurrentDoctor] = useState({ id: null, name: '', specialty: '', bio: '', image_url: '' });
  const [imageFile, setImageFile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  const fetchDoctors = async (signal) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/doctors', {
        headers: { 'Authorization': `Bearer ${token}` },
        signal,
      });
      if (!response.ok) throw new Error('Không thể tải danh sách bác sĩ.');
      const data = await response.json();
      setDoctors(data);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error("Lỗi khi tải danh sách bác sĩ:", err);
        setError(err.message);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchDoctors(controller.signal);

    return () => {
      controller.abort();
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentDoctor({ ...currentDoctor, [name]: value });
  };

  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const resetForm = () => {
    setCurrentDoctor({ id: null, name: '', specialty: '', bio: '', image_url: '' });
    setImageFile(null);
    setIsEditing(false);
    if(document.getElementById('doctor-image-input')) {
      document.getElementById('doctor-image-input').value = null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    const formData = new FormData();
    formData.append('name', currentDoctor.name);
    formData.append('specialty', currentDoctor.specialty);
    formData.append('bio', currentDoctor.bio);
    if (imageFile) {
      formData.append('image', imageFile);
    }

    const url = isEditing ? `/api/admin/doctors/${currentDoctor.id}` : '/api/admin/doctors';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(url, {
        method: method,
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Lỗi khi lưu thông tin.');
      setMessage(data.message);
      fetchDoctors();
      resetForm();
    } catch (error) {
      console.error("Lỗi khi lưu thông tin bác sĩ:", error);
      setError(error.message);
    }
  };

  const handleEdit = (doctor) => {
    setIsEditing(true);
    setCurrentDoctor(doctor);
    setImageFile(null);
    window.scrollTo(0, 0);
  };

  // Hàm để Vô hiệu hóa / Kích hoạt bác sĩ (thay cho xóa)
  const handleToggleActive = async (doctor) => {
    const newIsActive = !doctor.is_active;
    const actionText = newIsActive ? 'kích hoạt' : 'vô hiệu hóa';
    if (window.confirm(`Bạn có chắc chắn muốn ${actionText} bác sĩ ${doctor.name}?`)) {
      setMessage('');
      setError('');
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/admin/doctors/${doctor.id}/toggle-active`, {
          method: 'PUT',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ isActive: newIsActive })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Lỗi khi thực hiện hành động.');
        setMessage(data.message);
        fetchDoctors();
      } catch (error) {
        console.error(`Lỗi khi ${actionText} bác sĩ:`, error);
        setError(error.message);
      }
    }
  };

  const filteredDoctors = doctors.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.specialty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-container">
      <h1>Quản lý bác sĩ</h1>
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}

      <form onSubmit={handleSubmit} className="admin-form">
        <h2>{isEditing ? 'Chỉnh sửa thông tin bác sĩ' : 'Thêm bác sĩ mới'}</h2>
        <input type="text" name="name" value={currentDoctor.name} onChange={handleInputChange} placeholder="Tên bác sĩ" required />
        <input type="text" name="specialty" value={currentDoctor.specialty} onChange={handleInputChange} placeholder="Chuyên khoa" required />
        <textarea name="bio" value={currentDoctor.bio} onChange={handleInputChange} placeholder="Tiểu sử"></textarea>
        <label htmlFor="doctor-image-input">Ảnh đại diện:</label>
        <input type="file" id="doctor-image-input" name="image" onChange={handleFileChange} />
        {isEditing && currentDoctor.image_url && !imageFile && (
          <div className="image-preview">
            <p>Ảnh hiện tại:</p>
            <img src={`http://localhost:5000${currentDoctor.image_url}`} alt={currentDoctor.name} />
          </div>
        )}
        <div className="form-actions">
          <button type="submit" className="btn-submit">{isEditing ? 'Cập nhật' : 'Thêm mới'}</button>
          {isEditing && <button type="button" onClick={resetForm} className="btn-cancel">Hủy</button>}
        </div>
      </form>

      <h2>Danh sách bác sĩ</h2>
      <input
          type="text"
          placeholder="Tìm kiếm theo tên hoặc chuyên khoa..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="admin-search-input"
        />

      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Ảnh</th>
              <th>Tên</th>
              <th>Chuyên khoa</th>
              <th>Tài khoản</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredDoctors.map(doc => (
              <tr key={doc.id} style={{backgroundColor: doc.is_active ? 'white' : '#f8f9fa'}}>
                <td>{doc.id}</td>
                <td>
                  {doc.image_url && <img src={`http://localhost:5000${doc.image_url}`} alt={doc.name} className="table-avatar" />}
                </td>
                <td>{doc.name}</td>
                <td>{doc.specialty}</td>
                <td>{doc.username || 'Chưa liên kết'}</td>
                <td>
                  {doc.is_active 
                    ? <span className="status-confirmed">Đang hoạt động</span> 
                    : <span className="status-cancelled">Đã nghỉ</span>
                  }
                </td>
                <td className="actions">
                  <button onClick={() => handleEdit(doc)} className="btn-edit">Sửa</button>
                  <button 
                    onClick={() => handleToggleActive(doc)} 
                    className={doc.is_active ? 'btn-delete' : 'btn-submit'}
                  >
                    {doc.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDoctorManagement;