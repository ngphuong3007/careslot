import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import Header from '../components/Header';
import './Admin.css';

const AdminLayout = (props) => {
  return (
    <div>
      <Header {...props} />
      <div className="admin-dashboard">
        <aside className="admin-sidebar">
          <nav>
            <NavLink to="/admin/users" className={({ isActive }) => isActive ? 'active' : ''}>
              Quản lý người dùng
            </NavLink>
            <NavLink to="/admin/services" className={({ isActive }) => isActive ? 'active' : ''}>
              Quản lý dịch vụ
            </NavLink>
            <NavLink to="/admin/appointments" className={({ isActive }) => isActive ? 'active' : ''}>
              Quản lý lịch hẹn
            </NavLink>
            <NavLink to="/admin/doctors" className={({ isActive }) => isActive ? 'active' : ''}>
              Quản lý bác sĩ
            </NavLink>
            <NavLink to="/admin/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
              Dashboard
            </NavLink>
          </nav>
        </aside>
        <main className="admin-main-content">
          {/* Các trang con sẽ được render ở đây */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;