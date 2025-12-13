import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2'; // Thay đổi: Dùng Bar thay vì Line
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement, 
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './AdminDashboard.css';
import { apiRequest } from '../utils/api';

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
  const [timeRange, setTimeRange] = useState('week');

  useEffect(() => {
    apiRequest(`/api/admin/dashboard-metrics?range=${timeRange}`)
      .then((data) => {
        const formatOptions =
          timeRange === 'day'
            ? { hour: '2-digit', minute: '2-digit' }
            : { day: '2-digit', month: '2-digit' };

        const revenue = (data.revenue || []).map((item) => ({
          ...item,
          // item.label đang là ISO -> format lại cho đẹp
          label: new Date(item.label).toLocaleString('vi-VN', formatOptions),
        }));

        setStats({ ...data, revenue });
      })
      .catch(console.error);
  }, [timeRange]);

  const chartData = {
    labels: stats.revenue.map(item => item.label),
    datasets: [
      {
        label: 'Doanh thu',
        data: stats.revenue.map(item => item.value),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: false },
    },
    scales: { y: { beginAtZero: true } }
  };

  return (
    <div className="admin-dashboard-page">
      <h1>Dashboard thống kê</h1>
      <div className="stat-grid">
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
            <button onClick={() => setTimeRange('day')} className={timeRange === 'day' ? 'active' : ''}>Ngày</button>
            <button onClick={() => setTimeRange('week')} className={timeRange === 'week' ? 'active' : ''}>Tuần</button>
            <button onClick={() => setTimeRange('month')} className={timeRange === 'month' ? 'active' : ''}>Tháng</button>
          </div>
        </div>
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default AdminDashboard;