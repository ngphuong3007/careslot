import React from 'react';
import HeroSection from '../components/HeroSection';
import InfoSection from '../components/InfoSection';
import DoctorSection from '../components/DoctorSection';
import ClinicInfoSection from '../components/ClinicInfoSection';
import Footer from '../components/Footer';
import NewsSection from '../components/NewsSection';
import '../styles/main.css';

// SỬA LẠI: Thêm onLookupClick vào danh sách props
const Home = ({ onLoginClick, onBookClick, currentUser, onLogout, onChangePasswordClick, onUserMenuClick, onLookupClick }) => {
    return (
        <div>
            <HeroSection 
                onLoginClick={onLoginClick} 
                onBookClick={onBookClick} 
                currentUser={currentUser}
                onLogout={onLogout}
                onChangePasswordClick={onChangePasswordClick}
                onUserMenuClick={onUserMenuClick}
                // SỬA LẠI: Truyền prop onLookupClick xuống
                onLookupClick={onLookupClick}
            />
            <InfoSection />
            <NewsSection />
            <DoctorSection currentUser={currentUser} />
            <ClinicInfoSection />
            <Footer />
            </div>
    );
};

export default Home;