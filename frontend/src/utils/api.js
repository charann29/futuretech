import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// AI Processing and PDF Generation stay on the local server
export const processResume = async (resumeData) => {
    try {
        const response = await fetch(`${API_URL}/process`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(resumeData),
        });
        if (!response.ok) throw new Error('Failed to process resume');
        return await response.json();
    } catch (error) {
        console.error('Error processing resume:', error);
        throw error;
    }
};

export const generateResumePDF = async (resumeData) => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('User not authenticated');

        // Ensure we have a valid resume ID
        if (!resumeData.id || resumeData.id === 'null') {
            throw new Error('Resume must be saved before generating PDF. Please wait for auto-save to complete.');
        }

        const payload = {
            resume: resumeData,
            user_id: session.user.id,
            resume_id: resumeData.id
        };

        const response = await fetch(`${API_URL}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to generate PDF');
            } else {
                throw new Error(`Server error (${response.status}): Failed to generate PDF`);
            }
        }

        const blob = await response.blob();

        // Trigger automatic download
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `resume_${resumeData.id}.pdf`;
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        return { message: 'PDF generated and download started' }; // contains gcs_path and download_url
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    }
};

// Resume Storage is now handled by Supabase
export const listResumes = async () => {
    const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .order('modified_at', { ascending: false });

    if (error) {
        console.error('Error listing resumes:', error);
        throw error;
    }
    return data;
};

export const getResume = async (id) => {
    const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error loading resume:', error);
        throw error;
    }
    // Supabase stores as 'resume_data' JSONB, we return that
    return { ...data.resume_data, id: data.id, name: data.name };
};

export const saveResume = async (resumeData) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('User not authenticated');

    const resumePayload = {
        user_id: session.user.id,
        name: resumeData.personal_info?.name || 'Untitled Resume',
        resume_data: resumeData, // Updated column name
        gcs_path: resumeData.gcs_path || null,
        modified_at: new Date().toISOString()
    };

    let result;
    if (resumeData.id && resumeData.id !== 'null') {
        const { data, error } = await supabase
            .from('resumes')
            .update(resumePayload)
            .eq('id', resumeData.id)
            .select()
            .single();

        if (error) throw error;
        result = data;
    } else {
        const { data, error } = await supabase
            .from('resumes')
            .insert([resumePayload])
            .select()
            .single();

        if (error) throw error;
        result = data;
    }

    return { ...result.resume_data, id: result.id, gcs_path: result.gcs_path };
};

export const deleteResume = async (id) => {
    const { error } = await supabase
        .from('resumes')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting resume:', error);
        throw error;
    }
    return { success: true };
};
