

function isFirebaseReady() {
    return typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0;
}

function handleFirebaseRedirectResult() {
    if (!isFirebaseReady()) return;
    
    firebase.auth().getRedirectResult().then((result) => {
        if (result.user) {
            // User signed in via redirect
            const userData = {
                email: result.user.email,
                firstName: result.user.displayName?.split(' ')[0] || 'User',
                lastName: result.user.displayName?.split(' ').slice(1).join(' ') || '',
                displayName: result.user.displayName || '',
                photoURL: result.user.photoURL || '',
                avatar: result.user.photoURL || 'https://via.placeholder.com/120',
                uid: result.user.uid,
                provider: 'google',
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                isActive: true
            };
            
            // Store in localStorage immediately for fast access
            localStorage.setItem('studymate_user', JSON.stringify(userData));
            localStorage.setItem('currentUser', JSON.stringify(userData));
            
            // Save to Firebase database in background (non-blocking)
            saveUserToFirebaseBackground(userData);
            
            // Redirect to dashboard immediately
            window.location.href = 'dashboard.html';
        }
    }).catch((error) => {
        console.error('Redirect sign-in error:', error);
        showNotification(getErrorMessage(error.code), 'error');
    });
}

// Save user to Firebase database in background (non-blocking)
async function saveUserToFirebaseBackground(userData) {
    if (!isFirebaseReady() || !window.firebaseDB) {
        console.warn('Firebase not ready, skipping database save');
        return;
    }
    
    try {
        // Check if user already exists
        const existingUser = await window.firebaseDB.getUser(userData.email);
        
        if (!existingUser.success) {
            // Create new user
            const result = await window.firebaseDB.createUser(userData);
            if (result.success) {
                console.log('New user saved to Firebase database:', userData.email);
            } else {
                console.error('Failed to save new user to database:', result.error);
            }
        } else {
            // Update existing user's last login
            const updateResult = await window.firebaseDB.updateUser(userData.email, {
                lastLogin: new Date().toISOString(),
                isActive: true,
                photoURL: userData.photoURL || existingUser.user.photoURL,
                displayName: userData.displayName || existingUser.user.displayName
            });
            
            if (updateResult.success) {
                console.log('User last login updated:', userData.email);
            } else {
                console.error('Failed to update user last login:', updateResult.error);
            }
        }
    } catch (error) {
        console.error('Error saving user to Firebase:', error);
    }
}

// Get user-friendly error messages
function getErrorMessage(errorCode) {
    const errorMessages = {
        'auth/user-not-found': 'No account found with this email address.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/user-disabled': 'This account has been disabled.',
        'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
        'auth/popup-closed-by-user': 'Sign-in was cancelled.',
        'auth/popup-blocked': 'Sign-in popup was blocked. Please allow popups for this site.',
        'auth/cancelled-popup-request': 'Sign-in was cancelled.',
        'auth/network-request-failed': 'Network error. Please check your connection.',
        'auth/operation-not-allowed': 'Google sign-in is not enabled. Please contact support.',
        'auth/account-exists-with-different-credential': 'An account already exists with the same email address but different sign-in credentials.',
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/weak-password': 'Password is too weak. Please choose a stronger password.',
        'auth/invalid-credential': 'Invalid credentials. Please check your email and password.',
        'auth/user-token-expired': 'Your session has expired. Please sign in again.',
        'auth/requires-recent-login': 'This operation requires recent authentication. Please sign in again.'
    };
    
    return errorMessages[errorCode] || 'An error occurred during authentication. Please try again.';
}

// Fast login function - prioritizes speed
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        showNotification('Please fill in all fields.', 'error');
        return;
    }
    
    const loginBtn = document.querySelector('.auth-btn.primary');
    if (loginBtn) {
        const originalText = loginBtn.innerHTML;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
        loginBtn.disabled = true;
    }
    
    try {
        let userData = null;
        
        // Try demo credentials first (fastest)
        if (email === 'demo@studymate.com' && password === 'password123') {
            userData = {
                email: 'demo@studymate.com',
                firstName: 'Demo',
                lastName: 'User',
                displayName: 'Demo User',
                avatar: 'https://via.placeholder.com/120',
                photoURL: 'https://via.placeholder.com/120',
                provider: 'demo',
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                isActive: true
            };
        }
        // Try Firebase authentication
        else if (isFirebaseReady()) {
            try {
                const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
                const user = userCredential.user;
                
                // Create user data immediately without database calls
                userData = {
                    email: user.email,
                    firstName: user.displayName?.split(' ')[0] || 'User',
                    lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
                    displayName: user.displayName || '',
                    photoURL: user.photoURL || '',
                    avatar: user.photoURL || 'https://via.placeholder.com/120',
                    uid: user.uid,
                    provider: 'email',
                    lastLogin: new Date().toISOString(),
                    isActive: true
                };
                
                // Save to database in background
                saveUserToFirebaseBackground(userData);
                
            } catch (firebaseError) {
                console.log('Firebase login failed:', firebaseError);
                showNotification(getErrorMessage(firebaseError.code), 'error');
                return;
            }
        }
        // Fall back to local API
        else {
            userData = await tryLocalLogin(email, password);
        }
        
        if (userData) {
            // Ensure userData has the required 'name' field for dashboard
            if (!userData.name) {
                userData.name = userData.displayName || userData.firstName + ' ' + userData.lastName || userData.email;
            }
            
            // Store user data immediately
            localStorage.setItem('studymate_user', JSON.stringify(userData));
            localStorage.setItem('currentUser', JSON.stringify(userData));
            
            showNotification('Login successful!', 'success');
            
            // Redirect immediately
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 500); // Reduced delay for faster response
        } else {
            showNotification('Invalid email or password.', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Login failed. Please try again.', 'error');
    } finally {
        if (loginBtn) {
            loginBtn.innerHTML = originalText;
            loginBtn.disabled = false;
        }
    }
}

// Fast local API login
async function tryLocalLogin(email, password) {
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            return data.user;
        }
    } catch (error) {
        console.error('Local API login error:', error);
    }
    
    return null;
}

// Fast signup function
async function handleSignup(e) {
    e.preventDefault();
    
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const university = document.getElementById('university')?.value.trim() || '';
    const studyField = document.getElementById('studyField')?.value || '';
    const newsletter = document.getElementById('newsletter')?.checked || false;
    
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
        showNotification('Please fill in all required fields.', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('Passwords do not match.', 'error');
        return;
    }
    
    if (password.length < 8) {
        showNotification('Password must be at least 8 characters long.', 'error');
        return;
    }
    
    const signupBtn = document.querySelector('.auth-btn.primary');
    if (signupBtn) {
        const originalText = signupBtn.innerHTML;
        signupBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
        signupBtn.disabled = true;
    }
    
    try {
        let userData = null;
        
        // Try Firebase authentication first
        if (isFirebaseReady()) {
            try {
                const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;
                
                // Update user profile
                await user.updateProfile({
                    displayName: `${firstName} ${lastName}`
                });
                
                userData = {
                    email: user.email,
                    firstName: firstName,
                    lastName: lastName,
                    displayName: `${firstName} ${lastName}`,
                    avatar: 'https://via.placeholder.com/120',
                    photoURL: 'https://via.placeholder.com/120',
                    uid: user.uid,
                    provider: 'email',
                    university: university,
                    field: studyField,
                    newsletter: newsletter,
                    createdAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString(),
                    isActive: true,
                    settings: {
                        notifications: true,
                        privacy: 'public'
                    }
                };
                
                // Save to database in background
                saveUserToFirebaseBackground(userData);
                
            } catch (firebaseError) {
                console.log('Firebase signup failed:', firebaseError);
                showNotification(getErrorMessage(firebaseError.code), 'error');
                return;
            }
        } else {
            // Fall back to local API
            userData = await tryLocalSignup(firstName, lastName, email, password, university, studyField, newsletter);
        }
        
        if (userData) {
            // Store user data immediately
            localStorage.setItem('studymate_user', JSON.stringify(userData));
            localStorage.setItem('currentUser', JSON.stringify(userData));
            
            showNotification('Account created successfully!', 'success');
            
            // Redirect immediately
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 500); // Reduced delay
        } else {
            showNotification('Failed to create account. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Signup error:', error);
        showNotification('Signup failed. Please try again.', 'error');
    } finally {
        if (signupBtn) {
            signupBtn.innerHTML = originalText;
            signupBtn.disabled = false;
        }
    }
}

// Fast local API signup
async function tryLocalSignup(firstName, lastName, email, password, university, studyField, newsletter) {
    try {
        const response = await fetch('/api/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                firstName, 
                lastName, 
                email, 
                password, 
                university, 
                studyField, 
                newsletter 
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            return data.user;
        }
    } catch (error) {
        console.error('Local API signup error:', error);
    }
    
    return null;
}

// Fast Google sign-in
async function handleGoogleSignIn() {
    if (!isFirebaseReady()) {
        showNotification('Firebase not available. Please try email sign-in.', 'error');
        return;
    }
    
    const googleBtn = document.querySelector('.social-btn.google');
    if (googleBtn) {
        const originalText = googleBtn.innerHTML;
        googleBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
        googleBtn.disabled = true;
    }
    
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');
        
        // Use redirect for mobile devices, popup for desktop
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            await firebase.auth().signInWithRedirect(provider);
            // The redirect result will be handled by handleFirebaseRedirectResult()
        } else {
            const result = await firebase.auth().signInWithPopup(provider);
            const user = result.user;
            
            const userData = {
                email: user.email,
                firstName: user.displayName?.split(' ')[0] || 'User',
                lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
                displayName: user.displayName || '',
                photoURL: user.photoURL || '',
                avatar: user.photoURL || 'https://via.placeholder.com/120',
                uid: user.uid,
                provider: 'google',
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                isActive: true,
                settings: {
                    notifications: true,
                    privacy: 'public'
                }
            };
            
            // Store immediately
            localStorage.setItem('studymate_user', JSON.stringify(userData));
            localStorage.setItem('currentUser', JSON.stringify(userData));
            
            // Save to database in background
            saveUserToFirebaseBackground(userData);
            
            showNotification('Google sign-in successful!', 'success');
            
            // Redirect immediately
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 500);
        }
    } catch (error) {
        console.error('Google sign-in error:', error);
        showNotification(getErrorMessage(error.code), 'error');
    } finally {
        if (googleBtn) {
            googleBtn.innerHTML = originalText;
            googleBtn.disabled = false;
        }
    }
}

// Toggle password visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const toggle = input.nextElementSibling.nextElementSibling;
    
    if (input.type === 'password') {
        input.type = 'text';
        toggle.innerHTML = '🙈';
    } else {
        input.type = 'password';
        toggle.innerHTML = '👁️';
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">&times;</button>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#2563eb'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 3000;
        display: flex;
        align-items: center;
        gap: 1rem;
        max-width: 400px;
        animation: slideInRight 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    // Close button functionality
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
    });
    
    // Auto remove after 3 seconds (reduced from 5)
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

// Add CSS animation for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex: 1;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 1.2rem;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .notification-close:hover {
        opacity: 0.8;
    }
`;
document.head.appendChild(style);

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Handle Firebase redirect result
    handleFirebaseRedirectResult();
    
    // Add event listeners
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const googleBtn = document.querySelector('.social-btn.google');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
    
    if (googleBtn) {
        googleBtn.addEventListener('click', handleGoogleSignIn);
    }
    
    // Password toggle is handled by inline onclick handlers in HTML
});
