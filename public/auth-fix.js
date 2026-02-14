// FutureTech Authentication - Fixed Version
// This script initializes Supabase and AuthManager globally

(function () {
    'use strict';

    console.log('[Auth] Initializing authentication...');

    // Configuration
    const SUPABASE_URL = 'https://diacczkzcxylmlvysqar.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpYWNjemt6Y3h5bG1sdnlzcWFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2OTYyODQsImV4cCI6MjA4NjI3MjI4NH0.4e1ayR8Nu_laj0Ne6mSGVZTV6nLCmLHWs16ekN1n70E';

    // Wait for Supabase library to load
    if (typeof window.supabase === 'undefined') {
        console.error('[Auth] Supabase library not loaded! Make sure to include the CDN script first.');
        return;
    }

    // Create Supabase client
    try {
        window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('[Auth] Supabase client created');
    } catch (error) {
        console.error('[Auth] Failed to create Supabase client:', error);
        return;
    }

    // Auth Manager Class
    class AuthManager {
        constructor() {
            this.user = null;
            this.session = null;
            this.initialized = false;
            console.log('[AuthManager] Instance created');
        }

        async initialize() {
            if (this.initialized) {
                console.log('[AuthManager] Already initialized');
                return;
            }

            try {
                console.log('[AuthManager] Initializing...');
                const { data: { session }, error } = await window.supabase.auth.getSession();

                if (error) {
                    console.error('[AuthManager] Error getting session:', error);
                    return;
                }

                this.session = session;
                this.user = session?.user || null;
                this.initialized = true;

                console.log('[AuthManager] Initialized successfully. User:', this.user?.email || 'Not signed in');

                // Listen for auth changes
                window.supabase.auth.onAuthStateChange((event, session) => {
                    console.log('[AuthManager] Auth state changed:', event);
                    this.session = session;
                    this.user = session?.user || null;
                    this.onAuthStateChange(event, session);
                });

                return this.user;
            } catch (error) {
                console.error('[AuthManager] Initialization error:', error);
                return null;
            }
        }

        onAuthStateChange(event, session) {
            this.updateAuthUI();

            if (event === 'SIGNED_IN') {
                console.log('[AuthManager] User signed in:', session.user.email);
                this.onSignIn(session.user);
            } else if (event === 'SIGNED_OUT') {
                console.log('[AuthManager] User signed out');
                this.onSignOut();
            }
        }

        updateAuthUI() {
            const authButtons = document.getElementById('authButtons');
            const userProfile = document.getElementById('userProfile');

            if (!authButtons || !userProfile) return;

            if (this.user) {
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
                authButtons.style.display = 'flex';
                userProfile.style.display = 'none';
            }
        }

        async onSignIn(user) {
            localStorage.setItem('futuretech_user', JSON.stringify({
                id: user.id,
                email: user.email,
                name: user.user_metadata?.full_name || user.email?.split('@')[0],
                avatar: user.user_metadata?.avatar_url
            }));

            // Save lead data
            try {
                const session = await window.supabase.auth.getSession();
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
                console.error('[AuthManager] Error saving lead:', error);
            }

            this.showNotification('Welcome back! You are now signed in.', 'success');
        }

        onSignOut() {
            localStorage.removeItem('futuretech_user');
            this.showNotification('You have been signed out.', 'info');

            const protectedPages = ['test.html', 'resume.html'];
            const currentPage = window.location.pathname.split('/').pop();

            if (protectedPages.includes(currentPage)) {
                window.location.href = 'index.html';
            }
        }

        showNotification(message, type = 'info') {
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

            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease-out';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }

        async signInWithGoogle() {
            try {
                const redirectUrl = `${window.location.origin}/index.html`;
                console.log('[AuthManager] Starting Google sign-in...');
                console.log('[AuthManager] specific-google-auth-fix: Using redirect URL:', redirectUrl);

                const { data, error } = await window.supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo: redirectUrl,
                        queryParams: {
                            access_type: 'offline',
                            prompt: 'consent',
                        }
                    }
                });

                if (error) throw error;
                console.log('[AuthManager] Redirecting to Google sign-in...');
            } catch (error) {
                console.error('[AuthManager] Sign in error:', error);
                this.showNotification('Failed to sign in. Please try again.', 'error');
            }
        }

        async signOut() {
            try {
                console.log('[AuthManager] Signing out...');
                const { error } = await window.supabase.auth.signOut();
                if (error) throw error;
                console.log('[AuthManager] Signed out successfully');
            } catch (error) {
                console.error('[AuthManager] Sign out error:', error);
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

    // Create and export global auth manager
    window.authManager = new AuthManager();
    console.log('[Auth] AuthManager exported to window.authManager');

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('[Auth] DOM loaded, initializing auth...');
            window.authManager.initialize();
        });
    } else {
        console.log('[Auth] DOM already loaded, initializing auth...');
        window.authManager.initialize();
    }

    // Add animation styles
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

    console.log('[Auth] Setup complete');
})();
