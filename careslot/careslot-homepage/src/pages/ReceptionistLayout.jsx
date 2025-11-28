import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import Header from '../components/Header';
import './ReceptionistLayout.css';

const ReceptionistLayout = (props) => {
  return (
    <>
      <Header {...props} />
      <div className="receptionist-layout-container">
        <aside className="receptionist-sidebar">
          <nav>
            <ul>
              <li>
                <NavLink 
                  to="/receptionist/confirm-appointments" 
                  className={({ isActive }) => isActive ? 'active-link' : ''}
                >
                  Xác nhận Lịch hẹn
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/receptionist/dashboard" 
                  className={({ isActive }) => isActive ? 'active-link' : ''}
                >
                  Gửi Lời nhắc Lịch hẹn
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/receptionist/quick-booking" 
                  className={({ isActive }) => isActive ? 'active-link' : ''}
                >
                  Đặt lịch vãng lai
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/receptionist/patients" 
                  className={({ isActive }) => isActive ? 'active-link' : ''}
                >
                  Quản lý Bệnh nhân
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/receptionist/chat" 
                  className={({ isActive }) => isActive ? 'active-link' : ''}
                >
                  Tin nhắn
                </NavLink>
              </li>
            </ul>
          </nav>
        </aside>
        
        <main className="receptionist-main-content">
          <Outlet />
        </main>
      </div>
    </>
  );
};

export default ReceptionistLayout;