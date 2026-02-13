import React from 'react';

const ResumePreview = ({ data }) => {
    if (!data) return null;

    return (
        <div className="resume-paper">
            <div className="preview-badge">Preview</div>
            <header className="resume-header">
                <h1>{data.personal_info?.name || 'Your Name'}</h1>
                <div className="contact-info">
                    {data.personal_info?.phone && <span>{data.personal_info.phone}</span>}
                    {data.personal_info?.email && <span>{data.personal_info.email}</span>}
                    {data.personal_info?.linkedin && <span>LinkedIn</span>}
                    {data.personal_info?.github && <span>GitHub</span>}
                    {data.personal_info?.website && <span>Portfolio</span>}
                </div>
            </header>

            {data.summary && (
                <div className="resume-section">
                    <h2 className="section-title">Professional Summary</h2>
                    <p className="item-desc">{data.summary}</p>
                </div>
            )}

            {data.experience && data.experience.length > 0 && (
                <div className="resume-section">
                    <h2 className="section-title">Experience</h2>
                    {data.experience.map((exp, idx) => (
                        <div key={idx} className="resume-item">
                            <div className="item-header">
                                <strong>{exp.company || 'Company'}</strong>
                                <span>{exp.location}</span>
                            </div>
                            <div className="item-subheader" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>{exp.role || 'Role'}</span>
                                <span style={{ fontWeight: 'normal' }}>
                                    {exp.start_date} {exp.start_date && exp.end_date ? '--' : ''} {exp.end_date}
                                </span>
                            </div>
                            {exp.details && exp.details.length > 0 && (
                                <ul className="item-desc" style={{ paddingLeft: '1.2rem' }}>
                                    {exp.details.map((detail, dIdx) => (
                                        <li key={dIdx}>{detail}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {data.education && data.education.length > 0 && (
                <div className="resume-section">
                    <h2 className="section-title">Education</h2>
                    {data.education.map((edu, idx) => (
                        <div key={idx} className="resume-item">
                            <div className="item-header">
                                <strong>{edu.institution || 'Institution'}</strong>
                                <span>{edu.location}</span>
                            </div>
                            <div className="item-subheader" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>{edu.degree} {edu.gpa && `| GPA: ${edu.gpa}`}</span>
                                <span style={{ fontWeight: 'normal' }}>
                                    {edu.start_date} {edu.start_date && edu.end_date ? '--' : ''} {edu.end_date}
                                </span>
                            </div>
                            {edu.details && edu.details.length > 0 && (
                                <ul className="item-desc" style={{ paddingLeft: '1.2rem' }}>
                                    {edu.details.map((detail, dIdx) => (
                                        <li key={dIdx}>{detail}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {data.skills && data.skills.length > 0 && (
                <div className="resume-section">
                    <h2 className="section-title">Skills</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
                        {data.skills.map((skill, idx) => (
                            <div key={idx} className="item-desc" style={{ display: 'flex', gap: '0.5rem' }}>
                                <span style={{ fontWeight: 700 }}>{skill.category || 'Skills'}:</span>
                                <span>{Array.isArray(skill.skills) ? skill.skills.join(', ') : skill.skills}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {data.projects && data.projects.length > 0 && (
                <div className="resume-section">
                    <h2 className="section-title">Projects</h2>
                    {data.projects.map((proj, idx) => (
                        <div key={idx} className="resume-item">
                            <div className="item-header">
                                <strong>{proj.name || 'Project Title'}</strong>
                                {proj.link && <span style={{ fontSize: '9px', color: '#2563eb' }}>Link</span>}
                            </div>
                            <div className="item-subheader">
                                {Array.isArray(proj.technologies) ? proj.technologies.join(', ') : proj.technologies}
                            </div>
                            {proj.details && proj.details.length > 0 && (
                                <ul className="item-desc" style={{ paddingLeft: '1.2rem' }}>
                                    {proj.details.map((detail, dIdx) => (
                                        <li key={dIdx}>{detail}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {data.certifications && data.certifications.length > 0 && (
                <div className="resume-section">
                    <h2 className="section-title">Certifications</h2>
                    {data.certifications.map((cert, idx) => (
                        <div key={idx} className="resume-item">
                            <div className="item-header">
                                <strong>{cert.name || 'Certification Name'}</strong>
                                <span>{cert.date}</span>
                            </div>
                            <div className="item-subheader">{cert.issuer}</div>
                            {cert.details && cert.details.length > 0 && (
                                <ul className="item-desc" style={{ paddingLeft: '1.2rem' }}>
                                    {cert.details.map((detail, dIdx) => (
                                        <li key={dIdx}>{detail}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {data.languages && data.languages.length > 0 && (
                <div className="resume-section">
                    <h2 className="section-title">Languages</h2>
                    <p className="item-desc">
                        {data.languages.join(', ')}
                    </p>
                </div>
            )}

            {data.custom_sections && data.custom_sections.length > 0 && (
                data.custom_sections.map((section, sIdx) => (
                    section.items && section.items.length > 0 && (
                        <div key={sIdx} className="resume-section">
                            <h2 className="section-title">{section.title}</h2>
                            {section.items.map((item, iIdx) => (
                                <div key={iIdx} className="resume-item">
                                    <div className="item-header">
                                        <strong>{item.name}</strong>
                                        {item.date && <span>{item.date}</span>}
                                    </div>
                                    {item.organizer && (
                                        <div className="item-subheader">
                                            {item.organizer}
                                        </div>
                                    )}
                                    {item.details && item.details.length > 0 && (
                                        <ul className="item-desc" style={{ paddingLeft: '1.2rem' }}>
                                            {item.details.map((detail, dIdx) => (
                                                <li key={dIdx}>{detail}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            ))}
                        </div>
                    )
                ))
            )}
        </div>
    );
};

export default ResumePreview;
