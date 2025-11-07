// utils.js - Core utilities for BAKERIST bakery website

/**
 * Simple hash function for demo purposes (not secure for production)
 * In a real application, hashing should be done server-side
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
 * Format currency in Philippine Peso
 */
function formatCurrency(amount) {
    return `₱${parseFloat(amount).toFixed(2)}`;
}

/**
 * Generate a unique order ID
 */
function generateOrderId(nextOrderNumber) {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    return `ORD-${dateStr}-${String(nextOrderNumber).padStart(4, '0')}`;
}

/**
 * Get current date in ISO format
 */
function getCurrentISODate() {
    return new Date().toISOString();
}

/**
 * Format date for display
 */
function formatDisplayDate(dateString) {
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('en-PH', options);
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => toast.remove());

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-message">${message}</span>
            <button class="toast-close">&times;</button>
        </div>
    `;

    // Add styles if not already added
    if (!document.querySelector('#toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            .toast {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                padding: 1rem;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                border-left: 4px solid #d6a86b;
                z-index: 1000;
                max-width: 300px;
                animation: slideInRight 0.3s ease;
            }
            .toast-success { border-left-color: #28a745; }
            .toast-error { border-left-color: #dc3545; }
            .toast-warning { border-left-color: #ffc107; }
            .toast-content {
                display: flex;
                align-items: center;
                justify-content: between;
            }
            .toast-message {
                flex: 1;
                margin-right: 1rem;
            }
            .toast-close {
                background: none;
                border: none;
                font-size: 1.2rem;
                cursor: pointer;
                color: #666;
            }
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 5000);

    // Close on click
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.remove();
    });
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
 * Generate CSV from data array
 */
function generateCSV(data, headers) {
    if (!data || data.length === 0) return '';
    
    const headerRow = headers.join(',');
    const dataRows = data.map(row => 
        headers.map(header => {
            let value = row[header] || '';
            // Handle values that might contain commas or quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                value = `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        }).join(',')
    );
    
    return [headerRow, ...dataRows].join('\n');
}

/**
 * Trigger CSV download
 */
function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Debounce function for search inputs
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Get shipping fee for barangay
 */
function getShippingFee(barangay) {
    const zones = JSON.parse(localStorage.getItem('bakerist_delivery_zones') || '[]');
    const zone = zones.find(z => z.barangay === barangay);
    return zone ? zone.shipping_fee : 50.0; // Default fee
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

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        simpleHash,
        formatCurrency,
        generateOrderId,
        getCurrentISODate,
        formatDisplayDate,
        showToast,
        isValidEmail,
        isValidPhone,
        generateCSV,
        downloadCSV,
        debounce,
        getShippingFee,
        isLoggedIn,
        getCurrentUser,
        isAdmin
    };
}