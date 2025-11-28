import React from 'react';
import './AppointmentButton.css'; // Assuming you have a CSS file for styling

const AppointmentButton = ({ onClick, label }) => {
    return (
        <button className="appointment-button" onClick={onClick}>
            {label}
        </button>
    );
};

export default AppointmentButton;