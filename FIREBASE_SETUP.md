# Firebase Authentication Setup Guide

## Overview
This guide explains how to set up and use the updated Firebase authentication system for the Studymate platform. The system now uses Firebase SDK v10.7.1 with enhanced Google authentication support.

## Features
- ✅ Firebase SDK v10.7.1 (Latest)
- ✅ Google Authentication with enhanced scopes
- ✅ Email/Password Authentication
- ✅ Password Reset Functionality
- ✅ User Profile Management
- ✅ Real-time Authentication State
- ✅ Enhanced Error Handling
- ✅ User Data Storage in Firestore

## Firebase Configuration

### 1. Firebase Project Setup
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing project
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable "Email/Password"
   - Enable "Google" provider
   - Configure Google OAuth consent screen if needed

### 2. Enable Firestore Database
1. Go to Firestore Database
2. Create database in production mode
3. Set up security rules for user data

### 3. Update Configuration
The Firebase configuration is already set up in `firebase-config.js`:

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyCnkNJYw0lhFIAEWhXshkL7TIR7SlJRizA",
    authDomain: "studymate-816c4.firebaseapp.com",
    databaseURL: "https://studymate-816c4-default-rtdb.firebaseio.com",
    projectId: "studymate-816c4",
    storageBucket: "studymate-816c4.firebasestorage.app",
    messagingSenderId: "872461128696",
    appId: "1:872461128696:web:cc9cea5767fea429e6fc0d",
    measurementId: "G-XY9R2ZRTPH"
};
```

## Authentication Methods

### 1. Google Authentication
The enhanced Google authentication includes:
- Email and profile scopes
- Account selection prompt
- Enhanced error handling
- Automatic user profile creation

```javascript
// Usage in login.html and signup.html
const result = await firebaseAuth.signInWithGoogle();
if (result.success) {
    // User signed in successfully
    console.log('User:', result.user);
} else {
    // Handle error
    console.error('Error:', result.error);
}
```

### 2. Email/Password Authentication
Traditional email/password authentication with enhanced validation:

```javascript
// Sign in
const result = await firebaseAuth.signInWithEmail(email, password);

// Sign up
const result = await firebaseAuth.createUserWithEmailAndPassword(email, password);
```

### 3. Password Reset
Users can reset their password using their email:

```javascript
const result = await firebaseAuth.resetPassword(email);
```

## User Data Management

### 1. User Profile Structure
When a user signs in, their profile is automatically created/updated in Firestore:

```javascript
{
    email: "user@example.com",
    firstName: "John",
    lastName: "Doe",
    displayName: "John Doe",
    photoURL: "https://...",
    provider: "google.com",
    uid: "firebase-uid",
    emailVerified: true,
    createdAt: Timestamp,
    lastLogin: Timestamp,
    isActive: true,
    settings: {
        notifications: true,
        privacy: "public",
        theme: "light"
    },
    profile: {
        bio: "",
        location: "",
        university: "",
        field: "",
        year: "",
        interests: []
    }
}
```

### 2. Local Storage
User data is also stored in localStorage for quick access:
- `studymate_user`: Complete user profile
- `currentUser`: Current user session data

## Testing the Authentication

### 1. Test Page
Use `firebase-test.html` to test all authentication features:
- Google Sign-In
- Sign Out
- User Data Retrieval
- Database Connection

### 2. Manual Testing
1. Open `login.html` or `signup.html`
2. Try Google authentication
3. Try email/password authentication
4. Test password reset functionality
5. Verify user data is created in Firestore

## Error Handling

The system includes comprehensive error handling for common authentication issues:

```javascript
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
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/email-already-in-use': 'An account already exists with this email address.',
    'auth/invalid-credential': 'Invalid credentials. Please check your email and password.',
    'auth/requires-recent-login': 'This operation requires recent authentication. Please sign in again.'
};
```

## Security Considerations

### 1. Firebase Security Rules
Ensure your Firestore security rules are properly configured:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userEmail} {
      allow read, write: if request.auth != null && request.auth.token.email == userEmail;
    }
    
    // Public data can be read by authenticated users
    match /posts/{postId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.email == resource.data.createdBy;
    }
  }
}
```

### 2. Authentication State
Always check authentication state before accessing protected resources:

```javascript
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        console.log('User:', user.email);
    } else {
        // User is signed out
        console.log('No user signed in');
        // Redirect to login page
        window.location.href = 'login.html';
    }
});
```

## Troubleshooting

### Common Issues

1. **Google Sign-In Popup Blocked**
   - Ensure popups are allowed for your domain
   - Check browser settings
   - Try using redirect instead of popup

2. **Firebase Not Initialized**
   - Check if Firebase SDK is loaded correctly
   - Verify configuration object
   - Check browser console for errors

3. **Database Permission Denied**
   - Check Firestore security rules
   - Ensure user is authenticated
   - Verify user email matches document ID

4. **Authentication State Not Persisting**
   - Check localStorage for user data
   - Verify Firebase Auth state listener
   - Check for sign-out calls

### Debug Mode
Enable debug mode by adding this to your HTML:

```html
<script>
    // Enable Firebase debug mode
    firebase.auth().useDeviceLanguage();
    firebase.auth().settings.appVerificationDisabledForTesting = true; // Only for testing
</script>
```

## API Reference

### FirebaseAuth Class Methods

```javascript
// Initialize
const firebaseAuth = new FirebaseAuth();

// Authentication
await firebaseAuth.signInWithEmail(email, password);
await firebaseAuth.signInWithGoogle();
await firebaseAuth.signOut();
await firebaseAuth.resetPassword(email);

// User Management
const user = firebaseAuth.getCurrentUser();
const isAuth = firebaseAuth.isAuthenticated();

// Utilities
firebaseAuth.showAlert(message, type);
firebaseAuth.getErrorMessage(errorCode);
```

## Next Steps

1. **Customize User Profile**: Add more fields to user profile
2. **Add More Providers**: Implement Facebook, Twitter, or GitHub authentication
3. **Email Verification**: Add email verification flow
4. **Two-Factor Authentication**: Implement 2FA for enhanced security
5. **Social Login**: Add more social login providers

## Support

For issues or questions:
1. Check the browser console for errors
2. Use the test page (`firebase-test.html`) to debug
3. Review Firebase documentation
4. Check this setup guide for common solutions

---

**Last Updated**: December 2024
**Firebase Version**: 10.7.1
**Compatibility**: Modern browsers with ES6+ support
