// auth.js - Authentication and user management for BAKERIST

// User roles and permissions
const USER_ROLES = {
    CUSTOMER: 'customer',
    STAFF: 'staff', 
    ADMIN: 'admin'
};

// Permission levels
const PERMISSIONS = {
    [USER_ROLES.CUSTOMER]: ['view_products', 'place_orders', 'view_own_orders'],
    [USER_ROLES.STAFF]: ['view_products', 'view_orders', 'update_order_status', 'manage_inventory'],
    [USER_ROLES.ADMIN]: ['all']
};

/**
 * Simple hash function for demo purposes (not secure for production)
 */
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
}

/**
 * Get current date in ISO format
 */
function getCurrentISODate() {
    return new Date().toISOString();
}

/**
 * Validate email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate phone number (Philippines format)
 */
function isValidPhone(phone) {
    const phoneRegex = /^(\+63|0)[0-9]{10}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Check if user is logged in
 */
function isLoggedIn() {
    return sessionStorage.getItem('bakerist_session') !== null;
}

/**
 * Get current user from session
 */
function getCurrentUser() {
    const session = sessionStorage.getItem('bakerist_session');
    if (!session) return null;
    
    try {
        const sessionData = JSON.parse(session);
        const users = JSON.parse(localStorage.getItem('bakerist_users') || '[]');
        return users.find(user => user.id === sessionData.userId) || null;
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}

/**
 * Check if current user is admin
 */
function isAdmin() {
    const user = getCurrentUser();
    return user && user.role === 'admin';
}

/**
 * Check if user has specific permission
 */
function hasPermission(user, permission) {
    if (!user || !user.role) return false;
    
    if (user.role === USER_ROLES.ADMIN) return true;
    
    const userPermissions = PERMISSIONS[user.role] || [];
    return userPermissions.includes(permission) || userPermissions.includes('all');
}

/**
 * Update UI based on authentication state
 */
function updateAuthUI() {
    const user = getCurrentUser();
    const authElements = document.querySelectorAll('.auth-element');
    
    authElements.forEach(element => {
        if (user) {
            // User is logged in
            if (element.classList.contains('logged-out')) {
                element.style.display = 'none';
            }
            if (element.classList.contains('logged-in')) {
                element.style.display = 'block';
                // Update user info if element has user-specific class
                if (element.classList.contains('user-name')) {
                    element.textContent = user.name;
                }
            }
            // Show admin elements if user is admin
            if (isAdmin() && element.classList.contains('admin-only')) {
                element.style.display = 'block';
            } else if (element.classList.contains('admin-only')) {
                element.style.display = 'none';
            }
        } else {
            // User is logged out
            if (element.classList.contains('logged-in')) {
                element.style.display = 'none';
            }
            if (element.classList.contains('logged-out')) {
                element.style.display = 'block';
            }
            if (element.classList.contains('admin-only')) {
                element.style.display = 'none';
            }
        }
    });
}

/**
 * Register new user
 */
function registerUser(userData) {
    try {
        const users = JSON.parse(localStorage.getItem('bakerist_users') || '[]');
        
        // Check if email already exists
        if (users.find(user => user.email === userData.email)) {
            return { success: false, message: 'Email already registered' };
        }
        
        // Create new user
        const newUser = {
            id: 'user_' + Date.now(),
            name: userData.name,
            email: userData.email,
            passwordHash: simpleHash(userData.password),
            role: USER_ROLES.CUSTOMER, // Default role
            barangay: userData.barangay || '',
            sitio: userData.sitio || '',
            contact_no: userData.contact_no || '',
            created_at: getCurrentISODate(),
            is_active: true,
            preferences: {
                newsletter: userData.newsletter || false,
                sms_notifications: true
            }
        };
        
        users.push(newUser);
        localStorage.setItem('bakerist_users', JSON.stringify(users));
        
        // Auto-login after registration
        createSession(newUser);
        
        return { success: true, message: 'Registration successful!', user: newUser };
        
    } catch (error) {
        console.error('Registration error:', error);
        return { success: false, message: 'Registration failed. Please try again.' };
    }
}

/**
 * Login user
 */
function loginUser(email, password) {
    try {
        const users = JSON.parse(localStorage.getItem('bakerist_users') || '[]');
        const passwordHash = simpleHash(password);
        
        const user = users.find(u => 
            u.email === email && 
            u.passwordHash === passwordHash && 
            u.is_active !== false
        );
        
        if (user) {
            createSession(user);
            return { success: true, message: 'Login successful!', user: user };
        } else {
            return { success: false, message: 'Invalid email or password' };
        }
        
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: 'Login failed. Please try again.' };
    }
}

/**
 * Create user session
 */
function createSession(user) {
    const sessionData = {
        userId: user.id,
        email: user.email,
        role: user.role,
        loginTime: getCurrentISODate()
    };
    
    sessionStorage.setItem('bakerist_session', JSON.stringify(sessionData));
    updateAuthUI();
}

/**
 * Logout user
 */
function logout() {
    sessionStorage.removeItem('bakerist_session');
    updateAuthUI();
    window.location.href = 'index.html';
}

/**
 * Update user profile
 */
function updateUserProfile(userId, updates) {
    try {
        const users = JSON.parse(localStorage.getItem('bakerist_users') || '[]');
        const userIndex = users.findIndex(user => user.id === userId);
        
        if (userIndex === -1) {
            return { success: false, message: 'User not found' };
        }
        
        // Update user data
        users[userIndex] = {
            ...users[userIndex],
            ...updates,
            updated_at: getCurrentISODate()
        };
        
        localStorage.setItem('bakerist_users', JSON.stringify(users));
        
        // Update session if current user
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.id === userId) {
            createSession(users[userIndex]);
        }
        
        return { success: true, message: 'Profile updated successfully!' };
        
    } catch (error) {
        console.error('Profile update error:', error);
        return { success: false, message: 'Profile update failed' };
    }
}

/**
 * Change user password
 */
function changePassword(userId, currentPassword, newPassword) {
    try {
        const users = JSON.parse(localStorage.getItem('bakerist_users') || '[]');
        const userIndex = users.findIndex(user => user.id === userId);
        
        if (userIndex === -1) {
            return { success: false, message: 'User not found' };
        }
        
        // Verify current password
        if (users[userIndex].passwordHash !== simpleHash(currentPassword)) {
            return { success: false, message: 'Current password is incorrect' };
        }
        
        // Update password
        users[userIndex].passwordHash = simpleHash(newPassword);
        users[userIndex].updated_at = getCurrentISODate();
        
        localStorage.setItem('bakerist_users', JSON.stringify(users));
        
        return { success: true, message: 'Password changed successfully!' };
        
    } catch (error) {
        console.error('Password change error:', error);
        return { success: false, message: 'Password change failed' };
    }
}

/**
 * Create staff/admin account (admin only)
 */
function createStaffAccount(staffData, createdByAdminId) {
    try {
        if (!isAdmin()) {
            return { success: false, message: 'Unauthorized access' };
        }
        
        const users = JSON.parse(localStorage.getItem('bakerist_users') || '[]');
        
        // Check if email already exists
        if (users.find(user => user.email === staffData.email)) {
            return { success: false, message: 'Email already registered' };
        }
        
        // Create staff user
        const newStaff = {
            id: 'staff_' + Date.now(),
            name: staffData.name,
            email: staffData.email,
            passwordHash: simpleHash(staffData.password),
            role: staffData.role || USER_ROLES.STAFF,
            barangay: '',
            sitio: '',
            contact_no: staffData.contact_no || '',
            created_at: getCurrentISODate(),
            created_by: createdByAdminId,
            is_active: true,
            permissions: staffData.permissions || [],
            department: staffData.department || 'Operations'
        };
        
        users.push(newStaff);
        localStorage.setItem('bakerist_users', JSON.stringify(users));
        
        return { success: true, message: 'Staff account created successfully!', staff: newStaff };
        
    } catch (error) {
        console.error('Staff creation error:', error);
        return { success: false, message: 'Staff account creation failed' };
    }
}

/**
 * Get all staff accounts (admin only)
 */
function getStaffAccounts() {
    if (!isAdmin()) return [];
    
    const users = JSON.parse(localStorage.getItem('bakerist_users') || '[]');
    return users.filter(user => user.role === USER_ROLES.STAFF || user.role === USER_ROLES.ADMIN);
}

/**
 * Update staff account (admin only)
 */
function updateStaffAccount(staffId, updates) {
    try {
        if (!isAdmin()) {
            return { success: false, message: 'Unauthorized access' };
        }
        
        const users = JSON.parse(localStorage.getItem('bakerist_users') || '[]');
        const staffIndex = users.findIndex(user => user.id === staffId && (user.role === USER_ROLES.STAFF || user.role === USER_ROLES.ADMIN));
        
        if (staffIndex === -1) {
            return { success: false, message: 'Staff account not found' };
        }
        
        // Don't allow changing own role
        const currentUser = getCurrentUser();
        if (staffId === currentUser.id && updates.role && updates.role !== currentUser.role) {
            return { success: false, message: 'Cannot change your own role' };
        }
        
        users[staffIndex] = {
            ...users[staffIndex],
            ...updates,
            updated_at: getCurrentISODate()
        };
        
        localStorage.setItem('bakerist_users', JSON.stringify(users));
        
        return { success: true, message: 'Staff account updated successfully!' };
        
    } catch (error) {
        console.error('Staff update error:', error);
        return { success: false, message: 'Staff account update failed' };
    }
}

/**
 * Deactivate staff account (admin only)
 */
function deactivateStaffAccount(staffId) {
    try {
        if (!isAdmin()) {
            return { success: false, message: 'Unauthorized access' };
        }
        
        const currentUser = getCurrentUser();
        if (staffId === currentUser.id) {
            return { success: false, message: 'Cannot deactivate your own account' };
        }
        
        const users = JSON.parse(localStorage.getItem('bakerist_users') || '[]');
        const staffIndex = users.findIndex(user => user.id === staffId && (user.role === USER_ROLES.STAFF || user.role === USER_ROLES.ADMIN));
        
        if (staffIndex === -1) {
            return { success: false, message: 'Staff account not found' };
        }
        
        users[staffIndex].is_active = false;
        users[staffIndex].updated_at = getCurrentISODate();
        
        localStorage.setItem('bakerist_users', JSON.stringify(users));
        
        return { success: true, message: 'Staff account deactivated successfully!' };
        
    } catch (error) {
        console.error('Staff deactivation error:', error);
        return { success: false, message: 'Staff account deactivation failed' };
    }
}

/**
 * Get user order history
 */
function getUserOrderHistory(userId) {
    const orders = JSON.parse(localStorage.getItem('bakerist_orders') || '[]');
    return orders
        .filter(order => order.user_id === userId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

/**
 * Validate user registration data
 */
function validateRegistration(data) {
    const errors = [];
    
    if (!data.name || data.name.trim().length < 2) {
        errors.push('Name must be at least 2 characters long');
    }
    
    if (!isValidEmail(data.email)) {
        errors.push('Please enter a valid email address');
    }
    
    if (!data.password || data.password.length < 6) {
        errors.push('Password must be at least 6 characters long');
    }
    
    if (data.password !== data.confirmPassword) {
        errors.push('Passwords do not match');
    }
    
    if (!data.contact_no || !isValidPhone(data.contact_no)) {
        errors.push('Please enter a valid Philippine phone number');
    }
    
    return errors;
}

/**
 * Initialize auth-related UI on page load
 */
function initializeAuthUI() {
    updateAuthUI();
    
    // Add event listeners for auth forms if they exist
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const profileForm = document.getElementById('profile-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }
}

/**
 * Handle login form submission
 */
function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('remember-me')?.checked || false;
    
    const result = loginUser(email, password);
    
    if (result.success) {
        showToast(result.message, 'success');
        
        // Redirect based on role
        setTimeout(() => {
            if (result.user.role === USER_ROLES.ADMIN || result.user.role === USER_ROLES.STAFF) {
                window.location.href = 'admin.html';
            } else {
                const redirectTo = new URLSearchParams(window.location.search).get('redirect') || 'index.html';
                window.location.href = redirectTo;
            }
        }, 1000);
    } else {
        showToast(result.message, 'error');
    }
}

/**
 * Handle registration form submission
 */
function handleRegister(event) {
    event.preventDefault();
    
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        confirmPassword: document.getElementById('confirm-password').value,
        contact_no: document.getElementById('contact_no').value,
        barangay: document.getElementById('barangay').value,
        sitio: document.getElementById('sitio').value,
        newsletter: document.getElementById('newsletter').checked
    };
    
    // Validate data
    const errors = validateRegistration(formData);
    if (errors.length > 0) {
        showToast(errors[0], 'error');
        return;
    }
    
    const result = registerUser(formData);
    
    if (result.success) {
        showToast(result.message, 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    } else {
        showToast(result.message, 'error');
    }
}

/**
 * Handle profile update form submission
 */
function handleProfileUpdate(event) {
    event.preventDefault();
    
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showToast('Please log in to update your profile', 'error');
        return;
    }
    
    const updates = {
        name: document.getElementById('name').value,
        contact_no: document.getElementById('contact_no').value,
        barangay: document.getElementById('barangay').value,
        sitio: document.getElementById('sitio').value,
        preferences: {
            newsletter: document.getElementById('newsletter').checked,
            sms_notifications: document.getElementById('sms_notifications').checked
        }
    };
    
    const result = updateUserProfile(currentUser.id, updates);
    
    if (result.success) {
        showToast(result.message, 'success');
    } else {
        showToast(result.message, 'error');
    }
}

// Initialize auth system when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeAuthUI();
});

// Make functions available globally
window.logout = logout;
window.getCurrentUser = getCurrentUser;
window.isAdmin = isAdmin;
window.isLoggedIn = isLoggedIn;

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        registerUser,
        loginUser,
        logout,
        updateUserProfile,
        changePassword,
        createStaffAccount,
        getStaffAccounts,
        updateStaffAccount,
        deactivateStaffAccount,
        getUserOrderHistory,
        hasPermission,
        USER_ROLES,
        getCurrentUser,
        isAdmin,
        isLoggedIn
    };
}