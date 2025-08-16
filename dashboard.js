// Simple and Reliable Dashboard Authentication System

// Global variables
let currentUser = null;
let authChecked = false;

// Simple authentication check function
function checkAuth() {
    console.log('Starting authentication check...');
    
    const loadingScreen = document.getElementById('loadingScreen');
    const authError = document.getElementById('authError');
    const mainContent = document.querySelector('body');
    
    // Show loading screen
    if (loadingScreen) {
        loadingScreen.style.display = 'flex';
    }
    
    // Simple timeout to prevent infinite loading
    setTimeout(() => {
        if (!authChecked) {
            console.log('Authentication check timeout - showing error');
            hideLoading();
            showAuthError('Authentication timeout. Please try again.');
        }
    }, 5000);
    
    // Check if Firebase is available
    if (typeof firebase === 'undefined') {
        console.error('Firebase is not loaded!');
        hideLoading();
        showAuthError('Firebase is not loaded. Please refresh the page.');
        return;
    }
    
    try {
        // Simple auth state check
        firebase.auth().onAuthStateChanged(function(user) {
            console.log('Auth state changed:', user ? 'User logged in' : 'User logged out');
            authChecked = true;
            
            if (user) {
                // User is signed in
                console.log('User is authenticated:', user.email);
                currentUser = user;
                hideLoading();
                showDashboard(user);
            } else {
                // User is not signed in
                console.log('User is not authenticated');
                hideLoading();
                showAuthError('You need to be logged in to access the dashboard.');
            }
        });
    } catch (error) {
        console.error('Error setting up auth listener:', error);
        authChecked = true;
        hideLoading();
        showAuthError('Failed to initialize authentication: ' + error.message);
    }
}

// Hide loading screen
function hideLoading() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
    }
}

// Show authentication error
function showAuthError(message) {
    const authError = document.getElementById('authError');
    const mainContent = document.querySelector('body');
    
    console.error('Auth Error:', message);
    
    // Show auth error
    if (authError) {
        const errorText = authError.querySelector('p');
        if (errorText) {
            errorText.textContent = message;
        }
        authError.style.display = 'block';
    }
    
    // Hide main content
    if (mainContent) {
        mainContent.style.visibility = 'hidden';
    }
}

// Show dashboard content
function showDashboard(user) {
    const authError = document.getElementById('authError');
    const mainContent = document.querySelector('body');
    
    // Hide auth error
    if (authError) {
        authError.style.display = 'none';
    }
    
    // Show main content
    if (mainContent) {
        mainContent.style.visibility = 'visible';
    }
    
    // Update user info
    updateUserInfo(user);
    
    // Initialize dashboard functionality
    initializeDashboard();
}

// Update user information in the UI
function updateUserInfo(user) {
    const userNameElement = document.getElementById('userName');
    const userAvatarElement = document.getElementById('userAvatar');
    const dashboardUserName = document.getElementById('dashboardUserName');
    
    if (userNameElement) {
        userNameElement.textContent = user.displayName || user.email.split('@')[0];
    }
    
    if (dashboardUserName) {
        dashboardUserName.textContent = user.displayName || user.email.split('@')[0];
    }
    
    if (userAvatarElement && user.photoURL) {
        userAvatarElement.src = user.photoURL;
    }
}

// Simple logout function
function logout() {
    console.log('Logging out...');
    
    if (typeof firebase !== 'undefined') {
        firebase.auth().signOut().then(() => {
            console.log('User signed out successfully');
            
            // Clear local storage
            localStorage.clear();
            
            // Redirect to login page
            window.location.href = 'login.html';
        }).catch((error) => {
            console.error('Error signing out:', error);
            // Still redirect to login page even if there's an error
            window.location.href = 'login.html';
        });
    } else {
        // If Firebase is not available, just redirect
        localStorage.clear();
        window.location.href = 'login.html';
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard DOM loaded');
    
    // Check authentication first
    checkAuth();
});

// Initialize Profile and Settings Management
function initializeProfileAndSettings() {
    // Load user data
    loadUserData();
    
    // Modal event listeners
    const editProfileBtn = document.getElementById('editProfile');
    const openSettingsBtn = document.getElementById('openSettings');
    
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', openProfileModal);
    }
    
    if (openSettingsBtn) {
        openSettingsBtn.addEventListener('click', openSettingsModal);
    }
    
    // Profile modal events
    const closeProfileModalBtn = document.getElementById('closeProfileModal');
    const cancelProfileBtn = document.getElementById('cancelProfile');
    const profileForm = document.getElementById('profileForm');
    const avatarInput = document.getElementById('avatarInput');
    
    if (closeProfileModalBtn) {
        closeProfileModalBtn.addEventListener('click', closeProfileModal);
    }
    
    if (cancelProfileBtn) {
        cancelProfileBtn.addEventListener('click', closeProfileModal);
    }
    
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileSubmit);
    }
    
    if (avatarInput) {
        avatarInput.addEventListener('change', handleAvatarUpload);
    }
    
    // Settings modal events
    const closeSettingsModalBtn = document.getElementById('closeSettingsModal');
    if (closeSettingsModalBtn) {
        closeSettingsModalBtn.addEventListener('click', closeSettingsModal);
    }
    
    // Settings tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', switchSettingsTab);
    });
    
    // Account settings
    const accountForm = document.getElementById('accountForm');
    if (accountForm) {
        accountForm.addEventListener('submit', handleAccountUpdate);
    }
    
    // Privacy settings
    const savePrivacyBtn = document.getElementById('savePrivacy');
    if (savePrivacyBtn) {
        savePrivacyBtn.addEventListener('click', savePrivacySettings);
    }
    
    // Notification settings
    const saveNotificationsBtn = document.getElementById('saveNotifications');
    if (saveNotificationsBtn) {
        saveNotificationsBtn.addEventListener('click', saveNotificationSettings);
    }
    
    // Accessibility settings
    const saveAccessibilityBtn = document.getElementById('saveAccessibility');
    if (saveAccessibilityBtn) {
        saveAccessibilityBtn.addEventListener('click', saveAccessibilitySettings);
    }
}

// Initialize Dashboard
function initializeDashboard() {
    console.log('Initializing dashboard...');
    
    // Initialize all dashboard components
    initializeProfileAndSettings();
    initializeMeet();
    initializeFileUpload();
    initializeEventHandlers();
    initializeUserSearch();
    initializeMobileMenu();
    initializePostSystem();
    initializeCalendar();
    initializeMobileEnhancements();
    initializeNetworkMonitoring();
    
    // Load sample data
    loadSampleData();
    
    console.log('Dashboard initialized successfully');
}

// Navigation functions
function navigateToPage(page) {
    console.log('Navigating to:', page);
    window.location.href = page;
}

function navigateToSection(page, section) {
    console.log('Navigating to section:', page, section);
    window.location.href = `${page}#${section}`;
}

function showSection(section) {
    console.log('Showing section:', section);
    // Implementation for showing different sections
}

// Enhanced Calendar Functions for 2025
let currentCalendarDate = new Date(2025, 0, 1); // Start with January 2025

function initializeCalendar() {
    console.log('Calendar system initialized for 2025');
    generateCalendar();
    loadEvents();
}

function generateCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    const calendarMonth = document.getElementById('calendarMonth');
    
    if (!calendarGrid || !calendarMonth) return;
    
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    // Update month display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    calendarMonth.textContent = `${monthNames[month]} ${year}`;
    
    // Clear previous calendar
    calendarGrid.innerHTML = '';
    
    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.textContent = day;
        calendarGrid.appendChild(dayHeader);
    });
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // Generate calendar days
    for (let i = 0; i < 42; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = currentDate.getDate();
        
        // Check if it's today
        const today = new Date();
        if (currentDate.toDateString() === today.toDateString()) {
            dayElement.classList.add('today');
        }
        
        // Check if it's current month
        if (currentDate.getMonth() !== month) {
            dayElement.classList.add('other-month');
        }
        
        // Check if it has events
        if (hasEventsOnDate(currentDate)) {
            dayElement.classList.add('has-event');
        }
        
        // Add click event
        dayElement.addEventListener('click', () => {
            showEventsForDate(currentDate);
        });
        
        calendarGrid.appendChild(dayElement);
    }
}

function previousMonth() {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    generateCalendar();
}

function nextMonth() {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    generateCalendar();
}

function hasEventsOnDate(date) {
    const events = JSON.parse(localStorage.getItem('userEvents') || '[]');
    const dateString = date.toISOString().split('T')[0];
    return events.some(event => event.date === dateString);
}

function showEventsForDate(date) {
    const events = JSON.parse(localStorage.getItem('userEvents') || '[]');
    const dateString = date.toISOString().split('T')[0];
    const dayEvents = events.filter(event => event.date === dateString);
    
    if (dayEvents.length > 0) {
        let eventList = dayEvents.map(event => `• ${event.title} (${event.time})`).join('\n');
        alert(`Events on ${date.toLocaleDateString()}:\n${eventList}`);
    } else {
        alert(`No events on ${date.toLocaleDateString()}`);
    }
}

function loadEvents() {
    // Load events from localStorage
    const events = JSON.parse(localStorage.getItem('userEvents') || '[]');
    displayEvents(events);
}

function displayEvents(events) {
    const eventsContainer = document.getElementById('upcomingEvents');
    if (!eventsContainer) return;
    
    if (events.length === 0) {
        eventsContainer.innerHTML = '<p>No upcoming events</p>';
        return;
    }
    
    const eventsList = events.slice(0, 5).map(event => `
        <div class="event-item">
            <div class="event-date">
                <span class="day">${new Date(event.date).getDate()}</span>
                <span class="month">${new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}</span>
            </div>
            <div class="event-details">
                <h4>${event.title}</h4>
                <p>${event.time} • ${event.location}</p>
            </div>
        </div>
    `).join('');
    
    eventsContainer.innerHTML = eventsList;
}

// Settings functions
function showTab(tabName) {
    const tabs = document.querySelectorAll('.tab-content');
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    tabs.forEach(tab => tab.classList.remove('active'));
    tabBtns.forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabName).classList.add('active');
    document.querySelector(`[onclick="showTab('${tabName}')"]`).classList.add('active');
}

function saveSettings() {
    // Save settings to localStorage
    const settings = {
        notifications: document.getElementById('emailNotifications').checked,
        privacy: document.getElementById('profileVisibility').value,
        theme: document.getElementById('themeSelect').value,
        fontSize: document.getElementById('fontSize').value,
        highContrast: document.getElementById('highContrast').checked
    };
    
    localStorage.setItem('userSettings', JSON.stringify(settings));
    alert('Settings saved successfully!');
}

// User search functions
function searchUsers() {
    const searchInput = document.getElementById('userSearchInput');
    const query = searchInput.value.trim();
    
    if (query.length < 2) {
        alert('Please enter at least 2 characters to search');
        return;
    }
    
    performUserSearch(query);
}

function performUserSearch(query) {
    const users = JSON.parse(localStorage.getItem('sampleUsers') || '[]');
    const results = users.filter(user => 
        user.name.toLowerCase().includes(query.toLowerCase()) ||
        user.email.toLowerCase().includes(query.toLowerCase()) ||
        user.field.toLowerCase().includes(query.toLowerCase())
    );
    
    displaySearchResults(results);
}

function displaySearchResults(results) {
    const resultsContainer = document.getElementById('searchResults');
    if (!resultsContainer) return;
    
    if (results.length === 0) {
        resultsContainer.innerHTML = '<p>No users found</p>';
        return;
    }
    
    const resultsList = results.map(user => `
        <div class="user-result" onclick="openUserProfile('${user.email}')">
            <img src="${user.avatar}" alt="${user.name}" class="user-avatar-small">
            <div class="user-info">
                <h4>${user.name}</h4>
                <p>${user.field} • ${user.university}</p>
            </div>
            <button onclick="sendFriendRequest('${user.email}'); event.stopPropagation();" class="btn-add-friend">
                <i class="fas fa-user-plus"></i>
            </button>
        </div>
    `).join('');
    
    resultsContainer.innerHTML = resultsList;
}

function openUserProfile(email) {
    const users = JSON.parse(localStorage.getItem('sampleUsers') || '[]');
    const user = users.find(u => u.email === email);
    
    if (user) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close" onclick="closeUserProfileModal()">&times;</span>
                <div class="user-profile">
                    <img src="${user.avatar}" alt="${user.name}" class="profile-avatar">
                    <h2>${user.name}</h2>
                    <p><strong>Field:</strong> ${user.field}</p>
                    <p><strong>University:</strong> ${user.university}</p>
                    <p><strong>Email:</strong> ${user.email}</p>
                    <button onclick="sendFriendRequest('${user.email}')" class="btn-primary">
                        <i class="fas fa-user-plus"></i> Add Friend
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
}

function closeUserProfileModal() {
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.remove();
    }
}

function sendFriendRequest(email) {
    const requests = JSON.parse(localStorage.getItem('friendRequests') || '[]');
    const newRequest = {
        fromEmail: currentUser ? currentUser.email : 'current@user.com',
        toEmail: email,
        status: 'pending',
        timestamp: new Date().toISOString()
    };
    
    requests.push(newRequest);
    localStorage.setItem('friendRequests', JSON.stringify(requests));
    alert('Friend request sent!');
}

// Friends functions
function showFriendsTab(tab) {
    const tabs = document.querySelectorAll('.friends-tab-content');
    const tabBtns = document.querySelectorAll('.friends-tab-btn');
    
    tabs.forEach(t => t.classList.remove('active'));
    tabBtns.forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tab).classList.add('active');
    document.querySelector(`[onclick="showFriendsTab('${tab}')"]`).classList.add('active');
    
    if (tab === 'friends') {
        loadFriends();
    } else if (tab === 'requests') {
        loadFriendRequests();
    } else if (tab === 'suggestions') {
        loadFriendSuggestions();
    }
}

function loadFriends() {
    const friends = JSON.parse(localStorage.getItem('userFriends') || '[]');
    const container = document.getElementById('friendsList');
    if (!container) return;
    
    if (friends.length === 0) {
        container.innerHTML = '<p>No friends yet</p>';
        return;
    }
    
    const friendsList = friends.map(friend => `
        <div class="friend-item">
            <img src="${friend.avatar}" alt="${friend.name}" class="friend-avatar">
            <div class="friend-info">
                <h4>${friend.name}</h4>
                <p>${friend.field}</p>
            </div>
            <div class="friend-actions">
                <button onclick="openMessageInterface('${friend.email}')" class="btn-message">
                    <i class="fas fa-comment"></i>
                </button>
                <button onclick="startCall('${friend.email}')" class="btn-call">
                    <i class="fas fa-phone"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = friendsList;
}

function loadFriendRequests() {
    const requests = JSON.parse(localStorage.getItem('friendRequests') || '[]');
    const container = document.getElementById('friendRequestsList');
    if (!container) return;
    
    if (requests.length === 0) {
        container.innerHTML = '<p>No friend requests</p>';
        return;
    }
    
    const requestsList = requests.map(request => `
        <div class="friend-request-item">
            <img src="https://via.placeholder.com/40" alt="User" class="friend-avatar">
            <div class="friend-info">
                <h4>${request.fromEmail}</h4>
                <p>Wants to be your friend</p>
            </div>
            <div class="friend-actions">
                <button onclick="acceptFriendRequest('${request.fromEmail}')" class="btn-accept">
                    <i class="fas fa-check"></i>
                </button>
                <button onclick="rejectFriendRequest('${request.fromEmail}')" class="btn-reject">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = requestsList;
}

function loadFriendSuggestions() {
    const suggestions = JSON.parse(localStorage.getItem('friendSuggestions') || '[]');
    const container = document.getElementById('friendSuggestionsList');
    if (!container) return;
    
    if (suggestions.length === 0) {
        container.innerHTML = '<p>No suggestions available</p>';
        return;
    }
    
    const suggestionsList = suggestions.map(suggestion => `
        <div class="friend-suggestion-item">
            <img src="${suggestion.avatar}" alt="${suggestion.name}" class="friend-avatar">
            <div class="friend-info">
                <h4>${suggestion.name}</h4>
                <p>${suggestion.field} • ${suggestion.university}</p>
            </div>
            <button onclick="sendFriendRequest('${suggestion.email}')" class="btn-add-friend">
                <i class="fas fa-user-plus"></i>
            </button>
        </div>
    `).join('');
    
    container.innerHTML = suggestionsList;
}

function acceptFriendRequest(email) {
    // Implementation for accepting friend request
    alert('Friend request accepted!');
}

function rejectFriendRequest(email) {
    // Implementation for rejecting friend request
    alert('Friend request rejected');
}

function openMessageInterface(email) {
    // Implementation for opening message interface
    alert('Opening message interface for ' + email);
}

function startCall(email) {
    // Implementation for starting call
    alert('Starting call with ' + email);
}

// Load sample data
function loadSampleData() {
    // Sample users
    const sampleUsers = [
        {
            name: 'John Doe',
            email: 'john@example.com',
            field: 'Computer Science',
            university: 'MIT',
            avatar: 'https://via.placeholder.com/40'
        },
        {
            name: 'Jane Smith',
            email: 'jane@example.com',
            field: 'Mathematics',
            university: 'Stanford',
            avatar: 'https://via.placeholder.com/40'
        },
        {
            name: 'Mike Johnson',
            email: 'mike@example.com',
            field: 'Physics',
            university: 'Harvard',
            avatar: 'https://via.placeholder.com/40'
        }
    ];
    
    // Sample friends
    const sampleFriends = [
        {
            name: 'Alice Brown',
            email: 'alice@example.com',
            field: 'Biology',
            avatar: 'https://via.placeholder.com/40'
        },
        {
            name: 'Bob Wilson',
            email: 'bob@example.com',
            field: 'Chemistry',
            avatar: 'https://via.placeholder.com/40'
        }
    ];
    
    // Sample friend requests
    const sampleRequests = [
        {
            fromEmail: 'charlie@example.com',
            status: 'pending',
            timestamp: new Date().toISOString()
        }
    ];
    
    // Sample friend suggestions
    const sampleSuggestions = [
        {
            name: 'David Lee',
            email: 'david@example.com',
            field: 'Engineering',
            university: 'UC Berkeley',
            avatar: 'https://via.placeholder.com/40'
        }
    ];
    
    // Store sample data
    localStorage.setItem('sampleUsers', JSON.stringify(sampleUsers));
    localStorage.setItem('userFriends', JSON.stringify(sampleFriends));
    localStorage.setItem('friendRequests', JSON.stringify(sampleRequests));
    localStorage.setItem('friendSuggestions', JSON.stringify(sampleSuggestions));
    
    // Sample events
    const sampleEvents = [
        {
            title: 'Study Group Meeting',
            date: '2025-01-15',
            time: '2:00 PM',
            location: 'Library Room 101'
        },
        {
            title: 'Project Deadline',
            date: '2025-01-20',
            time: '11:59 PM',
            location: 'Online'
        }
    ];
    
    localStorage.setItem('userEvents', JSON.stringify(sampleEvents));
}

// Placeholder functions for other dashboard features
function initializeMeet() { console.log('Meet initialized'); }
function initializeFileUpload() { console.log('File upload initialized'); }
function initializeEventHandlers() { console.log('Event handlers initialized'); }
function initializeUserSearch() { console.log('User search initialized'); }
function initializeMobileMenu() { console.log('Mobile menu initialized'); }
function initializePostSystem() { console.log('Post system initialized'); }
function initializeMobileEnhancements() { console.log('Mobile enhancements initialized'); }
function initializeNetworkMonitoring() { console.log('Network monitoring initialized'); }
function loadUserData() { console.log('User data loaded'); }
function openProfileModal() { console.log('Profile modal opened'); }
function closeProfileModal() { console.log('Profile modal closed'); }
function handleProfileSubmit() { console.log('Profile submitted'); }
function handleAvatarUpload() { console.log('Avatar uploaded'); }
function openSettingsModal() { console.log('Settings modal opened'); }
function closeSettingsModal() { console.log('Settings modal closed'); }
function switchSettingsTab() { console.log('Settings tab switched'); }
function handleAccountUpdate() { console.log('Account updated'); }
function savePrivacySettings() { console.log('Privacy settings saved'); }
function saveNotificationSettings() { console.log('Notification settings saved'); }
function saveAccessibilitySettings() { console.log('Accessibility settings saved'); }