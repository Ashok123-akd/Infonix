// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
}

function setTheme(theme) {
    document.body.className = `theme-${theme}`;
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    const themeIcon = document.querySelector('.theme-toggle i');
    if (themeIcon) {
        themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

// Navigation
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    
    if (mobileMenu && menuToggle) {
        mobileMenu.classList.toggle('active');
        menuToggle.classList.toggle('active');
    }
}

function toggleUserMenu() {
    const userDropdown = document.getElementById('userDropdown');
    if (userDropdown) {
        userDropdown.classList.toggle('active');
    }
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(event) {
    const userMenu = document.querySelector('.user-menu');
    const userDropdown = document.getElementById('userDropdown');
    
    if (userMenu && userDropdown && !userMenu.contains(event.target)) {
        userDropdown.classList.remove('active');
    }
    
    const mobileMenu = document.getElementById('mobileMenu');
    const menuToggle = document.querySelector('.mobile-menu-toggle');
    
    if (mobileMenu && menuToggle && 
        !mobileMenu.contains(event.target) && 
        !menuToggle.contains(event.target)) {
        mobileMenu.classList.remove('active');
        menuToggle.classList.remove('active');
    }
});

// Loading Overlay
function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('active');
    }
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

// Toast Notifications
function showToast(message, type = 'info', duration = 5000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'fa-check-circle' : 
                type === 'error' ? 'fa-exclamation-circle' : 
                type === 'warning' ? 'fa-exclamation-triangle' : 
                'fa-info-circle';
    
    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    // Auto remove
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'slideOut 0.3s ease-out forwards';
            setTimeout(() => {
                container.removeChild(toast);
            }, 300);
        }
    }, duration);
    
    // Click to dismiss
    toast.addEventListener('click', () => {
        if (toast.parentNode) {
            toast.style.animation = 'slideOut 0.3s ease-out forwards';
            setTimeout(() => {
                container.removeChild(toast);
            }, 300);
        }
    });
}

// API Helper Functions
async function makeRequest(url, options = {}) {
    showLoading();
    
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Request failed');
        }
        
        return data;
    } catch (error) {
        console.error('Request error:', error);
        showToast(error.message || 'An error occurred', 'error');
        throw error;
    } finally {
        hideLoading();
    }
}

// Form Handling
function handleFormSubmit(formId, endpoint, options = {}) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const data = {};
        
        formData.forEach((value, key) => {
            data[key] = value;
        });
        
        try {
            const result = await makeRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            if (result.success) {
                showToast(result.message || 'Success!', 'success');
                
                if (options.redirect) {
                    setTimeout(() => {
                        window.location.href = options.redirect;
                    }, 1000);
                }
                
                if (options.reset) {
                    form.reset();
                }
                
                if (options.callback) {
                    options.callback(result);
                }
            }
        } catch (error) {
            // Error already handled in makeRequest
        }
    });
}

// Authentication
function initAuth() {
    // Login form
    handleFormSubmit('loginForm', '/login', {
        redirect: '/dashboard'
    });
    
    // Register form
    handleFormSubmit('registerForm', '/register', {
        redirect: '/dashboard'
    });
}

// Note Management
async function purchaseNote(noteId) {
    try {
        const result = await makeRequest(`/purchase/${noteId}`, {
            method: 'POST'
        });
        
        if (result.success) {
            showToast(result.message, 'success');
            // Refresh page to update UI
            setTimeout(() => {
                location.reload();
            }, 1500);
        }
    } catch (error) {
        // Error already handled in makeRequest
    }
}

// Forum Functions
async function rateAnswer(answerId, type) {
    try {
        const result = await makeRequest(`/forum/rate/${answerId}`, {
            method: 'POST',
            body: JSON.stringify({ type })
        });
        
        if (result.success) {
            // Update rating display
            const ratingElement = document.querySelector(`[data-answer-id="${answerId}"] .rating`);
            if (ratingElement) {
                ratingElement.textContent = result.new_rating;
            }
            
            showToast('Rating updated!', 'success', 2000);
        }
    } catch (error) {
        // Error already handled in makeRequest
    }
}

async function postComment(targetType, targetId, content) {
    if (!content.trim()) {
        showToast('Comment cannot be empty', 'warning');
        return;
    }
    
    try {
        const result = await makeRequest('/forum/comment', {
            method: 'POST',
            body: JSON.stringify({
                target_type: targetType,
                target_id: targetId,
                content: content
            })
        });
        
        if (result.success) {
            showToast(result.message, 'success');
            // Refresh page to show new comment
            setTimeout(() => {
                location.reload();
            }, 1000);
        }
    } catch (error) {
        // Error already handled in makeRequest
    }
}

// Dashboard Stats
async function loadDashboardStats() {
    const statsContainer = document.getElementById('dashboardStats');
    if (!statsContainer) return;
    
    try {
        const stats = await makeRequest('/api/user-stats');
        updateStatsDisplay(stats);
    } catch (error) {
        console.error('Failed to load dashboard stats:', error);
    }
}

function updateStatsDisplay(stats) {
    const elements = {
        coins: document.getElementById('coinsCount'),
        downloads: document.getElementById('downloadsCount'),
        views: document.getElementById('viewsCount'),
        earnings: document.getElementById('earningsCount'),
        uploads: document.getElementById('uploadsCount')
    };
    
    Object.keys(elements).forEach(key => {
        if (elements[key] && stats[key] !== undefined) {
            animateNumber(elements[key], stats[key]);
        }
    });
}

function animateNumber(element, targetValue) {
    const startValue = parseInt(element.textContent) || 0;
    const duration = 1000;
    const step = (targetValue - startValue) / (duration / 16);
    let currentValue = startValue;
    
    const animate = () => {
        currentValue += step;
        
        if ((step > 0 && currentValue >= targetValue) || 
            (step < 0 && currentValue <= targetValue)) {
            element.textContent = targetValue;
        } else {
            element.textContent = Math.floor(currentValue);
            requestAnimationFrame(animate);
        }
    };
    
    animate();
}

// File Upload Preview
function initFileUpload() {
    const fileInput = document.getElementById('noteFile');
    const previewContainer = document.getElementById('filePreview');
    
    if (fileInput && previewContainer) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                previewContainer.innerHTML = `
                    <div class="file-preview">
                        <i class="fas fa-file-alt"></i>
                        <div class="file-info">
                            <div class="file-name">${file.name}</div>
                            <div class="file-size">${formatFileSize(file.size)}</div>
                        </div>
                    </div>
                `;
            }
        });
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Search and Filter
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const filterSelect = document.getElementById('filterSelect');
    
    if (searchInput) {
        let searchTimeout;
        
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                performSearch(e.target.value);
            }, 300);
        });
    }
    
    if (filterSelect) {
        filterSelect.addEventListener('change', (e) => {
            applyFilter(e.target.value);
        });
    }
}

function performSearch(query) {
    // Implement search functionality
    console.log('Searching for:', query);
}

function applyFilter(filter) {
    // Implement filter functionality
    console.log('Applying filter:', filter);
}

// Auto-dismiss flash messages
function initFlashMessages() {
    const flashMessages = document.querySelectorAll('[data-flash]');
    
    flashMessages.forEach(message => {
        setTimeout(() => {
            if (message.parentNode) {
                message.style.animation = 'slideOut 0.3s ease-out forwards';
                setTimeout(() => {
                    message.remove();
                }, 300);
            }
        }, 5000);
    });
}

// Smooth scrolling for anchor links
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Lazy loading for images
function initLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    observer.unobserve(img);
                }
            });
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initAuth();
    initFileUpload();
    initSearch();
    initFlashMessages();
    initSmoothScrolling();
    initLazyLoading();
    
    // Load dashboard stats if on dashboard page
    if (document.getElementById('dashboardStats')) {
        loadDashboardStats();
    }
});

// Global functions for inline event handlers
window.toggleTheme = toggleTheme;
window.toggleMobileMenu = toggleMobileMenu;
window.toggleUserMenu = toggleUserMenu;
window.purchaseNote = purchaseNote;
window.rateAnswer = rateAnswer;
window.postComment = postComment;