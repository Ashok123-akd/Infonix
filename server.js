const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
// Serve organized public assets first
app.use(express.static('public'));
// Backward-compat for existing root assets (e.g., logo.jpg)
app.use(express.static('.'));

// In-memory data storage (replace with database in production)
let users = [
    {
        id: 1,
        name: 'Demo User',
        email: 'demo@studymate.com',
        password: 'password123',
        avatar: 'https://via.placeholder.com/40'
    }
];

// Persist users to disk so search works across restarts
const USERS_FILE = path.join(__dirname, 'users.json');

function loadUsersFromDisk() {
    try {
        if (fs.existsSync(USERS_FILE)) {
            const data = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
            if (Array.isArray(data)) {
                const byEmail = new Map();
                for (const u of data) {
                    if (u && u.email) byEmail.set(u.email.toLowerCase(), u);
                }
                for (const u of users) {
                    const key = (u.email || '').toLowerCase();
                    if (!byEmail.has(key)) byEmail.set(key, u);
                }
                users = Array.from(byEmail.values());
            }
        }
    } catch (e) {
        console.warn('Failed to load users.json:', e.message);
    }
}

function saveUsersToDisk() {
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(users.map(u => ({
            id: u.id,
            uid: u.uid,
            name: u.name,
            email: u.email,
            avatar: u.avatar
        })), null, 2));
    } catch (e) {
        console.warn('Failed to save users.json:', e.message);
    }
}

loadUsersFromDisk();

let events = [
    {
        id: 1,
        title: 'Advanced Physics Workshop',
        description: 'Deep dive into quantum mechanics and relativity',
        date: '2024-12-15',
        time: '14:00',
        location: 'Science Lab 3',
        attendees: 24,
        category: 'physics'
    },
    {
        id: 2,
        title: 'Chemistry Study Group',
        description: 'Organic chemistry review session',
        date: '2024-12-18',
        time: '16:00',
        location: 'Library Room 2',
        attendees: 18,
        category: 'chemistry'
    },
    {
        id: 3,
        title: 'Math Competition Prep',
        description: 'Practice problems and strategies',
        date: '2024-12-20',
        time: '13:00',
        location: 'Math Center',
        attendees: 32,
        category: 'mathematics'
    }
];

let resources = [
    {
        id: 1,
        title: 'Advanced Calculus Notes',
        description: 'Comprehensive notes covering integration techniques',
        category: 'mathematics',
        author: 'Prof. Smith',
        downloads: 156,
        type: 'pdf'
    },
    {
        id: 2,
        title: 'Biology Lab Report Template',
        description: 'Standard format for laboratory reports',
        category: 'biology',
        author: 'Dr. Johnson',
        downloads: 89,
        type: 'doc'
    },
    {
        id: 3,
        title: 'Physics Diagrams Collection',
        description: 'Visual aids for mechanics and thermodynamics',
        category: 'physics',
        author: 'Prof. Davis',
        downloads: 203,
        type: 'image'
    }
];

let studyGroups = [
    {
        id: 1,
        name: 'Physics Study Group',
        description: 'Advanced physics concepts and problem solving',
        members: 24,
        category: 'physics',
        messages: 12,
        resources: 3
    },
    {
        id: 2,
        name: 'Chemistry Lab Partners',
        description: 'Collaborative lab work and research',
        members: 8,
        category: 'chemistry',
        messages: 5,
        resources: 1
    },
    {
        id: 3,
        name: 'Math Competition Team',
        description: 'Competition preparation and practice',
        members: 6,
        category: 'mathematics',
        messages: 8,
        resources: 2
    }
];

// Public users API (no passwords)
app.get('/api/users', (req, res) => {
    const q = (req.query.q || '').toString().toLowerCase();
    const safeUsers = users.map(({ password, ...u }) => u);
    if (!q) return res.json(safeUsers);
    const filtered = safeUsers.filter(u =>
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q))
    );
    res.json(filtered);
});

// Upsert a user (for Firebase/SSO) so they appear in search
app.post('/api/user-sync', (req, res) => {
    const { email, firstName, lastName, avatar } = req.body;
    
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }
    
    // Check if user already exists
    const existingUserIndex = users.findIndex(user => user.email === email);
    
    if (existingUserIndex !== -1) {
        // Update existing user
        users[existingUserIndex] = {
            ...users[existingUserIndex],
            firstName: firstName || users[existingUserIndex].firstName,
            lastName: lastName || users[existingUserIndex].lastName,
            avatar: avatar || users[existingUserIndex].avatar,
            lastUpdated: new Date().toISOString()
        };
    } else {
        // Add new user
        users.push({
            id: Date.now().toString(),
            email,
            firstName: firstName || 'User',
            lastName: lastName || '',
            avatar: avatar || 'https://via.placeholder.com/40',
            password: '', // No password for Firebase users
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        });
    }
    
    saveUsersToDisk();
    res.json({ success: true, message: 'User synced successfully' });
});

// Bulk upsert users
app.post('/api/users/bulk', (req, res) => {
    const list = Array.isArray(req.body) ? req.body : [];
    let added = 0;
    for (const item of list) {
        if (!item || (!item.email && !item.uid)) continue;
        const keyEmail = (item.email || '').toLowerCase();
        let user = null;
        if (keyEmail) user = users.find(u => (u.email || '').toLowerCase() === keyEmail);
        if (!user && item.uid) user = users.find(u => u.uid === item.uid);
        if (user) {
            user.uid = item.uid || user.uid;
            user.name = item.name || user.name || 'User';
            user.email = item.email || user.email;
            user.avatar = item.avatar || user.avatar || 'https://via.placeholder.com/40';
        } else {
            users.push({
                id: users.length + 1,
                uid: item.uid,
                name: item.name || 'User',
                email: item.email,
                avatar: item.avatar || 'https://via.placeholder.com/40'
            });
            added++;
        }
    }
    saveUsersToDisk();
    res.json({ success: true, added, total: users.length });
});

// Authentication middleware
const authenticateUser = (req, res, next) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        req.user = user;
        next();
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
};

// Routes

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Authentication routes
app.post('/api/login', authenticateUser, (req, res) => {
    const { password, ...userWithoutPassword } = req.user;
    res.json({ 
        success: true, 
        user: userWithoutPassword,
        message: 'Login successful'
    });
});

app.post('/api/signup', (req, res) => {
    const { name, email, password } = req.body;
    
    // Check if user already exists
    if (users.find(u => u.email === email)) {
        return res.status(400).json({ error: 'User already exists' });
    }
    
    // Create new user
    const newUser = {
        id: users.length + 1,
        name,
        email,
        password,
        avatar: 'https://via.placeholder.com/40'
    };
    
    users.push(newUser);
    saveUsersToDisk();
    
    const { password: _, ...userWithoutPassword } = newUser;
    res.json({ 
        success: true, 
        user: userWithoutPassword,
        message: 'Account created successfully'
    });
});

// Profile update endpoint
app.put('/api/profile', (req, res) => {
    const { email, profileData } = req.body;
    
    if (!email || !profileData) {
        return res.status(400).json({ error: 'Email and profile data are required' });
    }
    
    const userIndex = users.findIndex(user => user.email === email);
    
    if (userIndex === -1) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    // Update user profile
    users[userIndex] = {
        ...users[userIndex],
        ...profileData,
        lastUpdated: new Date().toISOString()
    };
    
    saveUsersToDisk();
    res.json({ success: true, message: 'Profile updated successfully', user: users[userIndex] });
});

// Settings endpoints
app.post('/api/settings/privacy', (req, res) => {
    const { email, privacySettings } = req.body;
    
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }
    
    // In a real app, you'd save this to a database
    // For now, we'll just acknowledge the request
    res.json({ success: true, message: 'Privacy settings saved' });
});

app.post('/api/settings/accessibility', (req, res) => {
    const { email, accessibilitySettings } = req.body;
    
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }
    
    // In a real app, you'd save this to a database
    res.json({ success: true, message: 'Accessibility settings saved' });
});

app.post('/api/settings/notifications', (req, res) => {
    const { email, notificationSettings } = req.body;
    
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }
    
    // In a real app, you'd save this to a database
    res.json({ success: true, message: 'Notification settings saved' });
});

// Password change endpoint
app.post('/api/change-password', (req, res) => {
    const { email, currentPassword, newPassword } = req.body;
    
    if (!email || !currentPassword || !newPassword) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    
    const userIndex = users.findIndex(user => user.email === email);
    
    if (userIndex === -1) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    // In a real app, you'd verify the current password and hash the new one
    // For now, we'll just acknowledge the request
    res.json({ success: true, message: 'Password changed successfully' });
});

// Get user profile endpoint
app.get('/api/profile/:email', (req, res) => {
    const { email } = req.params;
    
    const user = users.find(user => user.email === email);
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    // Return user data without password
    const { password, ...userProfile } = user;
    res.json(userProfile);
});

// Events routes
app.get('/api/events', (req, res) => {
    res.json(events);
});

app.post('/api/events', (req, res) => {
    const newEvent = {
        id: events.length + 1,
        ...req.body,
        attendees: 0
    };
    events.push(newEvent);
    res.json({ success: true, event: newEvent });
});

app.post('/api/events/:id/join', (req, res) => {
    const eventId = parseInt(req.params.id);
    const event = events.find(e => e.id === eventId);
    
    if (event) {
        event.attendees += 1;
        res.json({ success: true, attendees: event.attendees });
    } else {
        res.status(404).json({ error: 'Event not found' });
    }
});

// Resources routes
app.get('/api/resources', (req, res) => {
    res.json(resources);
});

app.post('/api/resources', (req, res) => {
    const newResource = {
        id: resources.length + 1,
        ...req.body,
        downloads: 0
    };
    resources.push(newResource);
    res.json({ success: true, resource: newResource });
});

app.post('/api/resources/:id/download', (req, res) => {
    const resourceId = parseInt(req.params.id);
    const resource = resources.find(r => r.id === resourceId);
    
    if (resource) {
        resource.downloads += 1;
        res.json({ success: true, downloads: resource.downloads });
    } else {
        res.status(404).json({ error: 'Resource not found' });
    }
});

// Study groups routes
app.get('/api/groups', (req, res) => {
    res.json(studyGroups);
});

app.post('/api/groups', (req, res) => {
    const newGroup = {
        id: studyGroups.length + 1,
        ...req.body,
        members: 1,
        messages: 0,
        resources: 0
    };
    studyGroups.push(newGroup);
    res.json({ success: true, group: newGroup });
});

// Chat messages (simplified)
app.post('/api/chat', (req, res) => {
    const { message } = req.body;
    
    // Simple bot responses
    const responses = [
        'Great question! Let me help you with that.',
        'I can assist you with your studies.',
        'That\'s an interesting topic!',
        'Let me check the available resources for you.',
        'I\'ll help you find the information you need.'
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    res.json({
        success: true,
        response: randomResponse,
        timestamp: new Date().toISOString()
    });
});

// Statistics
app.get('/api/stats', (req, res) => {
    res.json({
        totalUsers: users.length,
        totalEvents: events.length,
        totalResources: resources.length,
        totalGroups: studyGroups.length,
        totalDownloads: resources.reduce((sum, r) => sum + r.downloads, 0),
        totalAttendees: events.reduce((sum, e) => sum + e.attendees, 0)
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Studymate server running on http://localhost:${PORT}`);
    console.log('Accessible on your LAN at http://<your-ip>:' + PORT);
    console.log('Demo credentials: demo@studymate.com / password123');
});
