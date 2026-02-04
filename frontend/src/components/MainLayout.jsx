import React, { useState } from 'react';
import ThemeToggle from './ThemeToggle';

const MainLayout = ({ sidebar, children, preview, isSaving, lastSaved, onDownload }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const formatTime = (date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    return (
        <div className="main-layout-wrapper">
            <header className="app-header">
                <div className="header-left">
                    <button
                        className="btn-icon sidebar-toggle"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        title={isSidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
                    >
                        ☰
                    </button>
                    <div className="logo-icon">E</div>
                    <span className="logo-text">ElevateBox</span>
                </div>
                <div className="header-center">
                    <div className="status-indicator">
                        <span
                            className="status-dot"
                            style={{ background: isSaving ? '#fbbf24' : '#10b981' }}
                        ></span>
                        <span className="status-text">
                            {isSaving ? 'Saving changes...' : `Saved at ${formatTime(lastSaved)}`}
                        </span>
                    </div>
                </div>
                <div className="header-right">
                    <ThemeToggle />
                    <button className="btn-secondary">Preview</button>
                    <button className="btn-primary" onClick={onDownload} disabled={isSaving}>
                        {isSaving ? 'Processing...' : 'Download PDF'}
                    </button>
                </div>
            </header>

            <div className={`main-layout ${isSidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
                <aside className="sidebar">
                    {sidebar}
                </aside>
                <main className="content-area">
                    <div className="form-container">
                        {children}
                    </div>
                </main>
                <div className="preview-area">
                    {preview}
                </div>
            </div>
        </div>
    );
};

export default MainLayout;
