// products.js - Product display, search, and filtering

let products = [];
let filteredProducts = [];
let currentCategory = 'all';
let searchTerm = '';
let sortBy = 'name';

/**
 * Initialize menu functionality
 */
function initializeMenu() {
    loadProducts();
    setupEventListeners();
    displayProducts();
}

/**
 * Load products from localStorage
 */
function loadProducts() {
    try {
        products = JSON.parse(localStorage.getItem('bakerist_products') || '[]');
        filteredProducts = [...products];
        console.log(`📦 Loaded ${products.length} products`);
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
            document.getElementById('category-filter').value = currentCategory;
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
        noResults.classList.remove('hidden');
        return;
    }
    
    container.style.display = 'grid';
    noResults.classList.add('hidden');
    
    container.innerHTML = filteredProducts.map(product => `
        <div class="product-card" data-product-id="${product.id}">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" 
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlZ2lnaHQ9IjIwMCIgZmlsbD0iI2Y1ZTlkNiIvPgo8cGF0aCBkPSJNODAgNzBDODAgNjcuNzkwOSA4MS43OTA5IDY2IDg0IDY2SDExNkMxMTguMjA5IDY2IDEyMCA2Ny43OTA5IDEyMCA3MFYxMTBDMTIwIDExMi4yMDkgMTE4LjIwOSAxMTQgMTE2IDExNEg4NEM4MS43OTA5IDExNCA4MCAxMTIuMjA5IDgwIDExMFY3MFoiIGZpbGw9IiNkNmE4NmIiLz4KPHBhdGggZD0iTTg2IDc0SDEwNlY5NEg4NlY3NFoiIGZpbGw9IndoaXRlIi8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEyMCIgcj0iOCIgZmlsbD0iI2Q2YTg2YiIvPgo8L3N2Zz4K'">
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
                    
                    <button class="btn btn-outline view-details-btn" onclick="viewProductDetails('${product.id}')">
                        View Details
                    </button>
                </div>
            </div>
        </div>
    `).join('');
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
    
    productName.textContent = product.name;
    
    productContent.innerHTML = `
        <div class="product-details-modal">
            <div class="product-details-image">
                <img src="${product.image}" alt="${product.name}" 
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjZjVlOWQ2Ii8+CjxwYXRoIGQ9Ik0xNjAgMTQwQzE2MCAxMzUuNTgyIDE2My41ODIgMTMyIDE2OCAxMzJIMjMyQzIzNi40MTggMTMyIDI0MCAxMzUuNTgyIDI0MCAxNDBWMjIwQzI0MCAyMjQuNDE4IDIzNi40MTggMjI4IDIzMiAyMjhIMTY4QzE2My41ODIgMjI4IDE2MCAyMjQuNDE4IDE2MCAyMjBWMTQwWiIgZmlsbD0iI2Q2YTg2YiIvPgo8cGF0aCBkPSJNMTcyIDE0OEgyMTJWMTg4SDE3MlYxNDhaIiBmaWxsPSJ3aGl0ZSIvPgo8Y2lyY2xlIGN4PSIyMDAiIGN5PSIyNDAiIHI9IjE2IiBmaWxsPSIjZDZhODZiIi8+Cjwvc3ZnPgo='">
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
    const quantity = parseInt(quantityInput.value) || 1;
    addToCart(productId, quantity);
    closeModal();
}

/**
 * Increase quantity
 */
function increaseQuantity(productId, maxStock) {
    const input = document.getElementById(`qty-${productId}`);
    const modalInput = document.getElementById(`modal-qty-${productId}`);
    let currentValue = parseInt(input.value) || 1;
    
    if (currentValue < maxStock) {
        currentValue++;
        input.value = currentValue;
        if (modalInput) modalInput.value = currentValue;
    }
}

/**
 * Decrease quantity
 */
function decreaseQuantity(productId) {
    const input = document.getElementById(`qty-${productId}`);
    const modalInput = document.getElementById(`modal-qty-${productId}`);
    let currentValue = parseInt(input.value) || 1;
    
    if (currentValue > 1) {
        currentValue--;
        input.value = currentValue;
        if (modalInput) modalInput.value = currentValue;
    }
}

// Make functions available globally
window.viewProductDetails = viewProductDetails;
window.increaseQuantity = increaseQuantity;
window.decreaseQuantity = decreaseQuantity;
window.addToCartFromModal = addToCartFromModal;
window.closeModal = closeModal;
window.clearFilters = clearFilters;