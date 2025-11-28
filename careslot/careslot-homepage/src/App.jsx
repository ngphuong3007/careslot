import React, { useState, useContext } from 'react'; 
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthContext } from './context/AuthContext'; 

// Pages & Components
import Home from './pages/Home';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import ChangePassword from './components/ChangePassword';
import BookingModal from './components/BookingModal';
import AdminLayout from './pages/AdminLayout';
import AdminServiceManagement from './pages/AdminServiceManagement';
import AdminDoctorManagement from './pages/AdminDoctorManagement';
import AdminAppointmentManagement from './pages/AdminAppointmentManagement';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorLayout from './pages/DoctorLayout';
import DoctorSchedule from './pages/DoctorSchedule';
import PatientManagement from './pages/PatientManagement';
import ReceptionistDashboard from './pages/ReceptionistDashboard';
import Header from './components/Header';
import ReceptionistLayout from './pages/ReceptionistLayout';
import ReceptionistAppointmentConfirmation from './pages/ReceptionistAppointmentConfirmation';
import AppointmentLookupModal from './components/AppointmentLookupModal';
import DependentProfiles from './components/DependentProfiles';
import UserProfile from './components/UserProfile';
import AdminUserManagement from './pages/AdminUserManagement';
import ReceptionistQuickBooking from './pages/ReceptionistQuickBooking';
import AdminDashboard from './pages/AdminDashboard';
import { AuthProvider } from './context/AuthContext';
import ChatWidget from './components/ChatWidget';
import StaffChatPage from './pages/StaffChatPage';

// ... (Các Route bảo vệ không đổi) ...
const AdminRoute = ({ user, children }) => {
  if (!user) return <Navigate to="/" replace />;
  return user.role === 'admin' ? children : <Navigate to="/" replace />;
};
const DoctorRoute = ({ user, children }) => {
  if (!user) return <Navigate to="/" replace />;
  return user.role === 'doctor' ? children : <Navigate to="/" replace />;
};
const ReceptionistRoute = ({ user, children }) => {
  if (!user || user.role !== 'receptionist') {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const UserRoute = ({ user, children }) => {
  if (!user) return <Navigate to="/" replace />;
  return children;
};


function App() {
  // SỬA LẠI: Lấy trạng thái từ Context, không dùng useState và useEffect ở đây nữa
  const { currentUser, updateUser, logout } = useContext(AuthContext);

  const [authModalView, setAuthModalView] = useState(null);
  const [isBookingModalOpen, setBookingModalOpen] = useState(false);
  const [isUserMenuModalOpen, setUserMenuModalOpen] = useState(false);
  const [isLookupModalOpen, setLookupModalOpen] = useState(false);

  // XÓA BỎ: Toàn bộ khối useEffect và handleLogout cũ ở đây
  // useEffect(() => { ... });
  // const handleLogout = () => { ... };

  // SỬA LẠI: Hàm này nhận token và gọi hàm updateUser từ context
  const handleLoginSuccess = (token) => {
    updateUser(token);
    setAuthModalView(null);
  };

  const handleLogoutClick = () => {
    setUserMenuModalOpen(false);
    logout(); // Sử dụng hàm logout từ context
  };

  const closeAuthModal = () => setAuthModalView(null);
  const closeUserMenuModal = () => setUserMenuModalOpen(false);

  const handleChangePasswordFromMenu = () => {
    closeUserMenuModal();
    setAuthModalView('changePassword');
  };

  const homeProps = {
    currentUser,
    onLogout: handleLogoutClick,
    onLoginClick: () => setAuthModalView('login'),
    onBookClick: () => setBookingModalOpen(true),
    onUserMenuClick: () => setUserMenuModalOpen(true),
    onChangePasswordClick: handleChangePasswordFromMenu,
    onLookupClick: () => setLookupModalOpen(true),
  };

  const layoutHeaderProps = {
    currentUser,
    onLogout: handleLogoutClick,
    onLoginClick: () => setAuthModalView('login'),
    onBookClick: () => setBookingModalOpen(true),
    onUserMenuClick: () => setUserMenuModalOpen(true),
  };

  return (
    <Router>
      {authModalView && (
        <div className="modal-overlay" onClick={closeAuthModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            {authModalView === 'login' && <Login onLoginSuccess={handleLoginSuccess} onRegisterClick={() => setAuthModalView('register')} onForgotPasswordClick={() => setAuthModalView('forgotPassword')} />}
            {authModalView === 'register' && <Register onBack={() => setAuthModalView('login')} />}
            {authModalView === 'forgotPassword' && <ForgotPassword onBack={() => setAuthModalView('login')} />}
            {authModalView === 'changePassword' && <ChangePassword onClose={closeAuthModal} />}
          </div>
        </div>
      )}
      {isBookingModalOpen && <BookingModal onClose={() => setBookingModalOpen(false)} currentUser={currentUser} />}
      {isUserMenuModalOpen && currentUser && (
        <div className="modal-overlay" onClick={closeUserMenuModal}>
          <div className="modal-content user-menu-modal" onClick={e => e.stopPropagation()}>
            <div className="user-menu-header">
              <div className="user-menu-avatar">{currentUser.username.charAt(0).toUpperCase()}</div>
              <div className="user-menu-info">
                <span className="user-menu-name">{currentUser.username}</span>
                <span className="user-menu-id"> ID: {currentUser.id}</span>
              </div>
            </div>
            <hr className="user-menu-divider" />
            <div className="user-menu-modal-actions">
              {currentUser.role === 'user' && (
                <>
                  <Link to="/my-account/profile" className="modal-btn" onClick={closeUserMenuModal}>
                    <span role="img" aria-label="profile"></span> Chỉnh sửa hồ sơ
                  </Link>
                  <Link to="/my-account/dependents" className="modal-btn" onClick={closeUserMenuModal}>
                    <span role="img" aria-label="family"></span> Hồ sơ người thân
                  </Link>
                </>
              )}
              {currentUser.role === 'doctor' && ( <Link to="/doctor/dashboard" className="modal-btn" onClick={closeUserMenuModal}>Trang Bác Sĩ</Link> )}
              {currentUser.role === 'admin' && ( <Link to="/admin/users" className="modal-btn" onClick={closeUserMenuModal}>Trang quản trị</Link> )}
              {currentUser.role === 'receptionist' && ( <Link to="/receptionist/dashboard" className="modal-btn" onClick={closeUserMenuModal}>Trang Lễ tân</Link> )}
              <button onClick={handleChangePasswordFromMenu} className="modal-btn"> Đổi mật khẩu</button>
              <button onClick={handleLogoutClick} className="modal-btn"><span role="img" aria-label="logout"></span>Đăng xuất</button>
            </div>
            <button className="close-button" onClick={closeUserMenuModal}>×</button>
          </div>
        </div>
      )}
      {isLookupModalOpen && <AppointmentLookupModal onClose={() => setLookupModalOpen(false)} />}

      <Routes>
        <Route path="/" element={<Home {...homeProps} />} />
        
        <Route 
          path="/my-account/profile"
          element={
            <UserRoute user={currentUser}>
              <>
                <Header {...layoutHeaderProps} />
                <div style={{ paddingTop: '80px', minHeight: 'calc(100vh - 80px)', background: '#f4f7f9' }}>
                  <UserProfile />
                </div>
              </>
            </UserRoute>
          }
        />
        <Route 
          path="/my-account/dependents"
          element={
            <UserRoute user={currentUser}>
              <>
                <Header {...layoutHeaderProps} />
                <div style={{ paddingTop: '80px', minHeight: 'calc(100vh - 80px)', background: '#f4f7f9' }}>
                  <DependentProfiles />
                </div>
              </>
            </UserRoute>
          }
        />

        <Route
          path="/doctor"
          element={
            <DoctorRoute user={currentUser}>
              <DoctorLayout {...layoutHeaderProps} />
            </DoctorRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DoctorDashboard />} />
          <Route path="schedule" element={<DoctorSchedule />} />
          <Route path="patients" element={<PatientManagement role="doctor" />} />
          <Route path="chat" element={<StaffChatPage />} />
        </Route>

        <Route
          path="/admin"
          element={
            <AdminRoute user={currentUser}>
              <AdminLayout {...layoutHeaderProps} />
            </AdminRoute>
          }
        >
          <Route index element={<Navigate to="users" replace />} />
          <Route path="users" element={<AdminUserManagement />} />
          <Route path="services" element={<AdminServiceManagement />} />
          <Route path="appointments" element={<AdminAppointmentManagement />} />
          <Route path="doctors" element={<AdminDoctorManagement />} />
          <Route path="dashboard" element={<AdminDashboard />} />
        </Route>

        <Route
          path="/receptionist"
          element={
            <ReceptionistRoute user={currentUser}>
              <ReceptionistLayout {...layoutHeaderProps} />
            </ReceptionistRoute>
          }
        >
          <Route index element={<Navigate to="confirm-appointments" replace />} />
          <Route path="confirm-appointments" element={<ReceptionistAppointmentConfirmation />} />
          <Route path="dashboard" element={<ReceptionistDashboard />} />
          <Route path="patients" element={<PatientManagement role="receptionist" />} />
          <Route path="quick-booking" element={<ReceptionistQuickBooking />} />
          <Route path="chat" element={<StaffChatPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {(!currentUser || currentUser.role === 'user') && <ChatWidget />}
    </Router>
  );
}

export default App;