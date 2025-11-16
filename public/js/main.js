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
    
    // Update both desktop and mobile UI
    updateDesktopAuthState(user);
    updateMobileAuthState(user);
}

/**
 * Update desktop authentication state
 */
function updateDesktopAuthState(user) {
    const loggedInElements = document.querySelectorAll('.logged-in:not(.mobile-menu .logged-in)');
    const loggedOutElements = document.querySelectorAll('.logged-out:not(.mobile-menu .logged-out)');
    
    if (user) {
        // Show logged-in elements
        loggedInElements.forEach(el => {
            el.style.display = 'block';
            el.classList.remove('hidden');
        });
        loggedOutElements.forEach(el => {
            el.style.display = 'none';
            el.classList.add('hidden');
        });
        
        // Update user name
        document.querySelectorAll('.user-name').forEach(el => {
            el.textContent = user.name.split(' ')[0];
        });
        
        // Show admin elements if admin
        if (isAdmin && isAdmin()) {
            document.querySelectorAll('.admin-only').forEach(el => {
                el.style.display = 'block';
                el.classList.remove('hidden');
            });
        }
    } else {
        // Show logged-out elements
        loggedInElements.forEach(el => {
            el.style.display = 'none';
            el.classList.add('hidden');
        });
        loggedOutElements.forEach(el => {
            el.style.display = 'block';
            el.classList.remove('hidden');
        });
        
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = 'none';
            el.classList.add('hidden');
        });
    }
}

/**
 * Update mobile authentication state
 */
function updateMobileAuthState(user) {
    const mobileLoggedIn = document.querySelectorAll('.mobile-menu .logged-in');
    const mobileLoggedOut = document.querySelectorAll('.mobile-menu .logged-out');
    const mobileUserName = document.querySelector('.mobile-user-name');
    
    if (user) {
        // Show logged-in elements in mobile menu
        mobileLoggedIn.forEach(el => {
            el.style.display = 'flex';
            el.classList.remove('hidden');
        });
        mobileLoggedOut.forEach(el => {
            el.style.display = 'none';
            el.classList.add('hidden');
        });
        
        // Update mobile user name
        if (mobileUserName) {
            mobileUserName.textContent = user.name.split(' ')[0];
        }
        
        console.log('✅ Mobile: Showing logged-in state for user:', user.name);
    } else {
        // Show logged-out elements in mobile menu
        mobileLoggedIn.forEach(el => {
            el.style.display = 'none';
            el.classList.add('hidden');
        });
        mobileLoggedOut.forEach(el => {
            el.style.display = 'block';
            el.classList.remove('hidden');
        });
        
        console.log('✅ Mobile: Showing logged-out state');
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
        
        // Update mobile cart count
        const mobileCartElement = document.getElementById('mobile-cart-count');
        if (mobileCartElement) {
            mobileCartElement.textContent = cartCount;
        }
    } catch (error) {
        console.error('Error updating cart count:', error);
    }
}

/**
 * Setup mobile menu functionality
 */
function setupMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    const mobileMenuClose = document.getElementById('mobileMenuClose');
    const body = document.body;

    // Initialize mobile menu state
    let isMobileMenuOpen = false;

    function openMobileMenu() {
        if (mobileMenu) {
            mobileMenu.classList.add('active');
            if (mobileMenuOverlay) mobileMenuOverlay.classList.add('active');
            body.classList.add('menu-open');
            isMobileMenuOpen = true;
            
            // Update cart count in mobile menu
            updateCartCountGlobal();
            
            // Update auth state in mobile menu
            const user = getCurrentUser();
            updateMobileAuthState(user);
            
            console.log('📱 Mobile menu opened');
        }
    }

    function closeMobileMenu() {
        if (mobileMenu) {
            mobileMenu.classList.remove('active');
            if (mobileMenuOverlay) mobileMenuOverlay.classList.remove('active');
            body.classList.remove('menu-open');
            isMobileMenuOpen = false;
            
            console.log('📱 Mobile menu closed');
        }
    }

    function toggleMobileMenu() {
        if (isMobileMenuOpen) {
            closeMobileMenu();
        } else {
            openMobileMenu();
        }
    }

    // Event listeners
    if (hamburger) {
        hamburger.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleMobileMenu();
        });
    }

    if (mobileMenuClose) {
        mobileMenuClose.addEventListener('click', closeMobileMenu);
    }

    if (mobileMenuOverlay) {
        mobileMenuOverlay.addEventListener('click', closeMobileMenu);
    }

    // Close menu when clicking on mobile nav links
    document.querySelectorAll('.mobile-nav-link').forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });

    // Close menu when clicking on mobile dropdown items (except logout)
    document.querySelectorAll('.mobile-dropdown-item').forEach(item => {
        if (!item.classList.contains('logout-btn')) {
            item.addEventListener('click', closeMobileMenu);
        }
    });

    // Close menu on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && isMobileMenuOpen) {
            closeMobileMenu();
        }
    });

    // Close menu on window resize (if resizing to desktop)
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && isMobileMenuOpen) {
            closeMobileMenu();
        }
    });
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
                const menu = this.querySelector('.user-dropdown-menu');
                if (menu) menu.style.display = 'block';
            }
        });
        
        dropdown.addEventListener('mouseleave', function() {
            if (window.innerWidth > 768) {
                const menu = this.querySelector('.user-dropdown-menu');
                if (menu) menu.style.display = 'none';
            }
        });
        
        // Mobile click
        dropdown.addEventListener('click', function(e) {
            if (window.innerWidth <= 768) {
                const menu = this.querySelector('.user-dropdown-menu');
                if (menu) {
                    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
                }
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
    console.log('🚪 Logging out user...');
    
    // Clear session
    sessionStorage.removeItem('bakerist_session');
    
    // Show toast notification if function exists
    if (typeof showToast === 'function') {
        showToast('Logged out successfully', 'success');
    } else {
        console.log('✅ Logged out successfully');
    }
    
    // Close mobile menu if open
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu && mobileMenu.classList.contains('active')) {
        mobileMenu.classList.remove('active');
        document.body.classList.remove('menu-open');
        const overlay = document.getElementById('mobileMenuOverlay');
        if (overlay) overlay.classList.remove('active');
    }
    
    // Update UI immediately
    updateAuthState();
    
    // Redirect to home page
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

/**
 * Get current user from session
 */
function getCurrentUser() {
    try {
        const session = sessionStorage.getItem('bakerist_session');
        if (session) {
            return JSON.parse(session);
        }
    } catch (error) {
        console.error('Error getting current user:', error);
    }
    return null;
}

/**
 * Check if user is admin (placeholder function)
 */
function isAdmin() {
    const user = getCurrentUser();
    return user && user.role === 'admin';
}

// Make functions available globally
window.logout = logout;
window.updateAuthState = updateAuthState;
window.updateCartCountGlobal = updateCartCountGlobal;
window.getCurrentUser = getCurrentUser;
window.isAdmin = isAdmin;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeGlobal);

// Handle page transitions and maintain state
window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
        // Page was loaded from cache, reinitialize
        initializeGlobal();
    }
});