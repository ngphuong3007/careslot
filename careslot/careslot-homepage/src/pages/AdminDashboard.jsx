import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2'; // Thay đổi: Dùng Bar thay vì Line
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement, // Thay đổi: Dùng BarElement
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './AdminDashboard.css';

// Đăng ký các thành phần cho biểu đồ cột
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    revenue: [],
    newAppointments: 0,
    cancelRate: 0,
    bestDoctor: null,
    bestService: null
  });
  const [timeRange, setTimeRange] = useState('week'); // Thêm state cho bộ lọc: 'day', 'week', 'month'

  useEffect(() => {
    // Gọi API với tham số timeRange
    fetch(`http://localhost:5000/api/admin/dashboard-metrics?range=${timeRange}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(setStats)
      .catch(console.error);
  }, [timeRange]); // useEffect sẽ chạy lại khi timeRange thay đổi

  const chartData = {
    labels: stats.revenue.map(item => item.label),
    datasets: [
      {
        label: 'Doanh thu',
        data: stats.revenue.map(item => item.value),
        backgroundColor: 'rgba(59, 130, 246, 0.7)', // Màu nền cho cột
        borderColor: 'rgba(59, 130, 246, 1)', // Màu viền cho cột
        borderWidth: 1,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true // Bắt đầu trục Y từ 0
      }
    }
  };

  return (
    <div className="admin-dashboard-page">
      <h1>Dashboard thống kê</h1>
      <div className="stat-grid">
        {/* ... các thẻ stat-card không đổi ... */}
        <div className="stat-card">
          <p>Lịch hẹn mới ({timeRange === 'day' ? 'hôm nay' : (timeRange === 'week' ? '7 ngày' : '30 ngày')})</p>
          <h2>{stats.newAppointments}</h2>
        </div>
        <div className="stat-card">
          <p>Tỉ lệ hủy lịch</p>
          <h2>{stats.cancelRate}%</h2>
        </div>
        <div className="stat-card">
          <p>Bác sĩ doanh thu cao nhất</p>
          <h2>{stats.bestDoctor?.name || 'N/A'}</h2>
          <span>{stats.bestDoctor?.revenue?.toLocaleString()} đ</span>
        </div>
        <div className="stat-card">
          <p>Dịch vụ doanh thu cao nhất</p>
          <h2>{stats.bestService?.name || 'N/A'}</h2>
          <span>{stats.bestService?.revenue?.toLocaleString()} đ</span>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-header">
          <h3>Biểu đồ doanh thu</h3>
          <div className="chart-filters">
            {/* Cập nhật state khi nhấn nút */}
            <button onClick={() => setTimeRange('day')} className={timeRange === 'day' ? 'active' : ''}>Ngày</button>
            <button onClick={() => setTimeRange('week')} className={timeRange === 'week' ? 'active' : ''}>Tuần</button>
            <button onClick={() => setTimeRange('month')} className={timeRange === 'month' ? 'active' : ''}>Tháng</button>
          </div>
        </div>
        {/* Thay đổi: Dùng Bar và thêm options */}
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default AdminDashboard;