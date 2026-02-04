import React, { useState } from 'react';
import { showToast } from '../utils/toast';

const ProfileForm = ({ data, onChange }) => {
    const [errors, setErrors] = useState({});

    const validateField = (name, value) => {
        const requiredFields = ['name', 'email', 'phone', 'location'];
        if (requiredFields.includes(name) && !value.trim()) {
            return `${name.charAt(0).toUpperCase() + name.slice(1)} is required`;
        }
        if (name === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            return 'Please enter a valid email address';
        }
        return null;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        onChange('profile', { ...data, [name]: value });

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        const error = validateField(name, value);
        if (error) {
            setErrors(prev => ({ ...prev, [name]: error }));
        }
    };

    return (
        <div className="section-form">
            <h3>Personal Information</h3>
            <div className="card" style={{ padding: '2rem' }}>
                <div className="form-group">
                    <label>
                        Full Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={data.name || ''}
                        onChange={handleChange}
                        placeholder="Enter your full name"
                        onBlur={handleBlur}
                    />
                    {errors.name && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.name}</span>}
                </div>

                <div className="grid-2">
                    <div className="form-group">
                        <label>
                            Email Address <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={data.email || ''}
                            onChange={handleChange}
                            placeholder="Enter your email address"
                            onBlur={handleBlur}
                        />
                        {errors.email && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.email}</span>}
                    </div>
                    <div className="form-group">
                        <label>
                            Phone Number <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            value={data.phone || ''}
                            onChange={handleChange}
                            placeholder="Enter your phone number"
                            onBlur={handleBlur}
                        />
                        {errors.phone && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.phone}</span>}
                    </div>
                </div>

                <div className="form-group">
                    <label>
                        Location <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                        type="text"
                        name="location"
                        value={data.location || ''}
                        onChange={handleChange}
                        placeholder="Enter your city and country"
                        onBlur={handleBlur}
                    />
                    {errors.location && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.location}</span>}
                </div>

                <div className="grid-2">
                    <div className="form-group">
                        <label>LinkedIn</label>
                        <input
                            type="url"
                            name="linkedin"
                            value={data.linkedin || ''}
                            onChange={handleChange}
                            placeholder="Enter your LinkedIn profile URL"
                        />
                    </div>
                    <div className="form-group">
                        <label>GitHub</label>
                        <input
                            type="url"
                            name="github"
                            value={data.github || ''}
                            onChange={handleChange}
                            placeholder="Enter your GitHub profile URL"
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>Portfolio / Website</label>
                    <input
                        type="url"
                        name="website"
                        value={data.website || ''}
                        onChange={handleChange}
                        placeholder="Enter your portfolio or personal website URL"
                    />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Professional Summary</label>
                    <textarea
                        name="summary"
                        value={data.summary || ''}
                        onChange={handleChange}
                        placeholder="Write a brief summary of your professional background, key skills, and career objectives..."
                        rows="4"
                    />
                </div>
            </div>
        </div>
    );
};

export default ProfileForm;
