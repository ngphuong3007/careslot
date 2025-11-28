import React from 'react';
import './Footer.css'; // Assuming you have a CSS file for styling

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-content">
                <h2>Phòng khám CARESLOT</h2>
                <p>Địa chỉ: 475A Điện Biên Phủ, Thạnh Mỹ Tây, TP. Hồ Chí Minh</p>
                <p>Email: support@careslot.com</p>
                <p>Hotline: 19001234</p>
            </div>
            <div className="footer-bottom">
                <p>&copy; 2023 CareSlot. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;