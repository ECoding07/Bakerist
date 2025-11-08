// cart.js - Shopping cart management

let cart = [];

/**
 * Initialize cart
 */
function initializeCart() {
    loadCart();
    displayCartItems();
    updateCartSummary();
}

/**
 * Load cart from localStorage
 */
function loadCart() {
    try {
        cart = JSON.parse(localStorage.getItem('bakerist_cart') || '[]');
        console.log(`🛒 Loaded cart with ${cart.length} items`);
    } catch (error) {
        console.error('Error loading cart:', error);
        cart = [];
    }
}

/**
 * Save cart to localStorage
 */
function saveCart() {
    localStorage.setItem('bakerist_cart', JSON.stringify(cart));
    updateCartCount();
}

/**
 * Add item to cart
 */
function addToCart(productId, quantity = 1) {
    const products = JSON.parse(localStorage.getItem('bakerist_products') || '[]');
    const product = products.find(p => p.id === productId);
    
    if (!product) {
        showToast('Product not found', 'error');
        return;
    }
    
    if (product.stock < quantity) {
        showToast(`Only ${product.stock} items available in stock`, 'error');
        return;
    }
    
    // Check if item already in cart
    const existingItemIndex = cart.findIndex(item => item.productId === productId);
    
    if (existingItemIndex > -1) {
        // Update quantity
        const newQuantity = cart[existingItemIndex].quantity + quantity;
        if (newQuantity > product.stock) {
            showToast(`Cannot add more than ${product.stock} items`, 'error');
            return;
        }
        cart[existingItemIndex].quantity = newQuantity;
    } else {
        // Add new item
        cart.push({
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: quantity,
            image: product.image,
            options: null // Will be used for product options
        });
    }
    
    saveCart();
    showToast(`${quantity} ${product.name} added to cart`, 'success');
    
    // If on cart page, refresh display
    if (window.location.pathname.includes('cart.html')) {
        displayCartItems();
        updateCartSummary();
    }
}

/**
 * Remove item from cart
 */
function removeFromCart(productId) {
    cart = cart.filter(item => item.productId !== productId);
    saveCart();
    displayCartItems();
    updateCartSummary();
    showToast('Item removed from cart', 'success');
}

/**
 * Update item quantity in cart
 */
function updateCartQuantity(productId, newQuantity) {
    if (newQuantity < 1) {
        removeFromCart(productId);
        return;
    }
    
    const products = JSON.parse(localStorage.getItem('bakerist_products') || '[]');
    const product = products.find(p => p.id === productId);
    
    if (product && newQuantity > product.stock) {
        showToast(`Only ${product.stock} items available in stock`, 'error');
        return;
    }
    
    const itemIndex = cart.findIndex(item => item.productId === productId);
    if (itemIndex > -1) {
        cart[itemIndex].quantity = newQuantity;
        saveCart();
        displayCartItems();
        updateCartSummary();
    }
}

/**
 * Display cart items
 */
function displayCartItems() {
    const container = document.getElementById('cart-items');
    const emptyCart = document.getElementById('empty-cart');
    const cartContent = document.getElementById('cart-content');
    
    if (!container) return;
    
    if (cart.length === 0) {
        emptyCart.classList.remove('hidden');
        cartContent.classList.add('hidden');
        return;
    }
    
    emptyCart.classList.add('hidden');
    cartContent.classList.remove('hidden');
    
    container.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-image">
                <img src="${item.image}" alt="${item.name}" 
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZjVlOWQ2Ii8+CjxwYXRoIGQ9Ik0zMiAyOEMzMiAyNi43OTA5IDMzLjc5MDkgMjUgMzYgMjVINDRDNDYuMjA5MSAyNSA0OCAyNi43OTA5IDQ4IDI4VjQ0QzQ4IDQ2LjIwOTEgNDYuMjA5MSA0OCA0NCA0OEgzNkMzMy43OTA5IDQ4IDMyIDQ2LjIwOTEgMzIgNDRWMjhaIiBmaWxsPSIjZDZhODZiIi8+CjxwYXRoIGQ9Ik0zNC40IDMwSDEwLjZWNDZIMzQuNFYzMFoiIGZpbGw9IndoaXRlIi8+CjxjaXJjbGUgY3g9IjQwIiBjeT0iNTIiIHI9IjQiIGZpbGw9IiNkNmE4NmIiLz4KPC9zdmc+'">
            </div>
            
            <div class="cart-item-details">
                <h4 class="cart-item-name">${item.name}</h4>
                <div class="cart-item-price">${formatCurrency(item.price)} each</div>
                
                <div class="cart-item-actions">
                    <div class="quantity-selector">
                        <button class="quantity-btn" onclick="updateCartQuantity('${item.productId}', ${item.quantity - 1})">-</button>
                        <input type="number" class="quantity-input" value="${item.quantity}" min="1" 
                               onchange="updateCartQuantity('${item.productId}', parseInt(this.value))">
                        <button class="quantity-btn" onclick="updateCartQuantity('${item.productId}', ${item.quantity + 1})">+</button>
                    </div>
                    
                    <button class="btn btn-sm btn-outline remove-btn" onclick="removeFromCart('${item.productId}')">
                        Remove
                    </button>
                </div>
            </div>
            
            <div class="cart-item-total">
                <strong>${formatCurrency(item.price * item.quantity)}</strong>
            </div>
        </div>
    `).join('');
}

/**
 * Update cart summary
 */
function updateCartSummary() {
    const subtotalElement = document.getElementById('cart-subtotal');
    const shippingElement = document.getElementById('cart-shipping');
    const totalElement = document.getElementById('cart-total');
    
    if (!subtotalElement) return;
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 300 ? 0 : 50; // Free shipping over ₱300
    const total = subtotal + shipping;
    
    subtotalElement.textContent = formatCurrency(subtotal);
    shippingElement.textContent = formatCurrency(shipping);
    totalElement.textContent = formatCurrency(total);
}

/**
 * Update cart count in navigation
 */
function updateCartCount() {
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    const cartElements = document.querySelectorAll('#cart-count');
    
    cartElements.forEach(element => {
        element.textContent = cartCount;
    });
}

/**
 * Clear entire cart
 */
function clearCart() {
    if (confirm('Are you sure you want to clear your cart?')) {
        cart = [];
        saveCart();
        displayCartItems();
        updateCartSummary();
        showToast('Cart cleared', 'success');
    }
}

/**
 * Proceed to checkout
 */
function proceedToCheckout() {
    if (cart.length === 0) {
        showToast('Your cart is empty', 'error');
        return;
    }
    
    // Check if user is logged in
    if (!getCurrentUser()) {
        showToast('Please log in to checkout', 'error');
        setTimeout(() => {
            window.location.href = 'login.html?redirect=checkout.html';
        }, 1000);
        return;
    }
    
    window.location.href = 'checkout.html';
}

// Make functions available globally
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartQuantity = updateCartQuantity;
window.clearCart = clearCart;
window.proceedToCheckout = proceedToCheckout;

// Initialize cart if on cart page
if (window.location.pathname.includes('cart.html')) {
    document.addEventListener('DOMContentLoaded', initializeCart);
}