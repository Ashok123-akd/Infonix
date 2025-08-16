// API Client for Studymate Platform

class API {
    constructor(baseURL = '') {
        this.baseURL = baseURL;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Authentication
    async login(email, password) {
        return this.request('/api/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    }

    async signup(name, email, password) {
        return this.request('/api/signup', {
            method: 'POST',
            body: JSON.stringify({ name, email, password })
        });
    }

    // Events
    async getEvents() {
        return this.request('/api/events');
    }

    async createEvent(eventData) {
        return this.request('/api/events', {
            method: 'POST',
            body: JSON.stringify(eventData)
        });
    }

    async joinEvent(eventId) {
        return this.request(`/api/events/${eventId}/join`, {
            method: 'POST'
        });
    }

    // Resources
    async getResources() {
        return this.request('/api/resources');
    }

    async createResource(resourceData) {
        return this.request('/api/resources', {
            method: 'POST',
            body: JSON.stringify(resourceData)
        });
    }

    async downloadResource(resourceId) {
        return this.request(`/api/resources/${resourceId}/download`, {
            method: 'POST'
        });
    }

    // Study Groups
    async getGroups() {
        return this.request('/api/groups');
    }

    async createGroup(groupData) {
        return this.request('/api/groups', {
            method: 'POST',
            body: JSON.stringify(groupData)
        });
    }

    // Chat
    async sendMessage(message) {
        return this.request('/api/chat', {
            method: 'POST',
            body: JSON.stringify({ message })
        });
    }

    // Statistics
    async getStats() {
        return this.request('/api/stats');
    }
}

// Create global API instance
window.studymateAPI = new API();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
}
