import React from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import './pages.css';

const HomePage = () => {
    return (
        <div className="page-container home-page">
            <nav className="home-nav">
                <div className="nav-logo">
                    <div className="logo-icon">E</div>
                    <span className="logo-text">ElevateBox</span>
                </div>
                <div className="nav-links">
                    <ThemeToggle />
                    <Link to="/login" className="nav-link">Login</Link>
                    <Link to="/signup" className="btn-primary nav-btn">Get Started</Link>
                </div>
            </nav>

            <main className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">
                        Build Your <span className="gradient-text">Perfect Resume</span> with AI
                    </h1>
                    <p className="hero-subtitle">
                        Create stunning, ATS-optimized resumes in minutes. Let AI enhance your content,
                        categorize your skills, and tailor everything to your dream job.
                    </p>
                    <div className="hero-actions">
                        <Link to="/signup" className="btn-primary btn-large">
                            Start Building Free
                        </Link>
                        <Link to="/login" className="btn-secondary btn-large">
                            I already have an account
                        </Link>
                    </div>
                </div>

                <div className="hero-features">
                    <div className="feature-card">
                        <div className="feature-icon">✨</div>
                        <h3>AI-Powered</h3>
                        <p>Smart content expansion and skill categorization</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">📄</div>
                        <h3>Professional PDFs</h3>
                        <p>LaTeX-quality output in one click</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🎯</div>
                        <h3>Job Tailoring</h3>
                        <p>Optimize your resume for specific roles</p>
                    </div>
                </div>
            </main>

            <footer className="home-footer">
                <p>© 2026 ElevateBox. Built with ❤️ for job seekers.</p>
            </footer>
        </div>
    );
};

export default HomePage;
