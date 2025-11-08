// admin.js - Admin dashboard functionality for BAKERIST

// Admin dashboard state
let adminState = {
    currentView: 'overview',
    orders: [],
    products: [],
    users: [],
    filteredOrders: [],
    searchTerm: '',
    filters: {
        status: 'all',
        dateRange: 'all',
        paymentStatus: 'all'
    }
};

/**
 * Initialize admin dashboard
 */
function initializeAdminDashboard() {
    if (!isAdmin() && !hasPermission(getCurrentUser(), 'view_orders')) {
        window.location.href = 'index.html';
        return;
    }

    loadAdminData();
    setupEventListeners();
    updateAdminUI();
    showView('overview');
}

/**
 * Load all admin data from localStorage
 */
function loadAdminData() {
    try {
        adminState.orders = JSON.parse(localStorage.getItem('bakerist_orders') || '[]');
        adminState.products = JSON.parse(localStorage.getItem('bakerist_products') || '[]');
        adminState.users = JSON.parse(localStorage.getItem('bakerist_users') || '[]');
        adminState.filteredOrders = [...adminState.orders];
        
        console.log('📊 Admin data loaded:', {
            orders: adminState.orders.length,
            products: adminState.products.length,
            users: adminState.users.length
        });
        
    } catch (error) {
        console.error('Error loading admin data:', error);
        showToast('Error loading dashboard data', 'error');
    }
}

/**
 * Setup admin event listeners
 */
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.admin-nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const view = e.target.dataset.view;
            showView(view);
        });
    });

    // Order search
    const searchInput = document.getElementById('order-search');
    if (searchInput) {
        searchInput.addEventListener('input', debounce((e) => {
            adminState.searchTerm = e.target.value;
            filterOrders();
        }, 300));
    }

    // Order filters
    const statusFilter = document.getElementById('status-filter');
    const dateFilter = document.getElementById('date-filter');
    const paymentFilter = document.getElementById('payment-filter');

    if (statusFilter) {
        statusFilter.addEventListener('change', (e) => {
            adminState.filters.status = e.target.value;
            filterOrders();
        });
    }

    if (dateFilter) {
        dateFilter.addEventListener('change', (e) => {
            adminState.filters.dateRange = e.target.value;
            filterOrders();
        });
    }

    if (paymentFilter) {
        paymentFilter.addEventListener('change', (e) => {
            adminState.filters.paymentStatus = e.target.value;
            filterOrders();
        });
    }

    // Export buttons
    const exportOrdersBtn = document.getElementById('export-orders');
    if (exportOrdersBtn) {
        exportOrdersBtn.addEventListener('click', exportOrdersCSV);
    }

    const exportProductsBtn = document.getElementById('export-products');
    if (exportProductsBtn) {
        exportProductsBtn.addEventListener('click', exportProductsCSV);
    }
}

/**
 * Show specific admin view
 */
function showView(viewName) {
    // Hide all views
    document.querySelectorAll('.admin-view').forEach(view => {
        view.classList.remove('active');
    });

    // Remove active class from all nav links
    document.querySelectorAll('.admin-nav-link').forEach(link => {
        link.classList.remove('active');
    });

    // Show selected view
    const targetView = document.getElementById(`${viewName}-view`);
    const targetLink = document.querySelector(`[data-view="${viewName}"]`);

    if (targetView && targetLink) {
        targetView.classList.add('active');
        targetLink.classList.add('active');
        adminState.currentView = viewName;

        // Load view-specific data
        switch(viewName) {
            case 'overview':
                loadOverview();
                break;
            case 'orders':
                loadOrdersView();
                break;
            case 'products':
                loadProductsView();
                break;
            case 'customers':
                loadCustomersView();
                break;
            case 'staff':
                loadStaffView();
                break;
            case 'inventory':
                loadInventoryView();
                break;
        }
    }
}

/**
 * Load overview dashboard
 */
function loadOverview() {
    const today = new Date().toISOString().split('T')[0];
    
    // Calculate metrics
    const metrics = {
        totalOrders: adminState.orders.length,
        todayOrders: adminState.orders.filter(order => 
            order.created_at.split('T')[0] === today
        ).length,
        pendingOrders: adminState.orders.filter(order => 
            order.tracking_status === 'To Prepare'
        ).length,
        totalRevenue: adminState.orders.reduce((sum, order) => sum + order.total, 0),
        todayRevenue: adminState.orders.filter(order => 
            order.created_at.split('T')[0] === today
        ).reduce((sum, order) => sum + order.total, 0),
        lowStockProducts: adminState.products.filter(product => 
            product.stock < 10 && product.available
        ).length,
        totalCustomers: adminState.users.filter(user => 
            user.role === 'customer'
        ).length
    };

    // Update metrics display
    document.getElementById('total-orders').textContent = metrics.totalOrders;
    document.getElementById('today-orders').textContent = metrics.todayOrders;
    document.getElementById('pending-orders').textContent = metrics.pendingOrders;
    document.getElementById('total-revenue').textContent = formatCurrency(metrics.totalRevenue);
    document.getElementById('today-revenue').textContent = formatCurrency(metrics.todayRevenue);
    document.getElementById('low-stock').textContent = metrics.lowStockProducts;
    document.getElementById('total-customers').textContent = metrics.totalCustomers;

    // Load recent orders
    loadRecentOrders();
    
    // Load low stock alerts
    loadLowStockAlerts();
}

/**
 * Load recent orders for overview
 */
function loadRecentOrders() {
    const recentOrders = adminState.orders
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);

    const container = document.getElementById('recent-orders');
    if (!container) return;

    if (recentOrders.length === 0) {
        container.innerHTML = '<p class="text-muted">No recent orders</p>';
        return;
    }

    container.innerHTML = recentOrders.map(order => `
        <div class="recent-order-item">
            <div class="order-info">
                <strong>${order.id}</strong>
                <span class="customer-name">${order.delivery_info.full_name}</span>
            </div>
            <div class="order-meta">
                <span class="amount">${formatCurrency(order.total)}</span>
                <span class="status status-${order.tracking_status.toLowerCase().replace(' ', '-')}">
                    ${order.tracking_status}
                </span>
            </div>
        </div>
    `).join('');
}

/**
 * Load low stock alerts
 */
function loadLowStockAlerts() {
    const lowStockProducts = adminState.products
        .filter(product => product.stock < 10 && product.available)
        .slice(0, 5);

    const container = document.getElementById('low-stock-alerts');
    if (!container) return;

    if (lowStockProducts.length === 0) {
        container.innerHTML = '<p class="text-muted">No low stock alerts</p>';
        return;
    }

    container.innerHTML = lowStockProducts.map(product => `
        <div class="stock-alert-item">
            <div class="product-info">
                <strong>${product.name}</strong>
                <span class="stock-level ${product.stock < 5 ? 'critical' : 'low'}">
                    ${product.stock} left
                </span>
            </div>
            <button class="btn btn-sm btn-outline" onclick="editProduct('${product.id}')">
                Restock
            </button>
        </div>
    `).join('');
}

/**
 * Load orders view with filtering
 */
function loadOrdersView() {
    filterOrders();
}

/**
 * Filter orders based on current filters
 */
function filterOrders() {
    let filtered = [...adminState.orders];

    // Apply search filter
    if (adminState.searchTerm) {
        filtered = filtered.filter(order => 
            order.id.toLowerCase().includes(adminState.searchTerm.toLowerCase()) ||
            order.delivery_info.full_name.toLowerCase().includes(adminState.searchTerm.toLowerCase()) ||
            order.delivery_info.contact.toLowerCase().includes(adminState.searchTerm.toLowerCase())
        );
    }

    // Apply status filter
    if (adminState.filters.status !== 'all') {
        filtered = filtered.filter(order => order.tracking_status === adminState.filters.status);
    }

    // Apply payment status filter
    if (adminState.filters.paymentStatus !== 'all') {
        filtered = filtered.filter(order => order.payment_status === adminState.filters.paymentStatus);
    }

    // Apply date filter
    if (adminState.filters.dateRange !== 'all') {
        const now = new Date();
        let startDate;

        switch(adminState.filters.dateRange) {
            case 'today':
                startDate = new Date(now.setHours(0, 0, 0, 0));
                break;
            case 'week':
                startDate = new Date(now.setDate(now.getDate() - 7));
                break;
            case 'month':
                startDate = new Date(now.setMonth(now.getMonth() - 1));
                break;
        }

        filtered = filtered.filter(order => new Date(order.created_at) >= startDate);
    }

    adminState.filteredOrders = filtered;
    renderOrdersTable();
}

/**
 * Render orders table
 */
function renderOrdersTable() {
    const container = document.getElementById('orders-table');
    if (!container) return;

    if (adminState.filteredOrders.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div style="font-size: 3rem; margin-bottom: var(--space-md);">📦</div>
                <h3>No orders found</h3>
                <p>Try adjusting your search or filters</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="table-responsive">
            <table class="orders-table">
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Date</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Payment</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${adminState.filteredOrders.map(order => `
                        <tr>
                            <td>
                                <strong>${order.id}</strong>
                                <div class="text-muted">${order.delivery_info.delivery_method}</div>
                            </td>
                            <td>
                                <div class="customer-info">
                                    <strong>${order.delivery_info.full_name}</strong>
                                    <div class="text-muted">${order.delivery_info.contact}</div>
                                    <div class="text-muted">${order.delivery_info.barangay}</div>
                                </div>
                            </td>
                            <td>${formatDisplayDate(order.created_at)}</td>
                            <td>
                                <div class="order-items-preview">
                                    ${order.items.slice(0, 2).map(item => `
                                        <div class="item-preview">${item.name} × ${item.qty}</div>
                                    `).join('')}
                                    ${order.items.length > 2 ? `<div class="text-muted">+${order.items.length - 2} more</div>` : ''}
                                </div>
                            </td>
                            <td><strong>${formatCurrency(order.total)}</strong></td>
                            <td>
                                <select class="status-select" data-order-id="${order.id}" onchange="updateOrderStatus('${order.id}', this.value)">
                                    <option value="To Pay" ${order.tracking_status === 'To Pay' ? 'selected' : ''}>To Pay</option>
                                    <option value="To Prepare" ${order.tracking_status === 'To Prepare' ? 'selected' : ''}>To Prepare</option>
                                    <option value="Out for Delivery" ${order.tracking_status === 'Out for Delivery' ? 'selected' : ''}>Out for Delivery</option>
                                    <option value="Delivered" ${order.tracking_status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                                </select>
                            </td>
                            <td>
                                <span class="payment-status payment-${order.payment_status.toLowerCase()}">
                                    ${order.payment_status}
                                </span>
                                ${order.payment_method ? `<div class="text-muted">${order.payment_method}</div>` : ''}
                            </td>
                            <td>
                                <div class="action-buttons">
                                    <button class="btn btn-sm btn-outline" onclick="viewOrderDetails('${order.id}')">
                                        View
                                    </button>
                                    ${hasPermission(getCurrentUser(), 'manage_inventory') ? `
                                        <button class="btn btn-sm btn-secondary" onclick="markOrderComplete('${order.id}')">
                                            Complete
                                        </button>
                                    ` : ''}
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

/**
 * Update order status
 */
function updateOrderStatus(orderId, newStatus) {
    const orders = JSON.parse(localStorage.getItem('bakerist_orders') || '[]');
    const orderIndex = orders.findIndex(order => order.id === orderId);
    
    if (orderIndex !== -1) {
        orders[orderIndex].tracking_status = newStatus;
        
        // If marked as delivered and payment was COD, mark as paid
        if (newStatus === 'Delivered' && orders[orderIndex].payment_method === 'COD') {
            orders[orderIndex].payment_status = 'Paid';
        }
        
        localStorage.setItem('bakerist_orders', JSON.stringify(orders));
        loadAdminData();
        filterOrders();
        
        showToast(`Order ${orderId} status updated to ${newStatus}`, 'success');
    }
}

/**
 * View order details
 */
function viewOrderDetails(orderId) {
    const order = adminState.orders.find(o => o.id === orderId);
    if (!order) return;

    const modal = document.getElementById('order-details-modal');
    const modalContent = modal.querySelector('.modal-body');
    
    modalContent.innerHTML = `
        <div class="order-details-modal">
            <div class="order-header">
                <h3>Order ${order.id}</h3>
                <div class="order-meta">
                    <span class="order-date">${formatDisplayDate(order.created_at)}</span>
                    <span class="status status-${order.tracking_status.toLowerCase().replace(' ', '-')}">
                        ${order.tracking_status}
                    </span>
                </div>
            </div>

            <div class="details-grid">
                <div class="detail-section">
                    <h4>Customer Information</h4>
                    <div class="detail-item">
                        <strong>Name:</strong> ${order.delivery_info.full_name}
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
                </div>

                <div class="detail-section">
                    <h4>Order Summary</h4>
                    <div class="order-items-detailed">
                        ${order.items.map(item => `
                            <div class="order-item-detailed">
                                <div class="item-info">
                                    <strong>${item.name}</strong>
                                    <div class="item-options">
                                        ${item.options ? Object.entries(item.options).map(([key, value]) => 
                                            `<span class="option">${key}: ${value}</span>`
                                        ).join('') : ''}
                                    </div>
                                </div>
                                <div class="item-quantity">${item.qty} × ${formatCurrency(item.price)}</div>
                                <div class="item-total">${formatCurrency(item.qty * item.price)}</div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="order-totals">
                        <div class="total-row">
                            <span>Subtotal:</span>
                            <span>${formatCurrency(order.subtotal)}</span>
                        </div>
                        <div class="total-row">
                            <span>Shipping Fee:</span>
                            <span>${formatCurrency(order.shipping_fee)}</span>
                        </div>
                        <div class="total-row total">
                            <span><strong>Total:</strong></span>
                            <span><strong>${formatCurrency(order.total)}</strong></span>
                        </div>
                    </div>
                </div>

                <div class="detail-section">
                    <h4>Payment Information</h4>
                    <div class="detail-item">
                        <strong>Method:</strong> ${order.payment_method}
                    </div>
                    <div class="detail-item">
                        <strong>Status:</strong> 
                        <span class="payment-status payment-${order.payment_status.toLowerCase()}">
                            ${order.payment_status}
                        </span>
                    </div>
                </div>
            </div>

            <div class="modal-actions">
                <button class="btn btn-primary" onclick="printOrder('${order.id}')">
                    Print Receipt
                </button>
                <button class="btn btn-outline" onclick="closeModal('order-details-modal')">
                    Close
                </button>
            </div>
        </div>
    `;

    modal.classList.add('show');
}

/**
 * Load products management view
 */
function loadProductsView() {
    const container = document.getElementById('products-management');
    if (!container) return;

    container.innerHTML = `
        <div class="products-header">
            <h3>Product Management</h3>
            ${hasPermission(getCurrentUser(), 'manage_inventory') ? `
                <button class="btn btn-primary" onclick="showAddProductForm()">
                    Add New Product
                </button>
                
            ` : ''}
        </div>

        <div class="products-grid-admin">
            ${adminState.products.map(product => `
                <div class="product-card-admin">
                    <div class="product-image">
                        <img src="${product.image}" alt="${product.name}" onerror="this.src='/assets/images/placeholder.jpg'">
                        <div class="product-badges">
                            ${!product.available ? '<span class="badge out-of-stock">Disabled</span>' : ''}
                            ${product.stock < 5 ? '<span class="badge low-stock">Low Stock</span>' : ''}
                            ${product.stock >= 5 && product.stock < 10 ? '<span class="badge medium-stock">Limited</span>' : ''}
                        </div>
                    </div>
                    
                    <div class="product-info">
                        <h4>${product.name}</h4>
                        <p class="product-category">${product.category}</p>
                        <p class="product-description">${product.description}</p>
                        
                        <div class="product-meta">
                            <div class="product-price">${formatCurrency(product.price)}</div>
                            <div class="product-stock">
                                <strong>Stock:</strong> ${product.stock}
                            </div>
                        </div>

                        <div class="product-actions">
                            ${hasPermission(getCurrentUser(), 'manage_inventory') ? `
                                <button class="btn btn-sm btn-outline" onclick="editProduct('${product.id}')">
                                    Edit
                                </button>
                                <button class="btn btn-sm btn-secondary" onclick="toggleProductAvailability('${product.id}')">
                                    ${product.available ? 'Disable' : 'Enable'}
                                </button>
                                <button class="btn btn-sm btn-primary" onclick="showRestockForm('${product.id}')">
                                    Restock
                                </button>
                            ` : `
                                <button class="btn btn-sm btn-outline" onclick="editProduct('${product.id}')">
                                    View
                                </button>
                            `}
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

/**
 * Edit product
 */
function editProduct(productId) {
    const product = adminState.products.find(p => p.id === productId);
    if (!product) return;

    // For now, show a simple edit form
    const newPrice = prompt('Enter new price:', product.price);
    if (newPrice && !isNaN(newPrice)) {
        updateProductPrice(productId, parseFloat(newPrice));
    }
}

/**
 * Update product price
 */
function updateProductPrice(productId, newPrice) {
    const products = JSON.parse(localStorage.getItem('bakerist_products') || '[]');
    const productIndex = products.findIndex(p => p.id === productId);
    
    if (productIndex !== -1) {
        products[productIndex].price = newPrice;
        localStorage.setItem('bakerist_products', JSON.stringify(products));
        loadAdminData();
        loadProductsView();
        showToast('Product price updated successfully', 'success');
    }
}

/**
 * Toggle product availability
 */
function toggleProductAvailability(productId) {
    const products = JSON.parse(localStorage.getItem('bakerist_products') || '[]');
    const productIndex = products.findIndex(p => p.id === productId);
    
    if (productIndex !== -1) {
        products[productIndex].available = !products[productIndex].available;
        localStorage.setItem('bakerist_products', JSON.stringify(products));
        loadAdminData();
        loadProductsView();
        showToast(`Product ${products[productIndex].available ? 'enabled' : 'disabled'}`, 'success');
    }
}

/**
 * Load inventory view
 */
function loadInventoryView() {
    if (!hasPermission(getCurrentUser(), 'manage_inventory')) {
        document.getElementById('inventory-view').innerHTML = `
            <div class="empty-state">
                <h3>Access Denied</h3>
                <p>You don't have permission to manage inventory.</p>
            </div>
        `;
        return;
    }

    const lowStockProducts = adminState.products.filter(p => p.stock < 10 && p.available);
    const outOfStockProducts = adminState.products.filter(p => p.stock === 0 && p.available);
    
    const container = document.getElementById('inventory-management');
    if (!container) return;

    container.innerHTML = `
        <div class="inventory-summary">
            <div class="inventory-card critical">
                <h4>Out of Stock</h4>
                <div class="count">${outOfStockProducts.length}</div>
            </div>
            <div class="inventory-card warning">
                <h4>Low Stock</h4>
                <div class="count">${lowStockProducts.length}</div>
            </div>
            <div class="inventory-card info">
                <h4>Total Products</h4>
                <div class="count">${adminState.products.length}</div>
            </div>
        </div>

        <div class="inventory-actions">
            <h3>Quick Actions</h3>
            <div class="action-buttons">
                <button class="btn btn-primary" onclick="showBulkRestockForm()">
                    Bulk Restock
                </button>
                <button class="btn btn-secondary" onclick="generateInventoryReport()">
                    Generate Report
                </button>
            </div>
        </div>

        <div class="inventory-table-section">
            <h3>Inventory List</h3>
            <div class="table-responsive">
                <table class="inventory-table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Category</th>
                            <th>Current Stock</th>
                            <th>Status</th>
                            <th>Price</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${adminState.products.map(product => `
                            <tr class="${product.stock === 0 ? 'out-of-stock-row' : product.stock < 5 ? 'low-stock-row' : ''}">
                                <td>
                                    <strong>${product.name}</strong>
                                </td>
                                <td>${product.category}</td>
                                <td>
                                    <div class="stock-display">
                                        <span class="stock-number">${product.stock}</span>
                                        ${product.stock < 10 ? `
                                            <input type="number" 
                                                   class="stock-input" 
                                                   value="${product.stock}"
                                                   data-product-id="${product.id}"
                                                   onchange="updateStock('${product.id}', this.value)">
                                        ` : ''}
                                    </div>
                                </td>
                                <td>
                                    <span class="stock-status ${getStockStatusClass(product.stock)}">
                                        ${getStockStatusText(product.stock)}
                                    </span>
                                </td>
                                <td>${formatCurrency(product.price)}</td>
                                <td>
                                    <button class="btn btn-sm btn-primary" onclick="showRestockForm('${product.id}')">
                                        Restock
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

/**
 * Update product stock
 */
function updateStock(productId, newStock) {
    const products = JSON.parse(localStorage.getItem('bakerist_products') || '[]');
    const productIndex = products.findIndex(p => p.id === productId);
    
    if (productIndex !== -1) {
        products[productIndex].stock = parseInt(newStock) || 0;
        localStorage.setItem('bakerist_products', JSON.stringify(products));
        loadAdminData();
        showToast('Stock updated successfully', 'success');
    }
}

/**
 * Get stock status class
 */
function getStockStatusClass(stock) {
    if (stock === 0) return 'out-of-stock';
    if (stock < 5) return 'low-stock';
    if (stock < 10) return 'medium-stock';
    return 'in-stock';
}

/**
 * Get stock status text
 */
function getStockStatusText(stock) {
    if (stock === 0) return 'Out of Stock';
    if (stock < 5) return 'Very Low';
    if (stock < 10) return 'Low';
    return 'In Stock';
}

/**
 * Load staff management view
 */
function loadStaffView() {
    if (!isAdmin()) {
        document.getElementById('staff-view').innerHTML = `
            <div class="empty-state">
                <h3>Access Denied</h3>
                <p>Only administrators can manage staff accounts.</p>
            </div>
        `;
        return;
    }

    const staffAccounts = getStaffAccounts();
    const container = document.getElementById('staff-management');
    if (!container) return;

    container.innerHTML = `
        <div class="staff-header">
            <h3>Staff Management</h3>
            <button class="btn btn-primary" onclick="showAddStaffForm()">
                Add Staff Member
            </button>
        </div>

        <div class="staff-grid">
            ${staffAccounts.map(staff => `
                <div class="staff-card">
                    <div class="staff-info">
                        <h4>${staff.name}</h4>
                        <p class="staff-email">${staff.email}</p>
                        <div class="staff-meta">
                            <span class="staff-role ${staff.role}">${staff.role}</span>
                            <span class="staff-status ${staff.is_active ? 'active' : 'inactive'}">
                                ${staff.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        ${staff.department ? `<p class="staff-department">${staff.department}</p>` : ''}
                    </div>
                    
                    <div class="staff-actions">
                        <button class="btn btn-sm btn-outline" onclick="editStaff('${staff.id}')">
                            Edit
                        </button>
                        ${staff.role !== 'admin' ? `
                            <button class="btn btn-sm btn-secondary" onclick="toggleStaffStatus('${staff.id}')">
                                ${staff.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                        ` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

/**
 * Export orders to CSV
 */
function exportOrdersCSV() {
    const headers = ['Order ID', 'Customer Name', 'Contact', 'Barangay', 'Items', 'Subtotal', 'Shipping', 'Total', 'Status', 'Payment Method', 'Payment Status', 'Date'];
    
    const csvData = adminState.orders.map(order => ({
        'Order ID': order.id,
        'Customer Name': order.delivery_info.full_name,
        'Contact': order.delivery_info.contact,
        'Barangay': order.delivery_info.barangay,
        'Items': order.items.map(item => `${item.name} (${item.qty})`).join('; '),
        'Subtotal': order.subtotal,
        'Shipping': order.shipping_fee,
        'Total': order.total,
        'Status': order.tracking_status,
        'Payment Method': order.payment_method,
        'Payment Status': order.payment_status,
        'Date': order.created_at
    }));

    const csvContent = generateCSV(csvData, headers);
    downloadCSV(csvContent, `bakerist-orders-${new Date().toISOString().split('T')[0]}.csv`);
    showToast('Orders exported successfully', 'success');
}

/**
 * Export products to CSV
 */
function exportProductsCSV() {
    const headers = ['Product ID', 'Name', 'Category', 'Price', 'Stock', 'Available', 'Description'];
    
    const csvData = adminState.products.map(product => ({
        'Product ID': product.id,
        'Name': product.name,
        'Category': product.category,
        'Price': product.price,
        'Stock': product.stock,
        'Available': product.available ? 'Yes' : 'No',
        'Description': product.description
    }));

    const csvContent = generateCSV(csvData, headers);
    downloadCSV(csvContent, `bakerist-products-${new Date().toISOString().split('T')[0]}.csv`);
    showToast('Products exported successfully', 'success');
}

/**
 * Update admin UI based on permissions
 */
function updateAdminUI() {
    const user = getCurrentUser();
    if (!user) return;

    // Hide staff management if not admin
    if (!isAdmin()) {
        const staffNav = document.querySelector('[data-view="staff"]');
        if (staffNav) staffNav.style.display = 'none';
    }

    // Hide inventory management if no permission
    if (!hasPermission(user, 'manage_inventory')) {
        const inventoryNav = document.querySelector('[data-view="inventory"]');
        if (inventoryNav) inventoryNav.style.display = 'none';
    }
}

// Initialize admin dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeAdminDashboard();
});

// Utility functions for modals
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

function printOrder(orderId) {
    showToast('Print functionality would be implemented here', 'info');
}

// Placeholder functions for future implementation
function showAddProductForm() {
    showToast('Add product form would open here', 'info');
}

function showRestockForm(productId) {
    const amount = prompt('Enter restock amount:');
    if (amount && !isNaN(amount)) {
        updateStock(productId, parseInt(amount));
    }
}

function showAddStaffForm() {
    showToast('Add staff form would open here', 'info');
}

function editStaff(staffId) {
    showToast('Edit staff form would open here', 'info');
}

function toggleStaffStatus(staffId) {
    showToast('Staff status toggle would happen here', 'info');
}

function markOrderComplete(orderId) {
    updateOrderStatus(orderId, 'Delivered');
}

function showBulkRestockForm() {
    showToast('Bulk restock form would open here', 'info');
}

function generateInventoryReport() {
    showToast('Inventory report would be generated here', 'info');
}