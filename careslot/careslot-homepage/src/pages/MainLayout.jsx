import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import Header from '../components/Header';
import './Admin.css'; 

const DoctorLayout = (props) => {
  return (
    <div className="admin-layout"> {/* Sử dụng class của AdminLayout */}
      <Header {...props} />
      <div className="admin-container">
        <aside className="admin-sidebar">
          <nav>
            <ul>
              <li>
                <NavLink to="/doctor/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
                  Lịch hẹn
                </NavLink>
              </li>
              <li>
                <NavLink to="/doctor/schedule" className={({ isActive }) => isActive ? 'active' : ''}>
                  Quản lý Lịch làm việc
                </NavLink>
              </li>
              {/* Thêm các link khác cho bác sĩ ở đây trong tương lai */}
            </ul>
          </nav>
        </aside>
        <main className="admin-main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DoctorLayout;