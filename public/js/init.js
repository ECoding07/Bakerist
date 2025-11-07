// init.js - Initialize and seed localStorage data for BAKERIST bakery

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

/**
 * Main initialization function
 */
function initializeApp() {
    console.log('🚀 Initializing BAKERIST Bakery App...');
    
    // Check if we need to seed data
    if (!localStorage.getItem('bakerist_initialized')) {
        seedInitialData();
    } else {
        console.log('✅ App already initialized');
    }
    
    // Update UI based on login state
    updateAuthUI();
    
    // Initialize any page-specific functionality
    initializePageSpecificFeatures();
}

/**
 * Seed initial data if localStorage is empty
 */
function seedInitialData() {
    console.log('🌱 Seeding initial data...');
    
    try {
        // Fetch seed data (in real implementation, this would be from seed.json)
        const seedData = getSeedData();
        
        // Store each data type in localStorage
        localStorage.setItem('bakerist_users', JSON.stringify(seedData.users));
        localStorage.setItem('bakerist_products', JSON.stringify(seedData.products));
        localStorage.setItem('bakerist_orders', JSON.stringify(seedData.orders));
        localStorage.setItem('bakerist_delivery_zones', JSON.stringify(seedData.delivery_zones));
        localStorage.setItem('bakerist_settings', JSON.stringify(seedData.settings));
        
        // Mark as initialized
        localStorage.setItem('bakerist_initialized', 'true');
        
        console.log('✅ Initial data seeded successfully!');
        console.log(`📊 Seeded: ${seedData.users.length} users, ${seedData.products.length} products, ${seedData.orders.length} orders`);
        
    } catch (error) {
        console.error('❌ Error seeding initial data:', error);
        showToast('Error initializing app data', 'error');
    }
}

/**
 * Get seed data (in real app, this would be fetched from seed.json)
 */
function getSeedData() {
    // This data would normally come from seed.json file
    // For now, we'll include it here and later separate it
    return {
        "users": [
            {
                "id": "user_001",
                "name": "Juan dela Cruz",
                "email": "juan@example.com",
                "passwordHash": "juan123",
                "role": "customer",
                "barangay": "Anilao",
                "sitio": "Sitio Maliksi",
                "contact_no": "+639171234567",
                "created_at": "2025-01-15T08:30:00Z"
            },
            {
                "id": "user_002", 
                "name": "Maria Santos",
                "email": "maria@example.com",
                "passwordHash": "maria123",
                "role": "customer",
                "barangay": "Bagalangit",
                "sitio": "Sitio Calmada",
                "contact_no": "+639187654321",
                "created_at": "2025-01-20T14:15:00Z"
            },
            {
                "id": "admin_001",
                "name": "Bakerist Admin",
                "email": "admin@bakerist.local",
                "passwordHash": "admin123",
                "role": "admin",
                "barangay": "Mabini",
                "sitio": "Main Branch",
                "contact_no": "+639351234567",
                "created_at": "2025-01-01T00:00:00Z"
            }
        ],
        "products": [
            {
                "id": "prod_001",
                "name": "Pandesal Classic",
                "category": "Breads",
                "price": 8.00,
                "stock": 120,
                "available": true,
                "description": "Soft, warm pandesal baked fresh every morning. Perfect with coffee or hot chocolate.",
                "image": "/assets/images/pandesal.jpg",
                "options": null
            },
            {
                "id": "prod_002",
                "name": "Ensaymada Special",
                "category": "Breads", 
                "price": 25.00,
                "stock": 45,
                "available": true,
                "description": "Fluffy ensaymada topped with butter, sugar, and grated cheese. A Filipino favorite!",
                "image": "/assets/images/ensaymada.jpg",
                "options": null
            },
            {
                "id": "prod_003",
                "name": "Spanish Bread",
                "category": "Breads",
                "price": 12.00,
                "stock": 80,
                "available": true,
                "description": "Soft bread rolls filled with sweet butter and breadcrumb mixture.",
                "image": "/assets/images/spanish-bread.jpg",
                "options": null
            },
            {
                "id": "prod_004",
                "name": "Pan de Coco",
                "category": "Breads",
                "price": 15.00,
                "stock": 60,
                "available": true,
                "description": "Soft bread filled with sweet coconut filling. A tropical delight!",
                "image": "/assets/images/pan-de-coco.jpg",
                "options": null
            },
            {
                "id": "prod_005",
                "name": "Ube Cake",
                "category": "Cakes",
                "price": 450.00,
                "stock": 8,
                "available": true,
                "description": "Moist purple yam cake with creamy ube frosting. Perfect for celebrations!",
                "image": "/assets/images/ube-cake.jpg",
                "options": {
                    "type": "customization",
                    "choices": ["Add celebrant name", "Add special message"]
                }
            }
            // More products would be here in full implementation...
        ],
        "delivery_zones": [
            {"barangay": "Anilao", "shipping_fee": 30.0},
            {"barangay": "Bagalangit", "shipping_fee": 25.0},
            {"barangay": "Mainit", "shipping_fee": 35.0},
            {"barangay": "Balon-Anito", "shipping_fee": 40.0},
            {"barangay": "Matabungkay", "shipping_fee": 45.0},
            {"barangay": "Nag-Iba", "shipping_fee": 50.0},
            {"barangay": "Laurel", "shipping_fee": 55.0},
            {"barangay": "Sampaguita", "shipping_fee": 30.0}
        ],
        "orders": [
            {
                "id": "ORD-20250120-0001",
                "user_id": "user_001",
                "items": [
                    {"product_id": "prod_001", "name": "Pandesal Classic", "qty": 12, "price": 8.0, "options": null},
                    {"product_id": "prod_002", "name": "Ensaymada Special", "qty": 4, "price": 25.0, "options": null}
                ],
                "subtotal": 196.0,
                "shipping_fee": 30.0,
                "total": 226.0,
                "delivery_info": {
                    "barangay": "Anilao",
                    "sitio": "Sitio Maliksi", 
                    "contact": "+639171234567",
                    "full_name": "Juan dela Cruz",
                    "delivery_method": "Delivery"
                },
                "tracking_status": "Delivered",
                "payment_method": "GCash",
                "payment_status": "Paid",
                "created_at": "2025-01-20T09:15:00Z"
            }
            // More orders would be here...
        ],
        "settings": {
            "nextOrderNumber": 4,
            "store_name": "BAKERIST — Mabini Bakery",
            "contact_number": "+63 912 345 6789",
            "operating_hours": "6:00 AM - 8:00 PM Daily",
            "address": "Mabini, Batangas, Philippines"
        }
    };
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
 * Initialize page-specific features
 */
function initializePageSpecificFeatures() {
    const currentPage = document.body.dataset.page;
    
    switch(currentPage) {
        case 'home':
            initializeHomePage();
            break;
        case 'menu':
            initializeMenuPage();
            break;
        case 'admin':
            if (!isAdmin()) {
                window.location.href = 'index.html';
                return;
            }
            initializeAdminPage();
            break;
        // Add more cases for other pages
    }
}

/**
 * Initialize home page features
 */
function initializeHomePage() {
    // Load featured products
    loadFeaturedProducts();
    
    // Initialize hero animations
    initializeHeroAnimations();
}

/**
 * Load featured products for home page
 */
function loadFeaturedProducts() {
    const featuredContainer = document.getElementById('featured-products');
    if (!featuredContainer) return;
    
    const products = JSON.parse(localStorage.getItem('bakerist_products') || '[]');
    const featuredProducts = products.slice(0, 6); // First 6 products as featured
    
    featuredContainer.innerHTML = featuredProducts.map(product => `
        <div class="product-card">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" onerror="this.src='/assets/images/placeholder.jpg'">
                ${product.stock < 10 ? '<span class="stock-badge low-stock">Low Stock</span>' : ''}
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-price">${formatCurrency(product.price)}</div>
                <button class="btn btn-primary add-to-cart" data-product-id="${product.id}">
                    Add to Cart
                </button>
            </div>
        </div>
    `).join('');
}

/**
 * Initialize hero animations
 */
function initializeHeroAnimations() {
    // Add floating pastry animations
    const hero = document.querySelector('.hero');
    if (hero) {
        // This would create floating pastry elements
        // Implementation depends on specific design requirements
    }
}

/**
 * Reset all data (for testing/demo purposes)
 */
function resetAllData() {
    if (confirm('Are you sure you want to reset all data? This will clear all orders, users, and settings.')) {
        localStorage.clear();
        sessionStorage.clear();
        localStorage.setItem('bakerist_initialized', 'false');
        initializeApp();
        showToast('All data has been reset', 'success');
    }
}

// Make reset function available globally for admin panel
window.resetAllData = resetAllData;

// Re-export utility functions for consistency
window.formatCurrency = formatCurrency;
window.showToast = showToast;
window.getCurrentUser = getCurrentUser;
window.isAdmin = isAdmin;