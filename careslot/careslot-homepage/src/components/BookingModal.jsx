import React, { useState, useEffect } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import vi from 'date-fns/locale/vi';
import 'react-datepicker/dist/react-datepicker.css';
import './BookingModal.css';
import { apiRequest } from '../utils/api';

registerLocale('vi', vi);

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

const BookingModal = ({ onClose, currentUser, initialData = {}, isReExam = false }) => {
    const [services, setServices] = useState([]);
    const [doctors, setDoctors] = useState([]);

    const [patientName, setPatientName] = useState(initialData.patientName || '');
    const [patientPhone, setPatientPhone] = useState(initialData.patientPhone || '');
    const [patientDob, setPatientDob] = useState(toDateObject(initialData.patientDob));
    const [patientEmail, setPatientEmail] = useState('');

    const [selectedService, setSelectedService] = useState(initialData.serviceId || '');
    const [selectedDoctor, setSelectedDoctor] = useState(initialData.doctorId || '');

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [schedule, setSchedule] = useState([]);
    const [selectedTime, setSelectedTime] = useState('');
    const [scheduleLoading, setScheduleLoading] = useState(false);

    const [dependents, setDependents] = useState([]);
    const [bookingFor, setBookingFor] = useState('');

    useEffect(() => {
        Promise.all([
            apiRequest('/api/services'),
            apiRequest('/api/doctors'),
        ])
            .then(([servicesData, doctorsData]) => {
                setServices(servicesData);
                setDoctors(doctorsData);
            })
            .catch(error => console.error('Lỗi khi fetch data:', error));
    }, []);

    useEffect(() => {
        if (currentUser) {
            const token = localStorage.getItem('token');
            apiRequest('/api/user/dependents', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(data => {
                    if (Array.isArray(data)) setDependents(data);
                })
                .catch(err => console.error('Lỗi lấy danh sách người thân:', err));
        }
    }, [currentUser]);

    useEffect(() => {
        if (currentUser && !isReExam) {
            if (bookingFor === 'self') {
                setPatientName(currentUser.full_name || currentUser.username);
                setPatientPhone(currentUser.phone || '');
                setPatientDob(toDateObject(currentUser.date_of_birth));
            } else if (bookingFor) {
                const selectedDependent = dependents.find(d => d.id === parseInt(bookingFor, 10));
                if (selectedDependent) {
                    setPatientName(selectedDependent.name);
                    setPatientPhone(selectedDependent.phone || '');
                    const dobField = selectedDependent.date_of_birth || selectedDependent.dob;
                    setPatientDob(toDateObject(dobField));
                }
            } else {
                setPatientName('');
                setPatientPhone('');
                setPatientDob(null);
            }
        }
    }, [bookingFor, currentUser, dependents, isReExam]);

    useEffect(() => {
        if (selectedDoctor && selectedDate) {
            setScheduleLoading(true);
            setSchedule([]);
            setSelectedTime('');
            apiRequest(`/api/doctors/${selectedDoctor}/schedule?date=${selectedDate}`)
                .then(data => {
                    const sortedData = data.sort((a, b) => new Date(a.time) - new Date(b.time));
                    setSchedule(sortedData);
                    setScheduleLoading(false);
                })
                .catch(error => {
                    console.error('Lỗi khi fetch lịch bác sĩ:', error);
                    setScheduleLoading(false);
                });
        } else {
            setSchedule([]);
        }
    }, [selectedDoctor, selectedDate]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (currentUser && !bookingFor) {
            alert('Vui lòng chọn người cần đặt lịch!');
            return;
        }
        if (!selectedService || !patientName || !patientPhone || !selectedDoctor || !selectedTime) {
            alert('Vui lòng điền đủ thông tin, chọn bác sĩ và thời gian hẹn!');
            return;
        }

        const bookingData = {
            service_id: parseInt(selectedService, 10),
            patient_name: patientName,
            patient_phone: patientPhone,
            patient_dob: formatDateValue(patientDob),
            patient_email: currentUser ? null : patientEmail,
            doctor_id: parseInt(selectedDoctor, 10),
            appointment_time: selectedTime,
            user_id: currentUser ? currentUser.id : null,
            dependent_id: (currentUser && bookingFor !== 'self') ? parseInt(bookingFor, 10) : null,
        };

        try {
            const token = localStorage.getItem('token');
            // apiRequest trả thẳng JSON (result), không phải Response
            const result = await apiRequest('/api/appointments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(bookingData),
            });

            // Nếu backend trả message
            alert(result.message || 'Đặt lịch thành công!');
            onClose();
        } catch (error) {
            console.error('Lỗi khi gửi yêu cầu đặt lịch:', error);
            alert(error.message || 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
        }
    };

    const isPatientInfoLocked = isReExam || (currentUser && bookingFor !== 'self' && bookingFor !== '');

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2>{isReExam ? 'Đặt Lịch Tái Khám' : 'Đặt Lịch Khám'}</h2>
                <form onSubmit={handleSubmit}>
                    {currentUser && !isReExam && (
                        <div className="form-group">
                            <label htmlFor="bookingFor">Đặt lịch cho:</label>
                            <select id="bookingFor" value={bookingFor} onChange={e => setBookingFor(e.target.value)} required>
                                <option value="" disabled>-- Vui lòng chọn --</option>
                                <option value="self">Bản thân ({currentUser.full_name || currentUser.username})</option>
                                {dependents.map(d => (
                                    <option key={d.id} value={d.id}>{d.name} ({d.relationship})</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="name">Họ và tên:</label>
                        <input type="text" id="name" value={patientName} onChange={e => setPatientName(e.target.value)} required readOnly={isPatientInfoLocked} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="phone">Số điện thoại:</label>
                        <input type="tel" id="phone" value={patientPhone} onChange={e => setPatientPhone(e.target.value)} required readOnly={isReExam} />
                    </div>
                    {!currentUser && !isReExam && (
                        <div className="form-group">
                            <label htmlFor="email">Email (để nhận xác nhận, không bắt buộc):</label>
                            <input type="email" id="email" value={patientEmail} onChange={e => setPatientEmail(e.target.value)} />
                        </div>
                    )}
                    <div className="form-group">
                        <label htmlFor="dob">Ngày sinh (tùy chọn):</label>
                        <DatePicker
                            id="dob"
                            selected={patientDob}
                            onChange={date => setPatientDob(date)}
                            dateFormat="dd/MM/yyyy"
                            placeholderText="Chọn ngày sinh"
                            isClearable
                            disabled={isPatientInfoLocked}
                            showMonthDropdown
                            showYearDropdown
                            dropdownMode="select"
                            locale="vi"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="service">Chọn dịch vụ:</label>
                        <select id="service" value={selectedService} onChange={e => setSelectedService(e.target.value)} required disabled={isReExam}>
                            <option value="">-- Vui lòng chọn dịch vụ --</option>
                            {services.map(service => <option key={service.id} value={service.id}>{service.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="doctor">Chọn bác sĩ:</label>
                        <select id="doctor" value={selectedDoctor} onChange={e => setSelectedDoctor(e.target.value)} required disabled={isReExam}>
                            <option value="">-- Vui lòng chọn bác sĩ --</option>
                            {doctors.map(doctor => <option key={doctor.id} value={doctor.id}>{doctor.name} - {doctor.specialty}</option>)}
                        </select>
                    </div>

                    {selectedDoctor && (
                        <>
                            <div className="form-group">
                                <label htmlFor="appointment-date">Chọn ngày hẹn:</label>
                                <input
                                    type="date"
                                    id="appointment-date"
                                    value={selectedDate}
                                    onChange={e => setSelectedDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Chọn thời gian:</label>
                                {scheduleLoading ? <p>Đang tải lịch...</p> : (
                                    <div className="time-slots-container">
                                        {schedule.length > 0 ? schedule.map(slot => (
                                            <button
                                                type="button"
                                                key={slot.time}
                                                className={`time-slot ${slot.status === 'booked' ? 'time-slot-booked' : ''} ${slot.time === selectedTime ? 'time-slot-selected' : ''}`}
                                                disabled={slot.status === 'booked'}
                                                onClick={() => setSelectedTime(slot.time)}
                                            >
                                                {new Date(slot.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                            </button>
                                        )) : <p>Lịch ngày này không còn hoặc bác sĩ không làm việc.</p>}
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    <div className="modal-actions">
                        <button type="submit" className="submit-btn">Xác Nhận Đặt Lịch</button>
                        <button type="button" className="close-btn" onClick={onClose}>Hủy</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BookingModal;