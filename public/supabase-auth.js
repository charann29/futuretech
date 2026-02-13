// Supabase Authentication Client
// This file handles all authentication logic for the FutureTech platform

// Initialize Supabase client
const SUPABASE_URL = 'https://gsqpobjgxrkeyxfqlakb.supabaseClient.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzcXBvYmpneHJrZXl4ZnFsYWtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxODI4ODQsImV4cCI6MjA4NTc1ODg4NH0.0UtSEilS2wb-NjbLgbVqmD0ULkGCddL98Ko_8GEhX8w';

// Create Supabase client (using CDN) - use window.supabaseClient to avoid conflicts
if (!window.supabaseClient) {
    window.supabaseClient = window.supabaseClient.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
const supabaseClient = window.supabaseClient;

// Auth State Manager
class AuthManager {
    constructor() {
        this.user = null;
        this.session = null;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        try {
            // Get current session
            const { data: { session }, error } = await supabaseClient.auth.getSession();

            if (error) {
                console.error('Error getting session:', error);
                return;
            }

            this.session = session;
            this.user = session?.user || null;
            this.initialized = true;

            // Listen for auth changes
            supabaseClient.auth.onAuthStateChange((event, session) => {
                console.log('Auth state changed:', event);
                this.session = session;
                this.user = session?.user || null;
                this.onAuthStateChange(event, session);
            });

            return this.user;
        } catch (error) {
            console.error('Auth initialization error:', error);
            return null;
        }
    }

    onAuthStateChange(event, session) {
        // Update UI based on auth state
        this.updateAuthUI();

        // Handle specific events
        if (event === 'SIGNED_IN') {
            console.log('User signed in:', session.user.email);
            this.onSignIn(session.user);
        } else if (event === 'SIGNED_OUT') {
            console.log('User signed out');
            this.onSignOut();
        }
    }

    updateAuthUI() {
        const authButtons = document.getElementById('authButtons');
        const userProfile = document.getElementById('userProfile');

        if (!authButtons || !userProfile) return;

        if (this.user) {
            // User is logged in
            authButtons.style.display = 'none';
            userProfile.style.display = 'flex';

            const userName = document.getElementById('userName');
            const userAvatar = document.getElementById('userAvatar');

            if (userName) {
                userName.textContent = this.user.user_metadata?.full_name ||
                                      this.user.email?.split('@')[0] ||
                                      'User';
            }

            if (userAvatar && this.user.user_metadata?.avatar_url) {
                userAvatar.src = this.user.user_metadata.avatar_url;
            }
        } else {
            // User is logged out
            authButtons.style.display = 'flex';
            userProfile.style.display = 'none';
        }
    }

    async onSignIn(user) {
        // Store user data in localStorage for quick access
        localStorage.setItem('futuretech_user', JSON.stringify({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.email?.split('@')[0],
            avatar: user.user_metadata?.avatar_url
        }));

        // Save lead data to backend/database
        try {
            const session = await supabaseClient.auth.getSession();
            const token = session?.data?.session?.access_token;

            if (token) {
                await fetch('/api/save-lead', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        source: 'google_signin'
                    })
                });
            }
        } catch (error) {
            console.error('Error saving lead:', error);
        }

        // Show success message
        this.showNotification('Welcome back! You are now signed in.', 'success');
    }

    onSignOut() {
        // Clear localStorage
        localStorage.removeItem('futuretech_user');

        // Show message
        this.showNotification('You have been signed out.', 'info');

        // Redirect to home if on protected page
        const protectedPages = ['test.html', 'resume.html'];
        const currentPage = window.location.pathname.split('/').pop();

        if (protectedPages.includes(currentPage)) {
            window.location.href = 'index.html';
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `auth-notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            z-index: 10000;
            font-weight: 600;
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    async signInWithGoogle() {
        try {
            const { data, error } = await supabaseClient.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/index.html`,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    }
                }
            });

            if (error) throw error;

            // OAuth will redirect, no need to do anything here
            console.log('Redirecting to Google sign-in...');
        } catch (error) {
            console.error('Sign in error:', error);
            this.showNotification('Failed to sign in. Please try again.', 'error');
        }
    }

    async signOut() {
        try {
            const { error } = await supabaseClient.auth.signOut();

            if (error) throw error;

            console.log('Signed out successfully');
        } catch (error) {
            console.error('Sign out error:', error);
            this.showNotification('Failed to sign out. Please try again.', 'error');
        }
    }

    isAuthenticated() {
        return !!this.user;
    }

    getUser() {
        return this.user;
    }

    getSession() {
        return this.session;
    }

    async requireAuth(redirectUrl = 'index.html') {
        if (!this.initialized) {
            await this.initialize();
        }

        if (!this.isAuthenticated()) {
            this.showNotification('Please sign in to access this page.', 'info');
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 2000);
            return false;
        }

        return true;
    }
}

// Create global auth manager instance
const authManager = new AuthManager();

// Initialize auth when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        authManager.initialize();
    });
} else {
    authManager.initialize();
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Export for use in other scripts
window.authManager = authManager;
window.supabase = supabaseClient;
