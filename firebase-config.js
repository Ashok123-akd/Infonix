// Firebase configuration for Studymate Platform - Updated to v10.7.1
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

// Initialize Firebase with latest version
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

// Enhanced Firebase Authentication Class
class FirebaseAuth {
    constructor() {
        this.auth = firebase.auth();
        this.db = db;
        this.setupAuthListeners();
    }

    setupAuthListeners() {
        // Listen for auth state changes
        this.auth.onAuthStateChanged((user) => {
            if (user) {
                console.log('User is signed in:', user.email);
                this.handleUserSignIn(user);
            } else {
                console.log('User is signed out');
                // Clear user data from localStorage when signed out
                localStorage.removeItem('studymate_user');
                localStorage.removeItem('currentUser');
            }
        });
    }

    async handleUserSignIn(user) {
        try {
            console.log('User signed in successfully:', user.email);
            
            // Create comprehensive user data
            const userData = {
                email: user.email,
                name: user.displayName || user.email,
                firstName: user.displayName ? user.displayName.split(' ')[0] : '',
                lastName: user.displayName ? user.displayName.split(' ').slice(1).join(' ') : '',
                displayName: user.displayName || '',
                photoURL: user.photoURL || '',
                avatar: user.photoURL || 'https://via.placeholder.com/120',
                uid: user.uid,
                provider: user.providerData[0]?.providerId || 'email',
                emailVerified: user.emailVerified,
                lastSignInTime: user.metadata.lastSignInTime,
                creationTime: user.metadata.creationTime
            };
            
            // Store user data in localStorage
            localStorage.setItem('studymate_user', JSON.stringify(userData));
            localStorage.setItem('currentUser', JSON.stringify(userData));
            
            // Check if user exists in database
            const userDoc = await this.db.collection('users').doc(user.email).get();
            
            if (!userDoc.exists) {
                console.log('Creating new user in database...');
                await this.createUserInDatabase(user);
            } else {
                console.log('Updating existing user last login...');
                await this.updateUserLastLogin(user.email);
            }
            
            // Don't redirect automatically - let the login page handle it
            console.log('User data processed successfully');
        } catch (error) {
            console.error('Error handling user sign in:', error);
            this.showAlert('Error processing login. Please try again.', 'error');
        }
    }

    async createUserInDatabase(user) {
        try {
            const userData = {
                email: user.email,
                firstName: user.displayName ? user.displayName.split(' ')[0] : '',
                lastName: user.displayName ? user.displayName.split(' ').slice(1).join(' ') : '',
                displayName: user.displayName || '',
                photoURL: user.photoURL || '',
                provider: user.providerData[0]?.providerId || 'email',
                uid: user.uid,
                emailVerified: user.emailVerified,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                isActive: true,
                settings: {
                    notifications: true,
                    privacy: 'public',
                    theme: 'light'
                },
                profile: {
                    bio: '',
                    location: '',
                    university: '',
                    field: '',
                    year: '',
                    interests: []
                }
            };

            await this.db.collection('users').doc(user.email).set(userData);
            console.log('New user created in database:', user.email);
        } catch (error) {
            console.error('Error creating user in database:', error);
            throw error;
        }
    }

    async updateUserLastLogin(email) {
        try {
            await this.db.collection('users').doc(email).update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                isActive: true
            });
            console.log('User last login updated:', email);
        } catch (error) {
            console.error('Error updating user last login:', error);
        }
    }

    async signInWithEmail(email, password) {
        try {
            const result = await this.auth.signInWithEmailAndPassword(email, password);
            return { success: true, user: result.user };
        } catch (error) {
            console.error('Email sign in error:', error);
            return { success: false, error: this.getErrorMessage(error.code) };
        }
    }

    async signInWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            
            // Add scopes for better user experience
            provider.addScope('email');
            provider.addScope('profile');
            provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
            
            // Set custom parameters
            provider.setCustomParameters({
                prompt: 'select_account'
            });
            
            const result = await this.auth.signInWithPopup(provider);
            return { success: true, user: result.user };
        } catch (error) {
            console.error('Google sign in error:', error);
            return { success: false, error: this.getErrorMessage(error.code) };
        }
    }

    async signOut() {
        try {
            await this.auth.signOut();
            console.log('User signed out successfully');
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
    }

    async resetPassword(email) {
        try {
            await this.auth.sendPasswordResetEmail(email);
            return { success: true, message: 'Password reset email sent successfully' };
        } catch (error) {
            console.error('Password reset error:', error);
            return { success: false, error: this.getErrorMessage(error.code) };
        }
    }

    getErrorMessage(errorCode) {
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
        
        return errorMessages[errorCode] || 'An error occurred during sign-in. Please try again.';
    }

    showAlert(message, type = 'error') {
        const alertContainer = document.getElementById('alertContainer');
        if (!alertContainer) return;
        
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        
        alertContainer.innerHTML = '';
        alertContainer.appendChild(alert);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }

    // Get current user
    getCurrentUser() {
        return this.auth.currentUser;
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.auth.currentUser;
    }
}

// Firebase Database Functions
class FirebaseDB {
    constructor() {
        this.db = db;
        this.auth = firebase.auth();
    }

    // User Management
    async createUser(userData) {
        try {
            const userRef = this.db.collection('users').doc(userData.email);
            await userRef.set({
                ...userData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true, user: userData };
        } catch (error) {
            console.error('Error creating user:', error);
            return { success: false, error: error.message };
        }
    }

    async updateUser(email, userData) {
        try {
            const userRef = this.db.collection('users').doc(email);
            await userRef.update({
                ...userData,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            console.error('Error updating user:', error);
            return { success: false, error: error.message };
        }
    }

    async getUser(email) {
        try {
            const userRef = this.db.collection('users').doc(email);
            const doc = await userRef.get();
            if (doc.exists) {
                return { success: true, user: doc.data() };
            } else {
                return { success: false, error: 'User not found' };
            }
        } catch (error) {
            console.error('Error getting user:', error);
            return { success: false, error: error.message };
        }
    }

    async searchUsers(query) {
        try {
            const usersRef = this.db.collection('users');
            const snapshot = await usersRef
                .where('firstName', '>=', query)
                .where('firstName', '<=', query + '\uf8ff')
                .get();
            
            const users = [];
            snapshot.forEach(doc => {
                users.push({ id: doc.id, ...doc.data() });
            });
            return { success: true, users };
        } catch (error) {
            console.error('Error searching users:', error);
            return { success: false, error: error.message, users: [] };
        }
    }

    // Messages Management
    async sendMessage(messageData) {
        try {
            const messageRef = this.db.collection('messages').doc();
            await messageRef.set({
                ...messageData,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                id: messageRef.id
            });
            return { success: true, messageId: messageRef.id };
        } catch (error) {
            console.error('Error sending message:', error);
            return { success: false, error: error.message };
        }
    }

    async getMessages(chatId, limit = 50) {
        try {
            const messagesRef = this.db.collection('messages')
                .where('chatId', '==', chatId)
                .orderBy('timestamp', 'desc')
                .limit(limit);
            
            const snapshot = await messagesRef.get();
            const messages = [];
            snapshot.forEach(doc => {
                messages.push({ id: doc.id, ...doc.data() });
            });
            return { success: true, messages: messages.reverse() };
        } catch (error) {
            console.error('Error getting messages:', error);
            return { success: false, error: error.message, messages: [] };
        }
    }

    // Chat Management
    async createChat(chatData) {
        try {
            const chatRef = this.db.collection('chats').doc();
            await chatRef.set({
                ...chatData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastMessage: null,
                participants: chatData.participants || []
            });
            return { success: true, chatId: chatRef.id };
        } catch (error) {
            console.error('Error creating chat:', error);
            return { success: false, error: error.message };
        }
    }

    async getChats(userEmail) {
        try {
            const chatsRef = this.db.collection('chats')
                .where('participants', 'array-contains', userEmail)
                .orderBy('lastMessage.timestamp', 'desc');
            
            const snapshot = await chatsRef.get();
            const chats = [];
            snapshot.forEach(doc => {
                chats.push({ id: doc.id, ...doc.data() });
            });
            return { success: true, chats };
        } catch (error) {
            console.error('Error getting chats:', error);
            return { success: false, error: error.message, chats: [] };
        }
    }

    // Study Groups Management
    async createStudyGroup(groupData) {
        try {
            const groupRef = this.db.collection('studyGroups').doc();
            await groupRef.set({
                ...groupData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                members: groupData.members || [],
                messages: []
            });
            return { success: true, groupId: groupRef.id };
        } catch (error) {
            console.error('Error creating study group:', error);
            return { success: false, error: error.message };
        }
    }

    async getStudyGroups(userEmail) {
        try {
            const groupsRef = this.db.collection('studyGroups')
                .where('members', 'array-contains', userEmail)
                .orderBy('createdAt', 'desc');
            
            const snapshot = await groupsRef.get();
            const groups = [];
            snapshot.forEach(doc => {
                groups.push({ id: doc.id, ...doc.data() });
            });
            return { success: true, groups };
        } catch (error) {
            console.error('Error getting study groups:', error);
            return { success: false, error: error.message, groups: [] };
        }
    }

    // Events Management
    async createEvent(eventData) {
        try {
            const eventRef = this.db.collection('events').doc();
            await eventRef.set({
                ...eventData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                attendees: eventData.attendees || [],
                createdBy: eventData.createdBy
            });
            return { success: true, eventId: eventRef.id };
        } catch (error) {
            console.error('Error creating event:', error);
            return { success: false, error: error.message };
        }
    }

    async getEvents() {
        try {
            const eventsRef = this.db.collection('events')
                .orderBy('date', 'asc')
                .where('date', '>=', new Date());
            
            const snapshot = await eventsRef.get();
            const events = [];
            snapshot.forEach(doc => {
                events.push({ id: doc.id, ...doc.data() });
            });
            return { success: true, events };
        } catch (error) {
            console.error('Error getting events:', error);
            return { success: false, error: error.message, events: [] };
        }
    }

    // Resources Management
    async createResource(resourceData) {
        try {
            const resourceRef = this.db.collection('resources').doc();
            await resourceRef.set({
                ...resourceData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                downloads: 0,
                createdBy: resourceData.createdBy
            });
            return { success: true, resourceId: resourceRef.id };
        } catch (error) {
            console.error('Error creating resource:', error);
            return { success: false, error: error.message };
        }
    }

    async getResources() {
        try {
            const resourcesRef = this.db.collection('resources')
                .orderBy('createdAt', 'desc');
            
            const snapshot = await resourcesRef.get();
            const resources = [];
            snapshot.forEach(doc => {
                resources.push({ id: doc.id, ...doc.data() });
            });
            return { success: true, resources };
        } catch (error) {
            console.error('Error getting resources:', error);
            return { success: false, error: error.message, resources: [] };
        }
    }

    // Real-time Listeners
    listenToMessages(chatId, callback) {
        return this.db.collection('messages')
            .where('chatId', '==', chatId)
            .orderBy('timestamp', 'asc')
            .onSnapshot(snapshot => {
                const messages = [];
                snapshot.forEach(doc => {
                    messages.push({ id: doc.id, ...doc.data() });
                });
                callback(messages);
            });
    }

    listenToUserStatus(userEmail, callback) {
        return this.db.collection('users')
            .doc(userEmail)
            .onSnapshot(doc => {
                if (doc.exists) {
                    callback(doc.data());
                }
            });
    }

    // Settings Management
    async saveUserSettings(email, settings) {
        try {
            const userRef = this.db.collection('users').doc(email);
            await userRef.update({
                settings: settings,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            console.error('Error saving settings:', error);
            return { success: false, error: error.message };
        }
    }

    async getUserSettings(email) {
        try {
            const userRef = this.db.collection('users').doc(email);
            const doc = await userRef.get();
            if (doc.exists) {
                return { success: true, settings: doc.data().settings || {} };
            } else {
                return { success: false, error: 'User not found' };
            }
        } catch (error) {
            console.error('Error getting settings:', error);
            return { success: false, error: error.message };
        }
    }

    // Friend Management
    async sendFriendRequest(fromEmail, toEmail) {
        try {
            const requestData = {
                fromEmail: fromEmail,
                toEmail: toEmail,
                status: 'pending',
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                id: `${fromEmail}_${toEmail}_${Date.now()}`
            };
            
            await this.db.collection('friendRequests').doc(requestData.id).set(requestData);
            return { success: true, message: 'Friend request sent successfully' };
        } catch (error) {
            console.error('Error sending friend request:', error);
            return { success: false, error: error.message };
        }
    }

    async acceptFriendRequest(requestId) {
        try {
            const requestRef = this.db.collection('friendRequests').doc(requestId);
            const requestDoc = await requestRef.get();
            
            if (!requestDoc.exists) {
                return { success: false, error: 'Friend request not found' };
            }
            
            const requestData = requestDoc.data();
            
            // Add both users to each other's friends list
            await this.db.collection('users').doc(requestData.fromEmail).update({
                friends: firebase.firestore.FieldValue.arrayUnion(requestData.toEmail)
            });
            
            await this.db.collection('users').doc(requestData.toEmail).update({
                friends: firebase.firestore.FieldValue.arrayUnion(requestData.fromEmail)
            });
            
            // Delete the friend request
            await requestRef.delete();
            
            return { success: true, message: 'Friend request accepted' };
        } catch (error) {
            console.error('Error accepting friend request:', error);
            return { success: false, error: error.message };
        }
    }

    async rejectFriendRequest(requestId) {
        try {
            await this.db.collection('friendRequests').doc(requestId).delete();
            return { success: true, message: 'Friend request rejected' };
        } catch (error) {
            console.error('Error rejecting friend request:', error);
            return { success: false, error: error.message };
        }
    }

    async getFriendRequests(email) {
        try {
            const snapshot = await this.db.collection('friendRequests')
                .where('toEmail', '==', email)
                .where('status', '==', 'pending')
                .orderBy('timestamp', 'desc')
                .get();
            
            const requests = [];
            snapshot.forEach(doc => {
                requests.push({ id: doc.id, ...doc.data() });
            });
            
            return { success: true, requests: requests };
        } catch (error) {
            console.error('Error getting friend requests:', error);
            return { success: false, error: error.message };
        }
    }

    async getFriends(email) {
        try {
            const userDoc = await this.db.collection('users').doc(email).get();
            
            if (!userDoc.exists) {
                return { success: false, error: 'User not found' };
            }
            
            const userData = userDoc.data();
            const friends = userData.friends || [];
            
            // Get friend details
            const friendDetails = [];
            for (const friendEmail of friends) {
                const friendDoc = await this.db.collection('users').doc(friendEmail).get();
                if (friendDoc.exists) {
                    friendDetails.push(friendDoc.data());
                }
            }
            
            return { success: true, friends: friendDetails };
        } catch (error) {
            console.error('Error getting friends:', error);
            return { success: false, error: error.message };
        }
    }

    async getFriendSuggestions(email) {
        try {
            const userDoc = await this.db.collection('users').doc(email).get();
            
            if (!userDoc.exists) {
                return { success: false, error: 'User not found' };
            }
            
            const userData = userDoc.data();
            const currentFriends = userData.friends || [];
            const currentField = userData.field || '';
            
            // Get users with similar fields who are not already friends
            let query = this.db.collection('users')
                .where('email', '!=', email);
            
            if (currentField) {
                query = query.where('field', '==', currentField);
            }
            
            const snapshot = await query.limit(10).get();
            
            const suggestions = [];
            snapshot.forEach(doc => {
                const userData = doc.data();
                if (!currentFriends.includes(userData.email)) {
                    suggestions.push(userData);
                }
            });
            
            return { success: true, suggestions: suggestions };
        } catch (error) {
            console.error('Error getting friend suggestions:', error);
            return { success: false, error: error.message };
        }
    }

    // User Search
    async searchUsers(query, currentUserEmail) {
        try {
            const snapshot = await this.db.collection('users')
                .where('email', '!=', currentUserEmail)
                .get();
            
            const users = [];
            snapshot.forEach(doc => {
                const userData = doc.data();
                if (userData.email.toLowerCase().includes(query.toLowerCase()) ||
                    userData.firstName.toLowerCase().includes(query.toLowerCase()) ||
                    userData.lastName.toLowerCase().includes(query.toLowerCase()) ||
                    (userData.field && userData.field.toLowerCase().includes(query.toLowerCase()))) {
                    users.push(userData);
                }
            });
            
            return { success: true, users: users };
        } catch (error) {
            console.error('Error searching users:', error);
            return { success: false, error: error.message };
        }
    }

    // Posts Management
    async createPost(postData) {
        try {
            const postRef = this.db.collection('posts').doc();
            await postRef.set({
                ...postData,
                id: postRef.id,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                likes: postData.likes || 0,
                comments: postData.comments || [],
                likedBy: postData.likedBy || []
            });
            return { success: true, postId: postRef.id };
        } catch (error) {
            console.error('Error creating post:', error);
            return { success: false, error: error.message };
        }
    }

    async getPosts(limit = 50) {
        try {
            const postsRef = this.db.collection('posts')
                .orderBy('createdAt', 'desc')
                .limit(limit);
            
            const snapshot = await postsRef.get();
            const posts = [];
            snapshot.forEach(doc => {
                posts.push({ id: doc.id, ...doc.data() });
            });
            return { success: true, posts };
        } catch (error) {
            console.error('Error getting posts:', error);
            return { success: false, error: error.message, posts: [] };
        }
    }

    async updatePost(postId, postData) {
        try {
            const postRef = this.db.collection('posts').doc(postId);
            await postRef.update({
                ...postData,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            console.error('Error updating post:', error);
            return { success: false, error: error.message };
        }
    }

    async deletePost(postId) {
        try {
            await this.db.collection('posts').doc(postId).delete();
            return { success: true };
        } catch (error) {
            console.error('Error deleting post:', error);
            return { success: false, error: error.message };
        }
    }

    async likePost(postId, userEmail) {
        try {
            const postRef = this.db.collection('posts').doc(postId);
            const postDoc = await postRef.get();
            
            if (!postDoc.exists) {
                return { success: false, error: 'Post not found' };
            }
            
            const postData = postDoc.data();
            const likedBy = postData.likedBy || [];
            const userLikedIndex = likedBy.indexOf(userEmail);
            
            if (userLikedIndex === -1) {
                // Like the post
                likedBy.push(userEmail);
                await postRef.update({
                    likes: firebase.firestore.FieldValue.increment(1),
                    likedBy: likedBy
                });
            } else {
                // Unlike the post
                likedBy.splice(userLikedIndex, 1);
                await postRef.update({
                    likes: firebase.firestore.FieldValue.increment(-1),
                    likedBy: likedBy
                });
            }
            
            return { success: true };
        } catch (error) {
            console.error('Error liking post:', error);
            return { success: false, error: error.message };
        }
    }

    async addComment(postId, commentData) {
        try {
            const postRef = this.db.collection('posts').doc(postId);
            await postRef.update({
                comments: firebase.firestore.FieldValue.arrayUnion({
                    ...commentData,
                    id: Date.now().toString(),
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                })
            });
            return { success: true };
        } catch (error) {
            console.error('Error adding comment:', error);
            return { success: false, error: error.message };
        }
    }

    // Enhanced User Management
    async updateUserProfile(email, profileData) {
        try {
            const userRef = this.db.collection('users').doc(email);
            await userRef.update({
                ...profileData,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            console.error('Error updating user profile:', error);
            return { success: false, error: error.message };
        }
    }

    async getUserProfile(email) {
        try {
            const userRef = this.db.collection('users').doc(email);
            const doc = await userRef.get();
            if (doc.exists) {
                return { success: true, profile: doc.data() };
            } else {
                return { success: false, error: 'User not found' };
            }
        } catch (error) {
            console.error('Error getting user profile:', error);
            return { success: false, error: error.message };
        }
    }

    async getAllUsers() {
        try {
            const usersRef = this.db.collection('users')
                .where('isActive', '==', true)
                .orderBy('lastLogin', 'desc');
            
            const snapshot = await usersRef.get();
            const users = [];
            snapshot.forEach(doc => {
                users.push({ id: doc.id, ...doc.data() });
            });
            return { success: true, users };
        } catch (error) {
            console.error('Error getting all users:', error);
            return { success: false, error: error.message, users: [] };
        }
    }

    // Enhanced Event Management
    async getEventsByDate(startDate, endDate) {
        try {
            const eventsRef = this.db.collection('events')
                .where('date', '>=', startDate)
                .where('date', '<=', endDate)
                .orderBy('date', 'asc');
            
            const snapshot = await eventsRef.get();
            const events = [];
            snapshot.forEach(doc => {
                events.push({ id: doc.id, ...doc.data() });
            });
            return { success: true, events };
        } catch (error) {
            console.error('Error getting events by date:', error);
            return { success: false, error: error.message, events: [] };
        }
    }

    async joinEvent(eventId, userEmail) {
        try {
            const eventRef = this.db.collection('events').doc(eventId);
            await eventRef.update({
                attendees: firebase.firestore.FieldValue.arrayUnion(userEmail)
            });
            return { success: true };
        } catch (error) {
            console.error('Error joining event:', error);
            return { success: false, error: error.message };
        }
    }

    async leaveEvent(eventId, userEmail) {
        try {
            const eventRef = this.db.collection('events').doc(eventId);
            await eventRef.update({
                attendees: firebase.firestore.FieldValue.arrayRemove(userEmail)
            });
            return { success: true };
        } catch (error) {
            console.error('Error leaving event:', error);
            return { success: false, error: error.message };
        }
    }

    // Real-time Listeners for Posts
    listenToPosts(callback) {
        return this.db.collection('posts')
            .orderBy('createdAt', 'desc')
            .limit(20)
            .onSnapshot(snapshot => {
                const posts = [];
                snapshot.forEach(doc => {
                    posts.push({ id: doc.id, ...doc.data() });
                });
                callback(posts);
            });
    }

    // Real-time Listeners for Events
    listenToEvents(callback) {
        return this.db.collection('events')
            .where('date', '>=', new Date().toISOString().split('T')[0])
            .orderBy('date', 'asc')
            .onSnapshot(snapshot => {
                const events = [];
                snapshot.forEach(doc => {
                    events.push({ id: doc.id, ...doc.data() });
                });
                callback(events);
            });
    }

    // Enhanced Search with Multiple Fields
    async searchUsersAdvanced(query, currentUserEmail) {
        try {
            const snapshot = await this.db.collection('users')
                .where('email', '!=', currentUserEmail)
                .where('isActive', '==', true)
                .get();
            
            const users = [];
            const searchTerms = query.toLowerCase().split(' ');
            
            snapshot.forEach(doc => {
                const userData = doc.data();
                const searchableText = [
                    userData.firstName || '',
                    userData.lastName || '',
                    userData.email || '',
                    userData.field || '',
                    userData.university || '',
                    userData.location || ''
                ].join(' ').toLowerCase();
                
                // Check if all search terms are found in the searchable text
                const matches = searchTerms.every(term => searchableText.includes(term));
                
                if (matches) {
                    users.push(userData);
                }
            });
            
            return { success: true, users: users.slice(0, 20) }; // Limit results
        } catch (error) {
            console.error('Error in advanced user search:', error);
            return { success: false, error: error.message, users: [] };
        }
    }
}

// Initialize Firebase Database
const firebaseDB = new FirebaseDB();

// Export for use in other files
window.firebaseDB = firebaseDB;
