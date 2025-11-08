// main.js - Global functionality for all pages

/**
 * Initialize global functionality for all pages
 */
function initializeGlobal() {
    console.log('🌐 Initializing global functionality...');
    
    // Update authentication UI on every page
    updateAuthState();
    
    // Update cart count on every page
    updateCartCountGlobal();
    
    // Setup mobile menu
    setupMobileMenu();
    
    // Setup user dropdown
    setupUserDropdown();
}

/**
 * Update authentication state globally
 */
function updateAuthState() {
    const user = getCurrentUser();
    console.log('🔐 Auth state:', user ? `Logged in as ${user.name}` : 'Not logged in');
    
    if (user) {
        // Show logged-in elements
        document.querySelectorAll('.logged-in').forEach(el => {
            el.style.display = 'block';
            el.classList.remove('hidden');
        });
        document.querySelectorAll('.logged-out').forEach(el => {
            el.style.display = 'none';
        });
        
        // Update user name
        document.querySelectorAll('.user-name').forEach(el => {
            el.textContent = user.name.split(' ')[0];
        });
        
        // Show admin elements if admin
        if (isAdmin()) {
            document.querySelectorAll('.admin-only').forEach(el => {
                el.style.display = 'block';
                el.classList.remove('hidden');
            });
        }
    } else {
        // Show logged-out elements
        document.querySelectorAll('.logged-in').forEach(el => {
            el.style.display = 'none';
        });
        document.querySelectorAll('.logged-out').forEach(el => {
            el.style.display = 'block';
            el.classList.remove('hidden');
        });
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = 'none';
        });
    }
}

/**
 * Update cart count globally
 */
function updateCartCountGlobal() {
    try {
        const cart = JSON.parse(localStorage.getItem('bakerist_cart') || '[]');
        const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
        const cartElements = document.querySelectorAll('#cart-count');
        
        cartElements.forEach(element => {
            element.textContent = cartCount;
        });
    } catch (error) {
        console.error('Error updating cart count:', error);
    }
}

/**
 * Setup mobile menu functionality
 */
function setupMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
        
        // Close mobile menu when clicking on a link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }
}

/**
 * Setup user dropdown functionality
 */
function setupUserDropdown() {
    const userDropdowns = document.querySelectorAll('.user-dropdown');
    
    userDropdowns.forEach(dropdown => {
        // Desktop hover
        dropdown.addEventListener('mouseenter', function() {
            if (window.innerWidth > 768) {
                this.querySelector('.user-dropdown-menu').style.display = 'block';
            }
        });
        
        dropdown.addEventListener('mouseleave', function() {
            if (window.innerWidth > 768) {
                this.querySelector('.user-dropdown-menu').style.display = 'none';
            }
        });
        
        // Mobile click
        dropdown.addEventListener('click', function(e) {
            if (window.innerWidth <= 768) {
                const menu = this.querySelector('.user-dropdown-menu');
                menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
            }
        });
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.user-dropdown')) {
            document.querySelectorAll('.user-dropdown-menu').forEach(menu => {
                menu.style.display = 'none';
            });
        }
    });
}

/**
 * Global logout function
 */
function logout() {
    sessionStorage.removeItem('bakerist_session');
    showToast('Logged out successfully', 'success');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

// Make functions available globally
window.logout = logout;
window.updateAuthState = updateAuthState;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeGlobal);