// tracking.js - Order tracking functionality

/**
 * Track order by order number
 */
function trackOrder(orderNumber) {
    if (!orderNumber) {
        showToast('Please enter an order number', 'error');
        return;
    }

    const orders = JSON.parse(localStorage.getItem('bakerist_orders') || '[]');
    const order = orders.find(o => o.id === orderNumber);
    
    const resultContainer = document.getElementById('tracking-result');
    
    if (!resultContainer) return;
    
    if (!order) {
        resultContainer.innerHTML = `
            <div class="tracking-error">
                <div class="error-icon">❌</div>
                <h3>Order Not Found</h3>
                <p>We couldn't find an order with number: <strong>${orderNumber}</strong></p>
                <div class="error-suggestions">
                    <p><strong>Please check:</strong></p>
                    <ul>
                        <li>✅ The order number is correct</li>
                        <li>✅ You entered the full order number (e.g., ORD-20250120-0001)</li>
                        <li>✅ The order was placed within the last 30 days</li>
                    </ul>
                </div>
                <button class="btn btn-primary" onclick="clearLookupForm()">Try Another Order Number</button>
            </div>
        `;
        resultContainer.classList.remove('hidden');
        return;
    }
    
    // Display order tracking information
    displayOrderTracking(order);
    resultContainer.classList.remove('hidden');
}

/**
 * Display order tracking information
 */
function displayOrderTracking(order) {
    const resultContainer = document.getElementById('tracking-result');
    if (!resultContainer) return;
    
    const statusSteps = getStatusSteps(order.tracking_status);
    const customer = getCurrentUser();
    const isOrderOwner = customer && (order.user_id === customer.id || isAdmin());
    
    resultContainer.innerHTML = `
        <div class="order-tracking-card">
            <div class="order-header">
                <div class="order-basic-info">
                    <h3>Order ${order.id}</h3>
                    <div class="order-meta">
                        <span class="order-date">Placed on ${formatDisplayDate(order.created_at)}</span>
                        <span class="order-amount">Total: ${formatCurrency(order.total)}</span>
                    </div>
                </div>
                <div class="order-status-badge status-${order.tracking_status.toLowerCase().replace(' ', '-')}">
                    ${order.tracking_status}
                </div>
            </div>
            
            <!-- Tracking Timeline -->
            <div class="tracking-timeline">
                ${statusSteps.map((step, index) => `
                    <div class="tracking-step ${step.status}">
                        <div class="step-icon">${step.icon}</div>
                        <div class="step-content">
                            <div class="step-title">${step.title}</div>
                            <div class="step-description">${step.description}</div>
                            <div class="step-time">${step.time || ''}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <!-- Order Details -->
            <div class="order-details-grid">
                <div class="detail-section">
                    <h4>Delivery Information</h4>
                    <div class="detail-item">
                        <strong>Customer:</strong> ${order.delivery_info.full_name}
                    </div>
                    <div class="detail-item">
                        <strong>Contact:</strong> ${order.delivery_info.contact}
                    </div>
                    <div class="detail-item">
                        <strong>Address:</strong> ${order.delivery_info.sitio}, ${order.delivery_info.barangay}
                    </div>
                    <div class="detail-item">
                        <strong>Delivery Method:</strong> ${order.delivery_info.delivery_method}
                    </div>
                    ${order.delivery_info.delivery_method === 'Delivery' ? `
                        <div class="detail-item">
                            <strong>Shipping Fee:</strong> ${formatCurrency(order.shipping_fee)}
                        </div>
                    ` : ''}
                </div>
                
                <div class="detail-section">
                    <h4>Order Items</h4>
                    <div class="order-items-list">
                        ${order.items.map(item => `
                            <div class="order-item">
                                <div class="item-name">${item.name} × ${item.qty}</div>
                                <div class="item-price">${formatCurrency(item.price * item.qty)}</div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="order-totals">
                        <div class="total-row">
                            <span>Subtotal:</span>
                            <span>${formatCurrency(order.subtotal)}</span>
                        </div>
                        ${order.shipping_fee > 0 ? `
                            <div class="total-row">
                                <span>Shipping:</span>
                                <span>${formatCurrency(order.shipping_fee)}</span>
                            </div>
                        ` : ''}
                        <div class="total-row total">
                            <span><strong>Total:</strong></span>
                            <span><strong>${formatCurrency(order.total)}</strong></span>
                        </div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>Payment Information</h4>
                    <div class="detail-item">
                        <strong>Payment Method:</strong> ${order.payment_method}
                    </div>
                    <div class="detail-item">
                        <strong>Payment Status:</strong> 
                        <span class="payment-status payment-${order.payment_status.toLowerCase()}">
                            ${order.payment_status}
                        </span>
                    </div>
                    ${order.payment_method === 'COD' && order.tracking_status === 'Delivered' ? `
                        <div class="detail-item">
                            <strong>Payment Due:</strong> ${formatCurrency(order.total)} upon delivery
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <!-- Action Buttons -->
            <div class="tracking-actions">
                ${isOrderOwner ? `
                    <button class="btn btn-outline" onclick="printOrderReceipt('${order.id}')">
                        📄 Print Receipt
                    </button>
                    ${order.tracking_status !== 'Delivered' ? `
                        <button class="btn btn-primary" onclick="contactAboutOrder('${order.id}')">
                            📞 Contact About Order
                        </button>
                    ` : `
                        <button class="btn btn-primary" onclick="reorderItems('${order.id}')">
                            🔄 Reorder Items
                        </button>
                    `}
                ` : ''}
                <button class="btn btn-secondary" onclick="clearTrackingResult()">
                    Track Another Order
                </button>
            </div>
        </div>
    `;
}

/**
 * Get status steps for tracking timeline
 */
function getStatusSteps(currentStatus) {
    const allSteps = [
        {
            status: 'completed',
            title: 'Order Placed',
            description: 'Your order has been received',
            icon: '📝'
        },
        {
            status: 'completed',
            title: 'Payment Confirmed',
            description: 'Payment has been processed',
            icon: '💰'
        },
        {
            status: 'current',
            title: 'Preparing Order',
            description: 'Our bakers are preparing your items',
            icon: '👨‍🍳'
        },
        {
            status: 'pending',
            title: 'Out for Delivery',
            description: 'Your order is on the way',
            icon: '🚚'
        },
        {
            status: 'pending',
            title: 'Delivered',
            description: 'Order has been delivered',
            icon: '✅'
        }
    ];
    
    const statusOrder = ['To Pay', 'To Prepare', 'Out for Delivery', 'Delivered'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    
    // Update step statuses based on current order status
    return allSteps.map((step, index) => {
        if (index <= currentIndex + 1) {
            return { ...step, status: 'completed' };
        } else if (index === currentIndex + 2) {
            return { ...step, status: 'current' };
        } else {
            return { ...step, status: 'pending' };
        }
    });
}

/**
 * Load recent orders for logged-in users
 */
function loadRecentOrdersForTracking() {
    const user = getCurrentUser();
    const recentSection = document.getElementById('recent-orders-section');
    const ordersList = document.getElementById('recent-orders-list');
    
    if (!user || !recentSection || !ordersList) return;
    
    const orders = getUserOrderHistory(user.id).slice(0, 5); // Last 5 orders
    
    if (orders.length === 0) {
        ordersList.innerHTML = `
            <div class="no-orders-message">
                <div class="no-orders-icon">📦</div>
                <h4>No orders yet</h4>
                <p>You haven't placed any orders with Bakerist.</p>
                <a href="menu.html" class="btn btn-primary">Start Shopping</a>
            </div>
        `;
        return;
    }
    
    ordersList.innerHTML = orders.map(order => `
        <div class="recent-order-card">
            <div class="recent-order-info">
                <div class="order-number">
                    <strong>${order.id}</strong>
                    <span class="order-date">${formatDisplayDate(order.created_at)}</span>
                </div>
                <div class="order-summary">
                    ${order.items.slice(0, 2).map(item => `${item.name} (${item.qty})`).join(', ')}
                    ${order.items.length > 2 ? ` and ${order.items.length - 2} more items` : ''}
                </div>
            </div>
            <div class="recent-order-actions">
                <div class="order-status status-${order.tracking_status.toLowerCase().replace(' ', '-')}">
                    ${order.tracking_status}
                </div>
                <button class="btn btn-sm btn-outline" onclick="trackOrder('${order.id}')">
                    Track Order
                </button>
            </div>
        </div>
    `).join('');
    
    recentSection.classList.remove('hidden');
}

/**
 * Clear lookup form
 */
function clearLookupForm() {
    const form = document.getElementById('order-lookup-form');
    const result = document.getElementById('tracking-result');
    
    if (form) form.reset();
    if (result) result.classList.add('hidden');
}

/**
 * Clear tracking result
 */
function clearTrackingResult() {
    const result = document.getElementById('tracking-result');
    const form = document.getElementById('order-lookup-form');
    
    if (result) result.classList.add('hidden');
    if (form) form.reset();
}

/**
 * Print order receipt
 */
function printOrderReceipt(orderId) {
    const orders = JSON.parse(localStorage.getItem('bakerist_orders') || '[]');
    const order = orders.find(o => o.id === orderId);
    
    if (!order) {
        showToast('Order not found', 'error');
        return;
    }
    
    // Create printable receipt
    const receiptWindow = window.open('', '_blank');
    receiptWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Receipt - ${order.id}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .receipt-header { text-align: center; margin-bottom: 20px; }
                .receipt-info { margin-bottom: 20px; }
                .receipt-items { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                .receipt-items th, .receipt-items td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
                .receipt-totals { float: right; text-align: right; }
                .thank-you { text-align: center; margin-top: 30px; font-style: italic; }
            </style>
        </head>
        <body>
            <div class="receipt-header">
                <h1>BAKERIST — Mabini Bakery</h1>
                <p>Fresh Baked Goods</p>
                <h2>ORDER RECEIPT</h2>
            </div>
            
            <div class="receipt-info">
                <p><strong>Order Number:</strong> ${order.id}</p>
                <p><strong>Date:</strong> ${formatDisplayDate(order.created_at)}</p>
                <p><strong>Customer:</strong> ${order.delivery_info.full_name}</p>
                <p><strong>Status:</strong> ${order.tracking_status}</p>
            </div>
            
            <table class="receipt-items">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${order.items.map(item => `
                        <tr>
                            <td>${item.name}</td>
                            <td>${item.qty}</td>
                            <td>${formatCurrency(item.price)}</td>
                            <td>${formatCurrency(item.price * item.qty)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="receipt-totals">
                <p><strong>Subtotal:</strong> ${formatCurrency(order.subtotal)}</p>
                ${order.shipping_fee > 0 ? `<p><strong>Shipping:</strong> ${formatCurrency(order.shipping_fee)}</p>` : ''}
                <p><strong>Total:</strong> ${formatCurrency(order.total)}</p>
                <p><strong>Payment Method:</strong> ${order.payment_method}</p>
                <p><strong>Payment Status:</strong> ${order.payment_status}</p>
            </div>
            
            <div class="thank-you">
                <p>Thank you for choosing Bakerist!</p>
                <p>We hope you enjoy your baked goods!</p>
            </div>
        </body>
        </html>
    `);
    
    receiptWindow.document.close();
    receiptWindow.print();
}

/**
 * Contact about order
 */
function contactAboutOrder(orderId) {
    showToast(`Contacting support about order ${orderId}...`, 'info');
    // In a real implementation, this would open a contact form or chat
}

/**
 * Reorder items from previous order
 */
function reorderItems(orderId) {
    const orders = JSON.parse(localStorage.getItem('bakerist_orders') || '[]');
    const order = orders.find(o => o.id === orderId);
    
    if (!order) {
        showToast('Order not found', 'error');
        return;
    }
    
    // Add all items to cart
    order.items.forEach(item => {
        if (typeof addToCart === 'function') {
            addToCart(item.product_id, item.qty);
        }
    });
    
    showToast(`Added ${order.items.length} items to cart from order ${orderId}`, 'success');
    
    // Redirect to cart after a delay
    setTimeout(() => {
        window.location.href = 'cart.html';
    }, 1500);
}

// Make functions available globally
window.trackOrder = trackOrder;
window.clearLookupForm = clearLookupForm;
window.clearTrackingResult = clearTrackingResult;
window.printOrderReceipt = printOrderReceipt;
window.contactAboutOrder = contactAboutOrder;
window.reorderItems = reorderItems;
window.loadRecentOrdersForTracking = loadRecentOrdersForTracking;