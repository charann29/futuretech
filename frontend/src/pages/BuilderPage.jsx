import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import '../App.css'
import MainLayout from '../components/MainLayout'
import Sidebar from '../components/Sidebar'
import ProfileForm from '../components/ProfileForm'
import ListSectionForm from '../components/ListSectionForm'
import CustomSectionsForm from '../components/CustomSectionsForm'
import ResumePreview from '../components/ResumePreview'
import { processResume, generateResumePDF, getResume, saveResume } from '../utils/api'
import { showToast } from '../utils/toast'

function BuilderPage() {
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const resumeId = searchParams.get('id')

    const [activeSection, setActiveSection] = useState('personal_info')
    const [isSaving, setIsSaving] = useState(false)
    const [lastSaved, setLastSaved] = useState(new Date())
    const [analysisFeedback, setAnalysisFeedback] = useState(null)

    // State matches Resume Pydantic schema 1:1
    const [resumeData, setResumeData] = useState({
        id: resumeId || null,
        personal_info: {
            name: '',
            email: '',
            phone: '',
            location: '',
            linkedin: '',
            github: '',
            website: ''
        },
        education: [],
        experience: [],
        projects: [],
        skills: [],
        certifications: [],
        languages: [],
        custom_sections: [],
        job_description: '',
        summary: ''
    })

    useEffect(() => {
        if (resumeId) {
            const loadResume = async () => {
                try {
                    const data = await getResume(resumeId);
                    setResumeData({ ...data, id: resumeId });
                } catch (error) {
                    console.error('Failed to load resume:', error);
                    showToast.error('Could not load resume. Starting fresh.');
                }
            };
            loadResume();
        }
    }, [resumeId]);

    const handleDataChange = (section, data) => {
        setResumeData(prev => ({ ...prev, [section]: data }))
    }

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (resumeData.personal_info.name) {
                setIsSaving(true);
                try {
                    const result = await saveResume(resumeData);
                    if (!resumeData.id && result.id) {
                        setResumeData(prev => ({ ...prev, id: result.id }));
                    }
                    setLastSaved(new Date());
                } catch (error) {
                    console.error('Auto-save failed:', error);
                } finally {
                    setIsSaving(false);
                }
            }
        }, 2000);
        return () => clearTimeout(timer);
    }, [resumeData]);

    const handleDownload = async () => {
        setIsSaving(true);
        try {
            const result = await generateResumePDF(resumeData);

            // If we got a GCS path back, save it into our Supabase record
            if (result && result.gcs_path && resumeData.id) {
                await saveResume({ ...resumeData, gcs_path: result.gcs_path });
                showToast.success('Resume generated and saved to your library!');
            } else {
                showToast.success('Resume generated! Check your downloads.');
            }
        } catch (error) {
            console.error('Download failed:', error);
            showToast.error('Failed to generate PDF. Please ensure the backend server is running and GCS is configured.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEnhance = async () => {
        setIsSaving(true);
        setAnalysisFeedback(null);
        try {
            const response = await processResume(resumeData);
            setResumeData(response.resume);
            if (response.analysis) {
                setAnalysisFeedback(response.analysis);
            }
            showToast.success('Resume enhanced! Review the AI tailored content.');
        } catch (error) {
            console.error('Processing failed:', error);
            showToast.error('AI Processing failed. Please check your connection or try again later.');
        } finally {
            setIsSaving(false);
        }
    };

    const renderForm = () => {
        switch (activeSection) {
            case 'personal_info':
                return (
                    <div className="section-form">
                        <ProfileForm
                            data={{ ...resumeData.personal_info, summary: resumeData.summary }}
                            onChange={(section, data) => {
                                if (section === 'profile') {
                                    const { summary, ...personal_info } = data;
                                    setResumeData(prev => ({
                                        ...prev,
                                        personal_info,
                                        summary: summary || ''
                                    }));
                                }
                            }}
                        />
                        <div className="card" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
                            <label>Target Job Description</label>
                            <textarea
                                rows="6"
                                placeholder="Paste the job description here to tailor your resume..."
                                value={resumeData.job_description || ''}
                                onChange={(e) => handleDataChange('job_description', e.target.value)}
                                style={{ marginTop: '0.5rem', resize: 'none' }}
                            />
                            <button
                                className="btn-primary"
                                style={{ marginTop: '1.25rem', width: '100%' }}
                                onClick={handleEnhance}
                                disabled={!resumeData.job_description || isSaving}
                            >
                                {isSaving ? 'Processing...' : '✨ Run AI Pipeline (Expand & Tailor)'}
                            </button>
                        </div>

                        {analysisFeedback && (
                            <div className="card" style={{ padding: '1.5rem', marginTop: '1.5rem', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                                <h4 style={{ color: '#2563eb', marginBottom: '1rem' }}>AI Analysis Feedback</h4>
                                {analysisFeedback.match_explanation && (
                                    <div style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
                                        <strong>Job Match Explanation:</strong>
                                        <p style={{ marginTop: '0.5rem' }}>{analysisFeedback.match_explanation}</p>
                                    </div>
                                )}
                                {analysisFeedback.missing_skills?.length > 0 && (
                                    <div style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
                                        <strong>Missing Skills:</strong>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                                            {analysisFeedback.missing_skills.map(skill => (
                                                <span key={skill} style={{ padding: '0.2rem 0.5rem', background: '#fee2e2', color: '#991b1b', borderRadius: '4px', fontSize: '0.75rem' }}>
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                    <em>The AI has automatically incorporated these insights into your enhanced resume.</em>
                                </div>
                            </div>
                        )}
                    </div>
                )
            case 'education':
                return (
                    <ListSectionForm
                        title="Education"
                        section="education"
                        data={resumeData.education}
                        onChange={handleDataChange}
                        itemTemplate={{ degree: '', institution: '', end_date: '', location: '', gpa: '', start_date: '', details: [] }}
                    />
                )
            case 'experience':
                return (
                    <ListSectionForm
                        title="Work Experience"
                        section="experience"
                        data={resumeData.experience}
                        onChange={handleDataChange}
                        itemTemplate={{ role: '', company: '', end_date: '', details: [], location: '', start_date: '' }}
                    />
                )
            case 'projects':
                return (
                    <ListSectionForm
                        title="Projects"
                        section="projects"
                        data={resumeData.projects}
                        onChange={handleDataChange}
                        itemTemplate={{ name: '', technologies: [], details: [], link: '' }}
                    />
                )
            case 'skills':
                return (
                    <ListSectionForm
                        title="Technical Skills"
                        section="skills"
                        data={resumeData.skills}
                        onChange={handleDataChange}
                        itemTemplate={{ category: '', skills: [] }}
                    />
                )
            case 'certifications':
                return (
                    <ListSectionForm
                        title="Certifications"
                        section="certifications"
                        data={resumeData.certifications}
                        onChange={handleDataChange}
                        itemTemplate={{ name: '', issuer: '', date: '', link: '', details: [] }}
                    />
                )
            case 'languages':
                return (
                    <div className="section-form">
                        <h3>Languages</h3>
                        <div className="card" style={{ padding: '1.5rem' }}>
                            <label>Languages Known (comma separated)</label>
                            <input
                                type="text"
                                value={resumeData.languages.join(', ')}
                                onChange={(e) => handleDataChange('languages', e.target.value.split(',').map(s => s.trim()))}
                                placeholder="e.g. English, Hindi, Telugu"
                            />
                        </div>
                    </div>
                )
            case 'custom_sections':
                return (
                    <CustomSectionsForm
                        data={resumeData.custom_sections || []}
                        onChange={handleDataChange}
                    />
                )
            default:
                return <div className="card" style={{ padding: '2rem' }}>Section under development</div>
        }
    }

    return (
        <MainLayout
            isSaving={isSaving}
            lastSaved={lastSaved}
            onDownload={handleDownload}
            sidebar={<Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />}
            preview={<ResumePreview data={resumeData} />}
        >
            <div className="form-wrapper">
                {renderForm()}
            </div>
        </MainLayout>
    )
}

export default BuilderPage
