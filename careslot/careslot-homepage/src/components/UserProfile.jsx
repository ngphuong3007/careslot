import React, { useState, useEffect, useContext } from 'react';
import DatePicker from 'react-datepicker';
import { registerLocale } from 'react-datepicker';
import vi from 'date-fns/locale/vi';
import 'react-datepicker/dist/react-datepicker.css';
import { AuthContext } from '../context/AuthContext';
import './UserProfile.css';
import { apiRequest } from '../utils/api';


const toDateObject = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const formatDateValue = (date) => {
    if (!date) return null;
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

const UserProfile = () => {
    const { currentUser, updateUser } = useContext(AuthContext);

    const [profile, setProfile] = useState({
        full_name: '',
        gender: '',
        address: '',
        email: '',
        phone: '',
    });
    const [dob, setDob] = useState(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const data = await apiRequest('/api/user/profile');
                setProfile({
                    full_name: data.full_name || '',
                    gender: data.gender || '',
                    address: data.address || '',
                    email: data.email || '',
                    phone: data.phone || '',
                });
                setDob(toDateObject(data.date_of_birth));
            } catch (err) {
                setMessage({ type: 'error', text: err.message });
            } finally {
                setIsLoading(false);
            }
        };
        loadProfile();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage({ type: '', text: '' });

        const profileDataToSend = {
            full_name: profile.full_name,
            gender: profile.gender || null,
            address: profile.address,
            email: profile.email,
            phone: profile.phone,
            date_of_birth: formatDateValue(dob),
        };

        try {
            const data = await apiRequest('/api/user/profile', {
                method: 'PUT',
                body: JSON.stringify(profileDataToSend),
            });
            setMessage({ type: 'success', text: data.message });

            if (data.token) {
                updateUser(data.token);
            }

        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <p style={{ textAlign: 'center', marginTop: '50px' }}>Đang tải hồ sơ...</p>;

    return (
        <div className="user-profile-container">
            <h2>Chỉnh sửa Hồ sơ cá nhân</h2>
            <form onSubmit={handleSubmit} className="profile-form">
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="full_name">Họ và tên</label>
                        <input type="text" id="full_name" name="full_name" value={profile.full_name} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="date_of_birth">Ngày sinh</label>
                        <DatePicker
                            id="date_of_birth"
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
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="phone">Số điện thoại</label>
                        <input type="tel" id="phone" name="phone" value={profile.phone} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input type="email" id="email" name="email" value={profile.email} onChange={handleChange} />
                    </div>
                </div>
                <div className="form-group">
                    <label htmlFor="gender">Giới tính</label>
                    <select id="gender" name="gender" value={profile.gender || ''} onChange={handleChange}>
                        <option value="">-- Chọn giới tính --</option>
                        <option value="male">Nam</option>
                        <option value="female">Nữ</option>
                        <option value="other">Khác</option>
                    </select>
                </div>
                <div className="form-group">
                    <label htmlFor="address">Địa chỉ</label>
                    <textarea id="address" name="address" value={profile.address} onChange={handleChange}></textarea>
                </div>

                {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
            </form>
        </div>
    );
};

export default UserProfile;