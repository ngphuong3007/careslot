import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import Header from '../components/Header';
import './DoctorLayout.css';

const DoctorLayout = (props) => {
  return (
    <>
      <Header {...props} />
      <div className="doctor-layout-container">
        <aside className="doctor-sidebar">
          <nav>
            <ul>
              <li>
                <NavLink 
                  to="/doctor/dashboard" 
                  className={({ isActive }) => isActive ? 'active-link' : ''}
                >
                  Lịch làm việc
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/doctor/schedule" 
                  className={({ isActive }) => isActive ? 'active-link' : ''}
                >
                  Đăng ký Lịch làm việc
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/doctor/patients" 
                  className={({ isActive }) => isActive ? 'active-link' : ''}
                >
                  Quản lý Bệnh nhân
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/doctor/chat" 
                  className={({ isActive }) => isActive ? 'active-link' : ''}
                >
                  Tin nhắn
                </NavLink>
              </li>
            </ul>
          </nav>
        </aside>
        
        <main className="doctor-main-content">
          <Outlet />
        </main>
      </div>
    </>
  );
};

export default DoctorLayout;