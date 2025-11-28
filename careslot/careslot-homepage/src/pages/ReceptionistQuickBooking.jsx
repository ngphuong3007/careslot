import React, { useEffect, useState } from 'react';
import './ReceptionistQuickBooking.css';

const apiRequest = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`http://localhost:5000${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers || {})
    }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Lỗi máy chủ');
  return data;
};

const today = () => new Date().toISOString().split('T')[0];
const parseSlotDate = (value) => {
  if (!value) return null;
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};
const formatSlotLabel = (value) => {
  const date = parseSlotDate(value);
  if (!date) return value;
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const ReceptionistQuickBooking = () => {
  const [services, setServices] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const [form, setForm] = useState({
    patient_name: '',
    patient_phone: '',
    patient_email: '',
    service_id: '',
    doctor_id: '',
    appointment_date: today(),
    appointment_slot: '',
  });

  useEffect(() => {
    apiRequest('/api/services').then(setServices).catch(err => setMessage({ type: 'error', text: err.message }));
    apiRequest('/api/doctors').then(setDoctors).catch(err => setMessage({ type: 'error', text: err.message }));
  }, []);

  useEffect(() => {
    if (!form.doctor_id || !form.appointment_date) {
      setSlots([]);
      setForm(prev => ({ ...prev, appointment_slot: '' }));
      return;
    }
    setLoadingSlots(true);
    apiRequest(`/api/doctors/${form.doctor_id}/schedule?date=${form.appointment_date}`)
      .then(data => {
        const sorted = [...data].sort((a, b) => {
          const timeA = parseSlotDate(a.time)?.getTime() ?? 0;
          const timeB = parseSlotDate(b.time)?.getTime() ?? 0;
          return timeA - timeB;
        });
        setSlots(sorted);
        setForm(prev => ({ ...prev, appointment_slot: '' }));
      })
      .catch(err => setMessage({ type: 'error', text: err.message }))
      .finally(() => setLoadingSlots(false));
  }, [form.doctor_id, form.appointment_date]);

  const availableSlots = slots.filter(slot => {
    if (slot.status === 'booked') return false;
    const slotDate = parseSlotDate(slot.time);
    if (!slotDate) return false;
    return slotDate.getTime() > Date.now();
  });

  const handleChange = ({ target: { name, value } }) => {
    setForm(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'doctor_id' || name === 'appointment_date' ? { appointment_slot: '' } : null)
    }));
  };

  const handleSlotSelect = (slotTime) => {
    setForm(prev => ({ ...prev, appointment_slot: slotTime }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.patient_name || !form.patient_phone || !form.service_id || !form.doctor_id || !form.appointment_date || !form.appointment_slot) {
      setMessage({ type: 'error', text: 'Vui lòng điền đủ thông tin bắt buộc.' });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      await apiRequest('/api/receptionist/appointments', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          created_by: 'receptionist'
        })
      });
      setMessage({ type: 'success', text: 'Đặt lịch thành công!' });
      setForm(prev => ({
        ...prev,
        patient_name: '',
        patient_phone: '',
        patient_email: '',
        note: '',
        appointment_slot: ''
      }));
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="receptionist-quick-booking">
      <h1>Đặt lịch nhanh cho bệnh nhân vãng lai</h1>
      {message && <div className={`alert ${message.type}`}>{message.text}</div>}
      <form className="quick-booking-form" onSubmit={handleSubmit}>
        <section>
          <h2>Thông tin bệnh nhân</h2>
          <div className="form-grid">
            <label>
              Họ và tên*
              <input name="patient_name" value={form.patient_name} onChange={handleChange} />
            </label>
            <label>
              Số điện thoại*
              <input name="patient_phone" value={form.patient_phone} onChange={handleChange} />
            </label>
            <label>
              Email
              <input type="email" name="patient_email" value={form.patient_email} onChange={handleChange} />
            </label>
          </div>
        </section>

        <section>
          <h2>Thông tin đặt lịch</h2>
          <div className="form-grid">
            <label>
              Dịch vụ*
              <select name="service_id" value={form.service_id} onChange={handleChange}>
                <option value="">-- Chọn dịch vụ --</option>
                {services.map(service => (
                  <option key={service.id} value={service.id}>{service.name}</option>
                ))}
              </select>
            </label>
            <label>
              Bác sĩ*
              <select name="doctor_id" value={form.doctor_id} onChange={handleChange}>
                <option value="">-- Chọn bác sĩ --</option>
                {doctors.map(doc => (
                  <option key={doc.id} value={doc.id}>{doc.name} - {doc.specialty}</option>
                ))}
              </select>
            </label>
            <label>
              Ngày*
              <input type="date" name="appointment_date" value={form.appointment_date} min={today()} onChange={handleChange} />
            </label>
          </div>

          <div className="slot-picker">
            <div className="slot-picker__label">Khung giờ*</div>
            {loadingSlots ? (
              <div className="slot-picker__status">Đang tải khung giờ...</div>
            ) : availableSlots.length ? (
              <div className="slot-grid">
                {availableSlots.map(slot => (
                  <button
                    type="button"
                    key={slot.time}
                    className={`slot-btn ${form.appointment_slot === slot.time ? 'selected' : ''}`}
                    onClick={() => handleSlotSelect(slot.time)}
                  >
                    {formatSlotLabel(slot.time)}
                  </button>
                ))}
              </div>
            ) : (
              <div className="slot-picker__status">Không còn khung giờ trống trong ngày này.</div>
            )}
          </div>
        </section>

        <button type="submit" disabled={submitting}>{submitting ? 'Đang đặt...' : 'Đặt lịch'}</button>
      </form>
    </div>
  );
};

export default ReceptionistQuickBooking;