import React, { useState, useEffect, useCallback } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import vi from 'date-fns/locale/vi';
import 'react-datepicker/dist/react-datepicker.css';
import './DependentProfiles.css';
import { apiRequest } from '../utils/api';

registerLocale('vi', vi);

const genderLabels = { male: 'Nam', female: 'Nữ', other: 'Khác' };

const toDateObject = (value) => {
    if (!value) return null;
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
};

const formatDateValue = (date) => {
    if (!date) return '';
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

const DependentProfiles = () => {
    const [dependents, setDependents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const [name, setName] = useState('');
    const [dob, setDob] = useState(null);
    const [relationship, setRelationship] = useState('');
    const [phone, setPhone] = useState('');
    const [gender, setGender] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    const [editingId, setEditingId] = useState(null);

    const fetchDependents = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await apiRequest('/api/user/dependents');
            setDependents(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDependents();
    }, [fetchDependents]);

    const resetForm = () => {
        setEditingId(null);
        setName('');
        setDob(null);
        setRelationship('');
        setPhone('');
        setGender('');
        setFormError('');
    };

    const handleEdit = (dep) => {
        setEditingId(dep.id);
        setName(dep.name || '');
        setRelationship(dep.relationship || '');
        setDob(dep.dob ? toDateObject(dep.dob.substring(0, 10)) : null);
        setPhone(dep.phone || '');
        setGender(dep.gender || '');
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc muốn xóa hồ sơ này?')) return;
        try {
            await apiRequest(`/api/user/dependents/${id}`, { method: 'DELETE' });
            if (editingId === id) resetForm();
            fetchDependents();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !relationship) {
            setFormError('Tên và mối quan hệ là bắt buộc.');
            return;
        }
        setIsSubmitting(true);
        setFormError('');

        try {
            const payload = {
                name,
                dob: formatDateValue(dob) || null,
                relationship,
                phone,
                gender
            };
            if (editingId) {
                await apiRequest(`/api/user/dependents/${editingId}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload),
                });
            } else {
                await apiRequest('/api/user/dependents', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                });
            }
            resetForm();
            fetchDependents();
        } catch (err) {
            setFormError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <p>Đang tải hồ sơ...</p>;
    if (error) return <p className="error-message">{error}</p>;

    return (
        <div className="dependent-profiles-container">
            <h2>Quản lý Hồ sơ Người thân</h2>
            <div className="profiles-layout">
                <div className="profiles-list">
                    <h3>Danh sách người thân</h3>
                    {dependents.length > 0 ? (
                        <ul>
                            {dependents.map(dep => (
                                <li key={dep.id}>
                                    <div className="profile-info">
                                        <strong>{dep.name}</strong> ({dep.relationship})
                                        <span>Ngày sinh: {dep.dob ? dep.dob.substring(0, 10) : 'Chưa có'}</span>
                                        <span>Giới tính: {dep.gender ? genderLabels[dep.gender] || dep.gender : 'Chưa có'}</span>
                                        <span>SĐT: {dep.phone || 'Chưa có'}</span>
                                    </div>
                                    <div className="profile-actions">
                                        <button type="button" onClick={() => handleEdit(dep)}>Sửa</button>
                                        <button type="button" onClick={() => handleDelete(dep.id)}>Xóa</button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>Bạn chưa có hồ sơ người thân nào.</p>
                    )}
                </div>
                <div className="add-profile-form">
                    <h3>{editingId ? 'Cập nhật Hồ sơ' : 'Thêm Hồ sơ mới'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="dep-name">Họ và tên</label>
                            <input id="dep-name" type="text" value={name} onChange={e => setName(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="dep-relationship">Mối quan hệ</label>
                            <input id="dep-relationship" type="text" value={relationship} onChange={e => setRelationship(e.target.value)} placeholder="Cha, Mẹ, Con trai..." required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="dep-dob">Ngày sinh</label>
                            <DatePicker
                                id="dep-dob"
                                selected={dob}
                                onChange={date => setDob(date)}
                                dateFormat="dd/MM/yyyy"
                                placeholderText="Chọn ngày sinh"
                                isClearable
                                showMonthDropdown
                                showYearDropdown
                                dropdownMode="select"
                                locale="vi"
                                maxDate={new Date()}  
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="dep-gender">Giới tính</label>
                            <select id="dep-gender" value={gender} onChange={e => setGender(e.target.value)}>
                                <option value="">-- Chọn --</option>
                                <option value="male">Nam</option>
                                <option value="female">Nữ</option>
                                <option value="other">Khác</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="dep-phone">Số điện thoại (nếu có)</label>
                            <input id="dep-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
                        </div>
                        {formError && <p className="error-message">{formError}</p>}
                        <div className="form-actions">
                            {editingId && <button type="button" onClick={resetForm}>Hủy</button>}
                            <button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Đang lưu...' : editingId ? 'Cập nhật' : 'Thêm Hồ sơ'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default DependentProfiles;