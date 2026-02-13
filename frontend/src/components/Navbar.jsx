import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const isLandingPage = location.pathname === '/landing.html' || location.pathname === '/';

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
    };

    return (
        <div className={`navbar-intensive ${scrolled ? 'scrolled' : ''}`}>
            <div data-collapse="medium" data-animation="default" data-duration="400" data-doc-height="1"
                data-easing="ease" data-easing2="ease" role="banner" className="navbar-9 w-nav">
                <div className="container-28 intensive-2-0 w-container">
                    <a href="/landing.html" className="brand-9 w-nav-brand">
                        <div className="intensive-new-logo">
                            <img src='/logo.png' alt='FutureTech' style={{ height: '70px', width: 'auto' }} />
                        </div>
                    </a>
                    <div className="menu-button-6 w-nav-button" onClick={toggleMobileMenu}>
                        <div className="icon-34 w-icon-nav-menu"></div>
                    </div>
                    <nav role="navigation" className={`nav-menu-home-3 w-nav-menu ${mobileMenuOpen ? 'open' : ''}`} style={{ display: 'flex', alignItems: 'center' }}>
                        {/* Hidden logo-div removed as it was appearing on desktop */}

                        <a href={isLandingPage ? "#curriculum" : "/landing.html#curriculum"} className="desktop-navbar-items track-class w-nav-link" onClick={closeMobileMenu}>Curriculum</a>
                        <a href={isLandingPage ? "#job-support" : "/landing.html#job-support"} className="desktop-navbar-items track-class w-nav-link" onClick={closeMobileMenu}>Job Support</a>
                        <a href={isLandingPage ? "#reviews" : "/landing.html#reviews"} className="desktop-navbar-items track-class w-nav-link" onClick={closeMobileMenu}>Reviews</a>
                        <a href={isLandingPage ? "#pricing" : "/landing.html#pricing"} className="desktop-navbar-items track-class w-nav-link" onClick={closeMobileMenu}>Fee</a>
                        <a href={isLandingPage ? "#faqs" : "/landing.html#faqs"} className="desktop-navbar-items track-class w-nav-link" onClick={closeMobileMenu}>FAQs</a>

                        {user ? (
                            <>
                                <Link to="/resumes" className="desktop-navbar-items track-class w-nav-link" onClick={closeMobileMenu}>Resume Builder</Link>
                                <Link to="/profile" className="desktop-navbar-items track-class w-nav-link" onClick={closeMobileMenu}>Profile</Link>
                            </>
                        ) : (
                            <Link to="/login" className="desktop-navbar-items track-class w-nav-link" onClick={closeMobileMenu}>Login</Link>
                        )}
                    </nav>
                </div>
            </div>
        </div>
    );
};

export default Navbar;
