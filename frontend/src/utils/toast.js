import toast from 'react-hot-toast';

/**
 * Toast utility wrapper for consistent styling across the app
 */

export const showToast = {
    success: (message) => {
        toast.success(message, {
            duration: 3000,
            style: {
                background: 'var(--bg-card)',
                color: 'var(--text-main)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '12px 16px',
            },
            iconTheme: {
                primary: 'var(--primary)',
                secondary: 'white',
            },
        });
    },

    error: (message) => {
        toast.error(message, {
            duration: 4000,
            style: {
                background: 'var(--bg-card)',
                color: 'var(--text-main)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '12px 16px',
            },
            iconTheme: {
                primary: '#ef4444',
                secondary: 'white',
            },
        });
    },

    info: (message) => {
        toast(message, {
            duration: 3000,
            icon: 'ℹ️',
            style: {
                background: 'var(--bg-card)',
                color: 'var(--text-main)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '12px 16px',
            },
        });
    },

    loading: (message) => {
        return toast.loading(message, {
            style: {
                background: 'var(--bg-card)',
                color: 'var(--text-main)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '12px 16px',
            },
        });
    },

    dismiss: (toastId) => {
        toast.dismiss(toastId);
    },
};
