import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, GraduationCap, Briefcase, Wrench, Rocket, Award, Globe, FolderOpen, ArrowLeft } from 'lucide-react';

const Sidebar = ({ activeSection, setActiveSection }) => {
    const navigate = useNavigate();
    const navItems = [
        { id: 'personal_info', label: 'Profile', Icon: User },
        { id: 'education', label: 'Education', Icon: GraduationCap },
        { id: 'experience', label: 'Experience', Icon: Briefcase },
        { id: 'skills', label: 'Skills', Icon: Wrench },
        { id: 'projects', label: 'Projects', Icon: Rocket },
        { id: 'certifications', label: 'Certifications', Icon: Award },
        { id: 'languages', label: 'Languages', Icon: Globe },
        { id: 'custom_sections', label: 'Custom Sections', Icon: FolderOpen },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button
                className="nav-item"
                style={{
                    marginBottom: '1rem',
                    background: 'transparent',
                    border: '1px dashed var(--border)',
                    justifyContent: 'center',
                    padding: '0.75rem'
                }}
                onClick={() => navigate('/resumes')}
            >
                <span className="nav-icon"><ArrowLeft size={18} /></span>
                <span className="nav-label">All Resumes</span>
            </button>
            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
                        onClick={() => setActiveSection(item.id)}
                    >
                        <span className="nav-icon"><item.Icon size={18} /></span>
                        <span className="nav-label">{item.label}</span>
                    </button>
                ))}
            </nav>
        </div>
    );
};

export default Sidebar;
