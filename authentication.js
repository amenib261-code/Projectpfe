// Supabase Configuration
// IMPORTANT: Replace these with your actual Supabase project URL and anon key
// You can find these in your Supabase project dashboard under Settings > API
const SUPABASE_URL = 'https://lzlqxwwhjveyfhgopdph.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6bHF4d3doanZleWZoZ29wZHBoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1NjY5NTYsImV4cCI6MjA2NTE0Mjk1Nn0.VFzjDx1WSS03cM97vKHZAAR8vdheRtKC9wPBEoSQBxY';

// Initialize Supabase client
let supabaseClient;
let authInitialized = false;
let initializationAttempts = 0;
const MAX_INIT_ATTEMPTS = 5;

// Global loading state management
window.authLoading = {
    isRegistering: false,
    isLoggingIn: false,
    isResettingPassword: false
};

// Wait for Supabase to be loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Initializing Supabase...');
    initializeSupabase();
});

function initializeSupabase() {
    console.log('Checking if Supabase is available...');
    // Check if Supabase is available
    if (typeof window.supabase !== 'undefined') {
        console.log('Supabase is available, creating client...');
        try {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            initializeAuth();
        } catch (error) {
            console.error('Error creating Supabase client:', error);
            retryInitialization();
        }
    } else {
        console.log('Supabase not available yet, waiting 1 second...');
        retryInitialization();
    }
}

function retryInitialization() {
    if (initializationAttempts < MAX_INIT_ATTEMPTS) {
        initializationAttempts++;
        console.log(`Retrying initialization (attempt ${initializationAttempts}/${MAX_INIT_ATTEMPTS})...`);
        setTimeout(function() {
            if (typeof window.supabase !== 'undefined') {
                console.log('Supabase now available, creating client...');
                try {
                    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                    initializeAuth();
                } catch (error) {
                    console.error('Error creating Supabase client:', error);
                    retryInitialization();
                }
            } else {
                console.error('Supabase library not loaded after timeout');
                retryInitialization();
            }
        }, 2000); // Increased timeout to 2 seconds
    } else {
        console.error('Failed to initialize Supabase after maximum attempts');
        showGlobalError('Error loading authentication system. Please refresh the page and try again.');
    }
}

// Global error handler
function showGlobalError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f44336;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10001;
        font-family: 'Tajawal', sans-serif;
        max-width: 300px;
        animation: slideInRight 0.3s ease-out;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        if (document.body.contains(errorDiv)) {
            document.body.removeChild(errorDiv);
            document.head.removeChild(style);
        }
    }, 5000);
}

function initializeAuth() {
    console.log('Initializing authentication functions...');
    authInitialized = true;
    
    // Authentication Functions

    /**
     * Sign up a new user with enhanced UX (no email confirmation required)
     * @param {string} email - User's email
     * @param {string} password - User's password
     * @param {object} userData - Additional user data (fullname, phone, class, branch)
     * @returns {Promise<object>} - Sign up result
     */
    async function signUp(email, password, userData = {}) {
        if (window.authLoading.isRegistering) {
            return { success: false, error: 'Registration is already in progress, please wait...' };
        }
        
        window.authLoading.isRegistering = true;
        
        try {
            console.log('Attempting to sign up with email:', email);
            
            const { data, error } = await supabaseClient.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: userData.fullname,
                        phone: userData.phone,
                        user_class: userData.userClass,
                        user_branch: userData.userBranch
                    },
                    emailRedirectTo: window.location.origin + '/login.html'
                }
            });

            console.log('Sign up response:', { data, error });

            if (error) {
                throw error;
            }

            // Auto-confirm the user (no email confirmation needed)
            if (data.user) {
                console.log('Auto-confirming user:', data.user.email);
                
                // Update user to confirmed status
                const { error: updateError } = await supabaseClient.auth.updateUser({
                    data: { email_confirmed_at: new Date().toISOString() }
                });
                
                if (updateError) {
                    console.warn('Could not auto-confirm user:', updateError);
                }
            }

            return { 
                success: true, 
                data, 
                message: 'Account created successfully! You can now log in.',
                requiresEmailConfirmation: false,
                user: data.user
            };
        } catch (error) {
            console.error('Sign up error:', error);
            console.error('Error message:', error.message);
            console.error('Error code:', error.status);
            console.error('Full error object:', JSON.stringify(error, null, 2));
            
            // Enhanced error messages with better error detection
            let userFriendlyError = 'حدث خطأ أثناء إنشاء الحساب';
            let errorType = 'GENERAL_ERROR';
            
            // Check for specific error types
            if (error.message && error.message.includes('already registered')) {
                // Treat already registered as success - user can login directly
                return { 
                    success: true, 
                    error: 'ALREADY_REGISTERED',
                    message: 'You are already registered! You can log in directly.',
                    user: null,
                    redirectTo: 'user.html'
                };
            } else if (error.message && error.message.includes('User already registered')) {
                // Alternative "already registered" message
                return { 
                    success: true, 
                    error: 'ALREADY_REGISTERED',
                    message: 'You are already registered! You can log in directly.',
                    user: null,
                    redirectTo: 'user.html'
                };
            } else if (error.message && error.message.includes('Email signups are disabled')) {
                userFriendlyError = 'التسجيل معطل حالياً. يرجى التواصل مع إدارة الموقع لتفعيل التسجيل.';
                errorType = 'SIGNUPS_DISABLED';
            } else if (error.message && error.message.includes('Invalid email')) {
                userFriendlyError = 'Invalid email address. Please check your email address.';
                errorType = 'INVALID_EMAIL';
            } else if (error.message && error.message.includes('password')) {
                userFriendlyError = 'Password must be stronger. Please use at least 8 characters.';
                errorType = 'WEAK_PASSWORD';
            } else if (error.message && error.message.includes('network')) {
                userFriendlyError = 'Connection error. Please check your internet connection and try again.';
                errorType = 'NETWORK_ERROR';
            } else if (error.message && error.message.includes('Too many requests')) {
                userFriendlyError = 'Too many attempts. Please wait a moment and try again.';
                errorType = 'RATE_LIMIT';
            } else if (error.message && error.message.includes('400')) {
                userFriendlyError = 'Registration request error. Please check your data and try again.';
                errorType = 'BAD_REQUEST';
            } else if (error.message && error.message.includes('422')) {
                userFriendlyError = 'Invalid data. Please check all fields.';
                errorType = 'VALIDATION_ERROR';
            } else {
                // Log the actual error for debugging
                console.log('Unhandled signup error:', error.message);
                userFriendlyError = 'An unexpected error occurred during registration. Please try again.';
                errorType = 'UNKNOWN_ERROR';
            }
            
            return { 
                success: false, 
                error: errorType,
                message: userFriendlyError,
                details: error
            };
        } finally {
            window.authLoading.isRegistering = false;
        }
    }

    /**
     * Sign in an existing user with enhanced UX (no email confirmation required)
     * @param {string} email - User's email
     * @param {string} password - User's password
     * @returns {Promise<object>} - Sign in result
     */
    async function signIn(email, password) {
        if (window.authLoading.isLoggingIn) {
            return { success: false, error: 'Login is already in progress, please wait...' };
        }
        
        window.authLoading.isLoggingIn = true;
        
        try {
            console.log('Attempting to sign in with email:', email);
            
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

            console.log('Sign in response:', { data, error });

            if (error) {
                console.error('Supabase auth error:', error);
                
                // Handle specific error cases with better detail
                if (error.message && error.message.includes('Invalid login credentials')) {
                    return { 
                        success: false, 
                        error: 'INVALID_CREDENTIALS',
                        message: 'Email or password is incorrect. Please try again.'
                    };
                } else if (error.message && error.message.includes('400')) {
                    // Handle 400 Bad Request specifically
                    console.error('400 Bad Request details:', error);
                    return { 
                        success: false, 
                        error: 'BAD_REQUEST',
                        message: 'Login request error. Please check your data and try again.',
                        details: error
                    };
                }
                throw error;
            }

            console.log('Sign in successful:', data.user);
            return { 
                success: true, 
                data, 
                message: 'Logged in successfully!',
                user: data.user
            };
        } catch (error) {
            console.error('Sign in error:', error);
            
            // Enhanced error messages without email confirmation handling
            let userFriendlyError = 'An error occurred during login';
            let errorType = 'GENERAL_ERROR';
            
            if (error.message && error.message.includes('Invalid login credentials')) {
                userFriendlyError = 'Email or password is incorrect. Please try again.';
                errorType = 'INVALID_CREDENTIALS';
            } else if (error.message && error.message.includes('400')) {
                userFriendlyError = 'Login request error. Please check your data and try again.';
                errorType = 'BAD_REQUEST';
            } else if (error.message && error.message.includes('network')) {
                userFriendlyError = 'Connection error. Please check your internet connection and try again.';
                errorType = 'NETWORK_ERROR';
            } else if (error.message && error.message.includes('Too many requests')) {
                userFriendlyError = 'Too many attempts. Please wait a moment and try again.';
                errorType = 'RATE_LIMIT';
            } else if (error.message && error.message.includes('User not found')) {
                userFriendlyError = 'The email is not registered in the system. Please check your email address.';
                errorType = 'USER_NOT_FOUND';
            }
            
            return { 
                success: false, 
                error: errorType,
                message: userFriendlyError,
                details: error
            };
        } finally {
            window.authLoading.isLoggingIn = false;
        }
    }

    /**
     * Sign out the current user
     * @returns {Promise<object>} - Sign out result
     */
    async function signOut() {
        try {
            const { error } = await supabaseClient.auth.signOut();
            
            if (error) {
                throw error;
            }

            return { success: true, message: 'Logged out successfully!' };
        } catch (error) {
            console.error('Sign out error:', error);
            return { 
                success: false, 
                error: error.message || 'An error occurred during logout',
                details: error
            };
        }
    }

    /**
     * Reset password for a user with enhanced UX
     * @param {string} email - User's email
     * @returns {Promise<object>} - Password reset result
     */
    async function resetPassword(email) {
        if (window.authLoading.isResettingPassword) {
            return { success: false, error: 'The email is already being sent, please wait...' };
        }
        
        window.authLoading.isResettingPassword = true;
        
        try {
            const { data, error } = await supabaseClient.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/password-reset.html'
            });

            if (error) {
                throw error;
            }

            return { 
                success: true, 
                data, 
                message: 'A password reset link has been sent to your email!'
            };
        } catch (error) {
            console.error('Password reset error:', error);
            
            let userFriendlyError = 'An error occurred while sending the password reset link';
            
            if (error.message.includes('User not found')) {
                userFriendlyError = 'The email is not registered in the system. Please check your email address.';
            } else if (error.message.includes('network')) {
                userFriendlyError = 'Connection error. Please check your internet connection and try again.';
            }
            
            return { 
                success: false, 
                error: userFriendlyError,
                details: error
            };
        } finally {
            window.authLoading.isResettingPassword = false;
        }
    }

    /**
     * Get the current user session
     * @returns {Promise<object>} - Current session
     */
    async function getCurrentUser() {
        try {
            const { data: { user }, error } = await supabaseClient.auth.getUser();
            
            if (error) {
                throw error;
            }

            return { success: true, user };
        } catch (error) {
            console.error('Get current user error:', error);
            return { success: false, user: null, error };
        }
    }

    /**
     * Check if user is authenticated
     * @returns {Promise<boolean>} - Authentication status
     */
    async function isAuthenticated() {
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        return !error && session !== null;
    }

    /**
     * Update user profile
     * @param {object} updates - User data to update
     * @returns {Promise<object>} - Update result
     */
    async function updateProfile(updates) {
        try {
            const { data, error } = await supabaseClient.auth.updateUser({
                data: updates
            });

            if (error) {
                throw error;
            }

            return { success: true, data, message: 'Profile updated successfully!' };
        } catch (error) {
            console.error('Update profile error:', error);
            return { 
                success: false, 
                error: error.message || 'An error occurred while updating the profile',
                details: error
            };
        }
    }

    // Enhanced auth state listener with better UX
    supabaseClient.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event, session);
        
        if (event === 'SIGNED_IN') {
            // User signed in
            console.log('User signed in:', session.user);
            
            // Store user info in localStorage for seamless experience
            if (session.user) {
                localStorage.setItem('synta_user', JSON.stringify({
                    id: session.user.id,
                    email: session.user.email,
                    full_name: session.user.user_metadata?.full_name || '',
                    phone: session.user.user_metadata?.phone || '',
                    user_class: session.user.user_metadata?.user_class || '',
                    user_branch: session.user.user_metadata?.user_branch || ''
                }));
            }
            
        } else if (event === 'SIGNED_OUT') {
            // User signed out
            console.log('User signed out');
            
            // Clear user info from localStorage
            localStorage.removeItem('synta_user');
            
            // Redirect to login if on protected page
            const protectedPages = ['user.html', 'profile.html'];
            const currentPage = window.location.pathname.split('/').pop();
            if (protectedPages.includes(currentPage)) {
                window.location.href = '../index.html';
            }
        }
    });

    // Export functions for use in other files
    window.auth = {
        signUp,
        signIn,
        signOut,
        resetPassword,
        getCurrentUser,
        isAuthenticated,
        updateProfile,
        supabase: supabaseClient,
        isInitialized: () => authInitialized
    };
    
    console.log('Authentication system initialized and ready!', window.auth);
}
