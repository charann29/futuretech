import React from 'react';
import '../pages/pages.css';

const AuthLayout = ({ children, title, subtitle }) => {
    return (
        <div className="auth-wrapper">
            <div className="auth-glass-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <a href="/index2.html" style={{ display: 'block', width: 'fit-content', margin: '0 auto 1.5rem' }}>
                            <img src="/logo.png" alt="Future Tech" style={{ height: '60px', width: 'auto', display: 'block' }} />
                        </a>
                        <h1>{title}</h1>
                        {subtitle && <p className="auth-subtitle">{subtitle}</p>}
                    </div>
                    {children}
                </div>
            </div>
            <div className="auth-bg-blobs">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
            </div>
        </div>
    );
};

export default AuthLayout;
