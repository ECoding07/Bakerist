// checkout.js - Checkout process and order creation

let cart = [];
let shippingFee = 0;

/**
 * Initialize checkout process
 */
function initializeCheckout() {
    // Check if user is logged in
    if (!getCurrentUser()) {
        showToast('Please log in to checkout', 'error');
        setTimeout(() => {
            window.location.href = 'login.html?redirect=checkout.html';
        }, 1000);
        return;
    }

    loadCart();
    displayCheckoutItems();
    updateCheckoutSummary();
    setupEventListeners();
    loadUserInfo();
}

/**
 * Load cart and calculate shipping
 */
function loadCart() {
    try {
        cart = JSON.parse(localStorage.getItem('bakerist_cart') || '[]');
        
        if (cart.length === 0) {
            showToast('Your cart is empty', 'error');
            setTimeout(() => {
                window.location.href = 'cart.html';
            }, 1000);
            return;
        }
        
        // Calculate shipping based on subtotal
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        shippingFee = subtotal > 300 ? 0 : 50;
        
    } catch (error) {
        console.error('Error loading cart:', error);
        showToast('Error loading cart', 'error');
    }
}

/**
 * Display checkout items
 */
function displayCheckoutItems() {
    const container = document.getElementById('checkout-items');
    if (!container) return;
    
    container.innerHTML = cart.map(item => `
        <div class="checkout-item">
            <div class="checkout-item-image">
                <img src="${item.image}" alt="${item.name}" 
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZjVlOWQ2Ii8+CjxwYXRoIGQ9Ik0yNCAyMUMyNCAxOS43OTA5IDI1Ljc5MDkgMTggMjggMThIMzJDMzQuMjA5MSAxOCAzNiAxOS43OTA5IDM2IDIxVjMzQzM2IDM1LjIwOTEgMzQuMjA5MSAzNyAzMiAzN0gyOEMyNS43OTA5IDM3IDI0IDM1LjIwOTEgMjQgMzNWMjFaIiBmaWxsPSIjZDZhODZiIi8+CjxwYXRoIGQ9Ik0yNS44IDIzSDMzLjhWMzVIMjUuOFYyM1oiIGZpbGw9IndoaXRlIi8+CjxjaXJjbGUgY3g9IjMwIiBjeT0iMzkiIHI9IjMiIGZpbGw9IiNkNmE4NmIiLz4KPC9zdmc+'">
            </div>
            
            <div class="checkout-item-details">
                <h4>${item.name}</h4>
                <div class="checkout-item-meta">
                    <span>${formatCurrency(item.price)} × ${item.quantity}</span>
                </div>
            </div>
            
            <div class="checkout-item-total">
                ${formatCurrency(item.price * item.quantity)}
            </div>
        </div>
    `).join('');
}

/**
 * Update checkout summary
 */
function updateCheckoutSummary() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal + shippingFee;
    
    document.getElementById('summary-subtotal').textContent = formatCurrency(subtotal);
    document.getElementById('summary-shipping').textContent = formatCurrency(shippingFee);
    document.getElementById('summary-total').textContent = formatCurrency(total);
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Payment method changes
    document.querySelectorAll('input[name="payment-method"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const method = this.value;
            document.getElementById('gcash-details').classList.add('hidden');
            document.getElementById('card-details').classList.add('hidden');
            
            if (method === 'GCash') {
                document.getElementById('gcash-details').classList.remove('hidden');
            } else if (method === 'Credit Card') {
                document.getElementById('card-details').classList.remove('hidden');
            }
        });
    });

    // Barangay change for shipping calculation
    document.getElementById('barangay').addEventListener('change', function() {
        calculateShipping();
    });

    // Form submission
    document.getElementById('checkout-form').addEventListener('submit', function(e) {
        e.preventDefault();
        processOrder();
    });
}

/**
 * Load user information if available
 */
function loadUserInfo() {
    const user = getCurrentUser();
    if (user) {
        document.getElementById('full-name').value = user.name || '';
        document.getElementById('contact-number').value = user.contact_no || '';
        document.getElementById('barangay').value = user.barangay || '';
        document.getElementById('sitio').value = user.sitio || '';
    }
}

/**
 * Calculate shipping based on barangay
 */
function calculateShipping() {
    const barangay = document.getElementById('barangay').value;
    const deliveryZones = JSON.parse(localStorage.getItem('bakerist_delivery_zones') || '[]');
    const zone = deliveryZones.find(z => z.barangay === barangay);
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Free shipping over ₱300, otherwise use zone shipping fee or default
    if (subtotal > 300) {
        shippingFee = 0;
    } else {
        shippingFee = zone ? zone.shipping_fee : 50;
    }
    
    updateCheckoutSummary();
}

/**
 * Process order and create order record
 */
function processOrder() {
    const user = getCurrentUser();
    if (!user) {
        showToast('Please log in to place an order', 'error');
        return;
    }

    // Validate form
    if (!validateCheckoutForm()) {
        return;
    }

    // Get form data
    const formData = {
        fullName: document.getElementById('full-name').value,
        barangay: document.getElementById('barangay').value,
        sitio: document.getElementById('sitio').value,
        contact: document.getElementById('contact-number').value,
        deliveryMethod: document.querySelector('input[name="delivery-method"]:checked').value,
        paymentMethod: document.querySelector('input[name="payment-method"]:checked').value,
        deliveryInstructions: document.getElementById('delivery-instructions').value,
        orderNotes: document.getElementById('order-notes').value
    };

    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal + shippingFee;

    // Create order
    const order = createOrder(user.id, formData, subtotal, shippingFee, total);

    if (order) {
        // Clear cart
        localStorage.removeItem('bakerist_cart');
        
        // Redirect to order confirmation
        window.location.href = `order-confirmation.html?order_id=${order.id}`;
    }
}

/**
 * Validate checkout form
 */
function validateCheckoutForm() {
    const requiredFields = [
        'full-name', 'barangay', 'sitio', 'contact-number'
    ];

    for (const fieldId of requiredFields) {
        const field = document.getElementById(fieldId);
        if (!field.value.trim()) {
            showToast(`Please fill in ${field.labels[0].textContent}`, 'error');
            field.focus();
            return false;
        }
    }

    // Validate contact number
    const contact = document.getElementById('contact-number').value;
    if (!isValidPhone(contact)) {
        showToast('Please enter a valid Philippine phone number', 'error');
        return false;
    }

    // Validate payment details if needed
    const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;
    
    if (paymentMethod === 'GCash') {
        const gcashNumber = document.getElementById('gcash-number').value;
        if (!gcashNumber || !isValidPhone(gcashNumber)) {
            showToast('Please enter a valid GCash number', 'error');
            return false;
        }
    }
    
    if (paymentMethod === 'Credit Card') {
        const cardNumber = document.getElementById('card-number').value;
        const expiryDate = document.getElementById('expiry-date').value;
        const cvv = document.getElementById('cvv').value;
        const cardName = document.getElementById('card-name').value;
        
        if (!cardNumber || !expiryDate || !cvv || !cardName) {
            showToast('Please fill in all card details', 'error');
            return false;
        }
    }

    return true;
}

/**
 * Create order in localStorage
 */
function createOrder(userId, formData, subtotal, shippingFee, total) {
    try {
        const orders = JSON.parse(localStorage.getItem('bakerist_orders') || '[]');
        const settings = JSON.parse(localStorage.getItem('bakerist_settings') || '{}');
        
        // Generate order ID
        const nextOrderNumber = settings.nextOrderNumber || 1;
        const orderId = generateOrderId(nextOrderNumber);
        
        // Create order object
        const order = {
            id: orderId,
            user_id: userId,
            items: cart.map(item => ({
                product_id: item.productId,
                name: item.name,
                qty: item.quantity,
                price: item.price,
                options: item.options
            })),
            subtotal: subtotal,
            shipping_fee: shippingFee,
            total: total,
            delivery_info: {
                full_name: formData.fullName,
                barangay: formData.barangay,
                sitio: formData.sitio,
                contact: formData.contact,
                delivery_method: formData.deliveryMethod,
                instructions: formData.deliveryInstructions
            },
            tracking_status: 'To Prepare',
            payment_method: formData.paymentMethod,
            payment_status: formData.paymentMethod === 'COD' ? 'Pending' : 'Paid',
            order_notes: formData.orderNotes,
            created_at: new Date().toISOString()
        };
        
        // Add order to orders array
        orders.push(order);
        
        // Update next order number
        settings.nextOrderNumber = nextOrderNumber + 1;
        
        // Save to localStorage
        localStorage.setItem('bakerist_orders', JSON.stringify(orders));
        localStorage.setItem('bakerist_settings', JSON.stringify(settings));
        
        console.log('✅ Order created:', orderId);
        return order;
        
    } catch (error) {
        console.error('Error creating order:', error);
        showToast('Error creating order. Please try again.', 'error');
        return null;
    }
}

// Make functions available globally
window.initializeCheckout = initializeCheckout;