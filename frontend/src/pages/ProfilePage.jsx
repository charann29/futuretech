import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import { showToast } from '../utils/toast';
import './pages.css';

const ProfilePage = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await signOut();
            navigate('/login');
            showToast.success('Logged out successfully');
        } catch (error) {
            console.error('Logout failed:', error);
            showToast.error('Failed to logout');
        }
    };

    return (
        <div className="page-container">


            <main className="selector-page">
                <header className="selector-header">
                    <h1>My Profile</h1>
                    <p>Manage your account settings</p>
                </header>

                <div className="max-w-2xl mx-auto">
                    <div className="auth-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1.5rem' }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                background: 'var(--primary-glow)',
                                color: 'var(--primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <User size={40} />
                            </div>

                            <div>
                                <h3 style={{ margin: 0 }}>{user?.email}</h3>
                                <p style={{ color: 'var(--text-muted)' }}>Registered User</p>
                            </div>

                            <div style={{ width: '100%', borderTop: '1px solid var(--border)', margin: '1rem 0' }}></div>

                            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <button
                                    className="btn-primary"
                                    onClick={() => navigate('/resumes')}
                                    style={{ width: '100%', justifyContent: 'center' }}
                                >
                                    Go to Resume Builder
                                </button>

                                <button
                                    className="btn-secondary"
                                    onClick={handleLogout}
                                    style={{ width: '100%', justifyContent: 'center', borderColor: '#ef4444', color: '#ef4444' }}
                                >
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ProfilePage;
