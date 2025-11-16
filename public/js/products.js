// products.js - Product display, search, and filtering

let products = [];
let filteredProducts = [];
let currentCategory = 'all';
let searchTerm = '';
let sortBy = 'name';

// SVG placeholder as final fallback
const SVG_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjVlOWQ2Ii8+CjxwYXRoIGQ9Ik04MCA3MEM4MCA2Ny43OTA5IDgxLjc5MDkgNjYgODQgNjZIMTE2QzExOC4yMDkgNjYgMTIwIDY3Ljc5MDkgMTIwIDcwVjExMEMxMjAgMTEyLjIwOSAxMTguMjA5IDExNCAxMTYgMTE0SDg0QzgxLjc5MDkgMTE0IDgwIDExMi4yMDkgODAgMTEwVjcwWiIgZmlsbD0iI2Q2YTg2YiIvPgo8cGF0aCBkPSJNODYgNzRIMTA2Vjk0SDg2Vjc0WiIgZmlsbD0id2hpdGUiLz4KPGNpcmNsZSBjeD0iMTAwIiBjeT0iMTIwIiByPSI4IiBmaWxsPSIjZDZhODZiIi8+Cjwvc3ZnPgo=';

/**
 * Get correct image path with fallback
 */
function getProductImagePath(imagePath) {
    if (!imagePath) {
        return SVG_PLACEHOLDER;
    }
    
    // If path already starts with assets/, use it as is
    if (imagePath.startsWith('assets/')) {
        return imagePath;
    }
    
    // If path starts with /, remove the leading slash
    if (imagePath.startsWith('/')) {
        return imagePath.substring(1);
    }
    
    return imagePath;
}

/**
 * Enhanced image error handler
 */
function handleImageError(img, category) {
    console.warn(`⚠️ Image failed to load: ${img.src}`);
    
    // Try to fix common path issues
    let fixedPath = img.src;
    
    // If path has double slashes or incorrect base
    if (fixedPath.includes('//assets/')) {
        fixedPath = fixedPath.replace('//assets/', 'assets/');
    }
    
    // If path starts with /assets/ from root, try relative
    if (fixedPath.startsWith(window.location.origin + '/assets/')) {
        fixedPath = fixedPath.replace(window.location.origin + '/', '');
    }
    
    // If still fails, use SVG placeholder
    const testImage = new Image();
    testImage.onload = function() {
        img.src = fixedPath;
        console.log(`✅ Fixed image path: ${fixedPath}`);
    };
    testImage.onerror = function() {
        img.src = SVG_PLACEHOLDER;
        console.log(`❌ Final fallback for: ${img.alt}`);
    };
    testImage.src = fixedPath;
}

/**
 * Initialize menu functionality
 */
function initializeMenu() {
    console.log('🍞 Initializing menu...');
    loadProducts();
    setupEventListeners();
    displayProducts();
    updateCartCountFromProducts();
}

/**
 * Load products from localStorage
 */
function loadProducts() {
    try {
        products = JSON.parse(localStorage.getItem('bakerist_products') || '[]');
        filteredProducts = [...products];
        console.log(`📦 Loaded ${products.length} products`);
        
        // Debug: Log all product image paths
        products.forEach(product => {
            const imagePath = getProductImagePath(product.image);
            console.log(`🖼️ ${product.name}: ${imagePath}`);
        });
        
    } catch (error) {
        console.error('Error loading products:', error);
        showToast('Error loading products', 'error');
    }
}

/**
 * Setup event listeners for search and filters
 */
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            searchTerm = e.target.value.toLowerCase();
            filterProducts();
        }, 300));
    }

    // Category filter
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => {
            currentCategory = e.target.value;
            filterProducts();
        });
    }

    // Sort filter
    const sortFilter = document.getElementById('sort-filter');
    if (sortFilter) {
        sortFilter.addEventListener('change', (e) => {
            sortBy = e.target.value;
            sortProducts();
            displayProducts();
        });
    }

    // Category tabs
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            // Update active tab
            document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            
            // Update category
            currentCategory = e.target.dataset.category;
            const categoryFilter = document.getElementById('category-filter');
            if (categoryFilter) categoryFilter.value = currentCategory;
            filterProducts();
        });
    });
}

/**
 * Filter products based on current filters
 */
function filterProducts() {
    filteredProducts = products.filter(product => {
        // Filter by category
        if (currentCategory !== 'all' && product.category !== currentCategory) {
            return false;
        }
        
        // Filter by search term
        if (searchTerm && !product.name.toLowerCase().includes(searchTerm) && 
            !product.description.toLowerCase().includes(searchTerm)) {
            return false;
        }
        
        // Only show available products
        return product.available !== false;
    });
    
    sortProducts();
    displayProducts();
}

/**
 * Sort products based on current sort option
 */
function sortProducts() {
    switch(sortBy) {
        case 'price-low':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
        case 'name':
            filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'popular':
            // For demo, sort by stock (lower stock = more popular)
            filteredProducts.sort((a, b) => a.stock - b.stock);
            break;
    }
}

/**
 * Display products in the grid
 */
function displayProducts() {
    const container = document.getElementById('products-container');
    const noResults = document.getElementById('no-results');
    
    if (!container) return;
    
    if (filteredProducts.length === 0) {
        container.style.display = 'none';
        if (noResults) noResults.classList.remove('hidden');
        return;
    }
    
    container.style.display = 'grid';
    if (noResults) noResults.classList.add('hidden');
    
    container.innerHTML = filteredProducts.map(product => {
        const imagePath = getProductImagePath(product.image);
        console.log(`🖼️ Rendering ${product.name}: ${imagePath}`); // Debug log
        
        return `
        <div class="product-card" data-product-id="${product.id}">
            <div class="product-image">
                <img src="${imagePath}" alt="${product.name}" 
                     onerror="handleImageError(this, '${product.category}')">
                ${product.stock === 0 ? '<span class="stock-badge out-of-stock">Out of Stock</span>' : ''}
                ${product.stock > 0 && product.stock < 10 ? '<span class="stock-badge low-stock">Low Stock</span>' : ''}
            </div>
            
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-category">${product.category}</p>
                <p class="product-description">${product.description}</p>
                
                <div class="product-meta">
                    <div class="product-price">${formatCurrency(product.price)}</div>
                    <div class="product-stock">
                        ${product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
                    </div>
                </div>

                <div class="product-actions">
                    ${product.stock > 0 ? `
                        <div class="quantity-selector">
                            <button class="quantity-btn" onclick="decreaseQuantity('${product.id}')">-</button>
                            <input type="number" class="quantity-input" id="qty-${product.id}" value="1" min="1" max="${product.stock}" readonly>
                            <button class="quantity-btn" onclick="increaseQuantity('${product.id}', ${product.stock})">+</button>
                        </div>
                        <button class="btn btn-primary add-to-cart-btn" onclick="addToCart('${product.id}')">
                            Add to Cart
                        </button>
                    ` : `
                        <button class="btn btn-outline" disabled>Out of Stock</button>
                    `}
                </div>
            </div>
        </div>
    `}).join('');
}

/**
 * View product details in modal
 */
function viewProductDetails(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const modal = document.getElementById('product-modal');
    const productName = document.getElementById('modal-product-name');
    const productContent = document.getElementById('modal-product-content');
    
    if (!modal || !productName || !productContent) return;
    
    productName.textContent = product.name;
    
    const imagePath = getProductImagePath(product.image);
    
    productContent.innerHTML = `
        <div class="product-details-modal">
            <div class="product-details-image">
                <img src="${imagePath}" alt="${product.name}" 
                     onerror="handleImageError(this, '${product.category}')">
                ${product.stock === 0 ? '<span class="stock-badge out-of-stock">Out of Stock</span>' : ''}
                ${product.stock > 0 && product.stock < 10 ? '<span class="stock-badge low-stock">Low Stock</span>' : ''}
            </div>
            
            <div class="product-details-info">
                <div class="detail-item">
                    <strong>Category:</strong> ${product.category}
                </div>
                <div class="detail-item">
                    <strong>Price:</strong> ${formatCurrency(product.price)}
                </div>
                <div class="detail-item">
                    <strong>Availability:</strong> 
                    <span class="${product.stock > 0 ? 'in-stock' : 'out-of-stock'}">
                        ${product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
                    </span>
                </div>
                
                <div class="product-description-full">
                    <h4>Description</h4>
                    <p>${product.description}</p>
                </div>
                
                ${product.options ? `
                    <div class="product-options">
                        <h4>Options</h4>
                        ${Object.entries(product.options).map(([key, value]) => `
                            <div class="option-item">
                                <strong>${key}:</strong> ${Array.isArray(value.choices) ? value.choices.join(', ') : value}
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                
                ${product.stock > 0 ? `
                    <div class="modal-actions">
                        <div class="quantity-selector">
                            <button class="quantity-btn" onclick="decreaseQuantity('${product.id}')">-</button>
                            <input type="number" class="quantity-input" id="modal-qty-${product.id}" value="1" min="1" max="${product.stock}">
                            <button class="quantity-btn" onclick="increaseQuantity('${product.id}', ${product.stock})">+</button>
                        </div>
                        <button class="btn btn-primary btn-lg" onclick="addToCartFromModal('${product.id}')">
                            Add to Cart
                        </button>
                    </div>
                ` : `
                    <div class="modal-actions">
                        <button class="btn btn-outline" disabled>Out of Stock</button>
                    </div>
                `}
            </div>
        </div>
    `;
    
    modal.classList.add('show');
}

/**
 * Add to cart from modal
 */
function addToCartFromModal(productId) {
    const quantityInput = document.getElementById(`modal-qty-${productId}`);
    const quantity = parseInt(quantityInput?.value) || 1;
    
    if (typeof addToCart === 'function') {
        addToCart(productId, quantity);
        closeModal();
    } else {
        console.error('❌ addToCart function not found!');
        showToast('Error adding to cart', 'error');
    }
}

/**
 * Increase quantity
 */
function increaseQuantity(productId, maxStock) {
    const input = document.getElementById(`qty-${productId}`);
    const modalInput = document.getElementById(`modal-qty-${productId}`);
    let currentValue = parseInt(input?.value) || 1;
    
    if (currentValue < maxStock) {
        currentValue++;
        if (input) input.value = currentValue;
        if (modalInput) modalInput.value = currentValue;
    }
}

/**
 * Decrease quantity
 */
function decreaseQuantity(productId) {
    const input = document.getElementById(`qty-${productId}`);
    const modalInput = document.getElementById(`modal-qty-${productId}`);
    let currentValue = parseInt(input?.value) || 1;
    
    if (currentValue > 1) {
        currentValue--;
        if (input) input.value = currentValue;
        if (modalInput) modalInput.value = currentValue;
    }
}

/**
 * Update cart count from products page
 */
function updateCartCountFromProducts() {
    try {
        const cart = JSON.parse(localStorage.getItem('bakerist_cart') || '[]');
        const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
        const cartElement = document.getElementById('cart-count');
        if (cartElement) {
            cartElement.textContent = cartCount;
        }
    } catch (error) {
        console.error('Error updating cart count:', error);
    }
}

/**
 * Clear all filters
 */
function clearFilters() {
    // Reset search
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';
    
    // Reset category filter
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) categoryFilter.value = 'all';
    
    // Reset sort filter
    const sortFilter = document.getElementById('sort-filter');
    if (sortFilter) sortFilter.value = 'name';
    
    // Reset category tabs
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.category === 'all') {
            tab.classList.add('active');
        }
    });
    
    // Reset variables
    searchTerm = '';
    currentCategory = 'all';
    sortBy = 'name';
    
    // Refresh display
    filterProducts();
}

/**
 * Close modal
 */
function closeModal() {
    const modal = document.getElementById('product-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}

/**
 * Debounce function for search
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

// Make functions available globally
window.viewProductDetails = viewProductDetails;
window.increaseQuantity = increaseQuantity;
window.decreaseQuantity = decreaseQuantity;
window.addToCartFromModal = addToCartFromModal;
window.closeModal = closeModal;
window.clearFilters = clearFilters;
window.handleImageError = handleImageError;
window.getProductImagePath = getProductImagePath;