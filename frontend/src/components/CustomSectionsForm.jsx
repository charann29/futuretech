import React, { useState } from 'react';
import { showToast } from '../utils/toast';
import ListSectionForm from './ListSectionForm';
import { X, Pencil } from 'lucide-react';

const CustomSectionsForm = ({ data, onChange }) => {
    const [activeCustomIdx, setActiveCustomIdx] = useState(data.length > 0 ? 0 : null);
    const [isAdding, setIsAdding] = useState(false);
    const [newSectionTitle, setNewSectionTitle] = useState('');
    const [editingIdx, setEditingIdx] = useState(null);
    const [editTitle, setEditTitle] = useState('');

    const handleAddSection = (e) => {
        e.preventDefault();
        if (newSectionTitle.trim()) {
            const newSection = { title: newSectionTitle.trim(), items: [] };
            onChange('custom_sections', [...data, newSection]);
            setActiveCustomIdx(data.length);
            setNewSectionTitle('');
            setIsAdding(false);
        }
    };

    const removeSection = (idx) => {
        const sectionTitle = data[idx].title;
        const newData = data.filter((_, i) => i !== idx);
        onChange('custom_sections', newData);
        setActiveCustomIdx(newData.length > 0 ? 0 : null);
        showToast.success(`"${sectionTitle}" section deleted`);
    };

    const updateSectionItems = (idx, sectionKey, items) => {
        const newData = [...data];
        newData[idx] = { ...newData[idx], items };
        onChange('custom_sections', newData);
    };

    const handleRename = (e, idx) => {
        e.preventDefault();
        if (editTitle.trim() && editTitle.trim() !== data[idx].title) {
            const newData = [...data];
            newData[idx] = { ...newData[idx], title: editTitle.trim() };
            onChange('custom_sections', newData);
        }
        setEditingIdx(null);
    };

    const startEditing = (idx) => {
        setEditingIdx(idx);
        setEditTitle(data[idx].title);
    };

    return (
        <div className="section-form">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3>Custom Sections</h3>
                {!isAdding && (
                    <button className="btn-primary" onClick={() => setIsAdding(true)}>+ Add Section</button>
                )}
            </div>

            {isAdding && (
                <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem', background: 'var(--bg-card-hover)' }}>
                    <form onSubmit={handleAddSection} style={{ display: 'flex', gap: '0.75rem' }}>
                        <input
                            autoFocus
                            type="text"
                            placeholder="e.g. Awards & Achievements"
                            value={newSectionTitle}
                            onChange={(e) => setNewSectionTitle(e.target.value)}
                            style={{ flex: 1 }}
                        />
                        <button type="submit" className="btn-primary" style={{ padding: '0 1.25rem' }}>Create</button>
                        <button type="button" className="btn-secondary" onClick={() => setIsAdding(false)}>Cancel</button>
                    </form>
                </div>
            )}

            {data.length > 0 ? (
                <div className="custom-sections-container">
                    <div className="tabs" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem', minHeight: '48px' }}>
                        {data.map((section, idx) => (
                            <div
                                key={idx}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    background: activeCustomIdx === idx ? 'var(--primary)' : 'var(--bg-card)',
                                    color: activeCustomIdx === idx ? 'white' : 'var(--text-main)',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    border: '1px solid var(--border)',
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.2s ease'
                                }}
                                onClick={() => setActiveCustomIdx(idx)}
                            >
                                {editingIdx === idx ? (
                                    <form onSubmit={(e) => handleRename(e, idx)} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <input
                                            autoFocus
                                            type="text"
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            style={{
                                                width: '120px',
                                                height: '24px',
                                                padding: '0 4px',
                                                fontSize: '0.875rem',
                                                background: 'var(--bg-main)'
                                            }}
                                            onBlur={(e) => handleRename(e, idx)}
                                        />
                                    </form>
                                ) : (
                                    <span>{section.title}</span>
                                )}

                                <div style={{ display: 'flex', gap: '0.25rem', opacity: activeCustomIdx === idx ? 1 : 0.6 }}>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); startEditing(idx); }}
                                        style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
                                        title="Rename"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); removeSection(idx); }}
                                        style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
                                        title="Delete"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {activeCustomIdx !== null && data[activeCustomIdx] && (
                        <ListSectionForm
                            title={data[activeCustomIdx].title}
                            section="items"
                            data={data[activeCustomIdx].items}
                            onChange={(unused, items) => updateSectionItems(activeCustomIdx, unused, items)}
                            itemTemplate={{ name: '', organizer: '', date: '', link: '', details: [] }}
                        />
                    )}
                </div>
            ) : !isAdding && (
                <div style={{ textAlign: 'center', padding: '3rem', border: '2px dashed var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-muted)' }}>
                    <p>Add custom sections like Awards, Achievements, or Publications.</p>
                    <button className="btn-primary" onClick={() => setIsAdding(true)} style={{ marginTop: '1rem' }}>
                        Create your first custom section
                    </button>
                </div>
            )}
        </div>
    );
};

export default CustomSectionsForm;
