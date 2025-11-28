import React from 'react';
import './InfoSection.css'; // Assuming you have a CSS file for styling

const InfoSection = ({ title, description, image }) => {
    return (
        <div className="info-section">
            <div className="info-section-content">
                <h2>{title}</h2>
                <p>{description}</p>
            </div>
            {image && <img src={image} alt={title} className="info-section-image" />}
        </div>
    );
};

export default InfoSection;