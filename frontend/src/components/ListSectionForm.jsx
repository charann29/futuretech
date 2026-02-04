import React, { useState } from 'react';
import { showToast } from '../utils/toast';
import { Trash2, ChevronDown, Plus, XCircle, X } from 'lucide-react';

const ListSectionForm = ({ title, section, data, onChange, itemTemplate }) => {
    const [expandedId, setExpandedId] = useState(data.length > 0 ? (data[0].id || 0) : null);

    // Define which fields are mandatory (all except 'details', 'technologies', 'link', and 'id')
    const isMandatoryField = (field) => {
        const optionalFields = ['details', 'technologies', 'link', 'id'];
        return !optionalFields.includes(field);
    };

    // Validate if an item has all mandatory fields filled
    const validateItem = (item) => {
        const emptyFields = [];
        Object.keys(itemTemplate).forEach((field) => {
            if (isMandatoryField(field) && !item[field]) {
                emptyFields.push(field.replace(/_/g, ' '));
            }
        });
        return emptyFields;
    };

    // Get better placeholder text based on field name and section
    const getPlaceholder = (field, sectionType) => {
        const placeholders = {
            // Education fields
            institution: 'Enter university or school name',
            degree: 'Enter degree or qualification',
            start_date: 'e.g., 2018 or Aug 2018',
            end_date: 'e.g., 2022 or Present',
            gpa: 'e.g., 3.8/4.0',
            location: 'Enter city, state/country',
            // Experience fields
            company: 'Enter company name',
            role: 'Enter job title or role',
            // Project fields
            name: 'Enter project name',
            // Common fields
            details: 'Enter description or achievement',
            technologies: 'Enter technology or skill'
        };
        return placeholders[field] || `Enter ${field.replace(/_/g, ' ')}`;
    };

    const addItem = () => {
        const newItem = { id: Date.now(), ...itemTemplate };
        onChange(section, [...data, newItem]);
        setExpandedId(newItem.id);
    };

    const removeItem = (e, id) => {
        e.stopPropagation();
        onChange(section, data.filter((item, idx) => (item.id || idx) !== id));
        if (expandedId === id) setExpandedId(null);
    };

    const updateItem = (id, field, value) => {
        onChange(section, data.map((item, idx) => {
            const itemId = item.id || idx;
            return itemId === id ? { ...item, [field]: value } : item;
        }));
    };

    const handleArrayAction = (itemId, field, action, index, value) => {
        onChange(section, data.map((item, idx) => {
            const currentId = item.id || idx;
            if (currentId !== itemId) return item;

            const currentArray = [...(item[field] || [])];
            if (action === 'add') {
                currentArray.push('');
            } else if (action === 'remove') {
                currentArray.splice(index, 1);
            } else if (action === 'update') {
                currentArray[index] = value;
            }
            return { ...item, [field]: currentArray };
        }));
    };

    const toggleExpand = (id) => {
        // If trying to collapse, validate first
        if (expandedId === id) {
            const item = data.find((item, idx) => (item.id || idx) === id);
            const emptyFields = validateItem(item);

            if (emptyFields.length > 0) {
                showToast.error(`Please fill in required fields: ${emptyFields.join(', ')}`);
                return; // Don't collapse if validation fails
            }
        }
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <div className="section-form">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3>{title}</h3>
                <button
                    className="btn-primary"
                    onClick={addItem}
                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <Plus size={16} />
                    Add {title.slice(0, -1)}
                </button>
            </div>

            <div className="accordion-container">
                {data.map((item, idx) => {
                    const itemId = item.id || idx;
                    const isExpanded = expandedId === itemId;
                    const mainField = Object.keys(itemTemplate)[0];
                    const subField = Object.keys(itemTemplate)[1];

                    return (
                        <div
                            key={itemId}
                            className={`accordion-item card ${isExpanded ? 'expanded' : ''}`}
                            style={{ marginBottom: '0.75rem', overflow: 'hidden' }}
                        >
                            <div
                                className="accordion-header"
                                onClick={() => toggleExpand(itemId)}
                                style={{
                                    padding: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    background: isExpanded ? 'var(--bg-card-hover)' : 'var(--bg-card)'
                                }}
                            >
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '600', fontSize: '0.925rem' }}>
                                        {item[mainField] || `Untitled ${title.slice(0, -1)}`}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        {String(item[subField] || 'Click to edit details')}
                                    </div>
                                </div>
                                <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <button
                                        className="btn-secondary"
                                        onClick={(e) => removeItem(e, itemId)}
                                        style={{
                                            padding: '0.375rem 0.75rem',
                                            fontSize: '0.75rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.375rem',
                                            background: 'var(--bg-card)',
                                            border: '1px solid var(--border)',
                                            color: 'var(--text-muted)'
                                        }}
                                    >
                                        <Trash2 size={14} />
                                        Remove
                                    </button>
                                    <span style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease', display: 'flex' }}>
                                        <ChevronDown size={18} />
                                    </span>
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="accordion-content" style={{ padding: '1.25rem', borderTop: '1px solid var(--border)' }}>
                                    {Object.keys(itemTemplate).map((field) => (
                                        field !== 'id' && (
                                            <div className="form-group" key={field}>
                                                <label style={{ textTransform: 'capitalize' }}>
                                                    {field.replace(/_/g, ' ')}
                                                    {isMandatoryField(field) && <span style={{ color: '#ef4444', marginLeft: '0.25rem' }}>*</span>}
                                                </label>
                                                {Array.isArray(itemTemplate[field]) ? (
                                                    <div className="bullet-input-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                        {(item[field] || []).map((bullet, bIdx) => (
                                                            <div key={bIdx} style={{ display: 'flex', gap: '0.5rem' }}>
                                                                <input
                                                                    type="text"
                                                                    className="form-input"
                                                                    value={bullet}
                                                                    onChange={(e) => handleArrayAction(itemId, field, 'update', bIdx, e.target.value)}
                                                                    placeholder={getPlaceholder(field, section)}
                                                                    style={{ flex: 1 }}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    className="btn-text"
                                                                    onClick={() => handleArrayAction(itemId, field, 'remove', bIdx)}
                                                                    style={{
                                                                        padding: '0.25rem',
                                                                        color: 'var(--text-muted)',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        transition: 'color 0.2s',
                                                                        marginLeft: '0.25rem'
                                                                    }}
                                                                    onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
                                                                    onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                                                                    title="Remove Bullet"
                                                                >
                                                                    <XCircle size={18} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                        <button
                                                            className="btn-secondary"
                                                            onClick={() => handleArrayAction(itemId, field, 'add')}
                                                            style={{ alignSelf: 'flex-start', fontSize: '0.75rem', padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}
                                                        >
                                                            <Plus size={14} />
                                                            Add Bullet
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        value={item[field] || ''}
                                                        onChange={(e) => updateItem(itemId, field, e.target.value)}
                                                        placeholder={getPlaceholder(field, section)}
                                                    />
                                                )}
                                            </div>
                                        )
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            {data.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', border: '2px dashed var(--border)', borderRadius: 'var(--radius)', color: 'var(--text-muted)' }}>
                    <p>No {title.toLowerCase()} added yet.</p>
                    <button className="btn-primary" onClick={addItem} style={{ marginTop: '1rem' }}>
                        Add your first {title.slice(0, -1)}
                    </button>
                </div>
            )}
        </div>
    );
};

export default ListSectionForm;
