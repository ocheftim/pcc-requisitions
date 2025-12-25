// Order Template Management System
// Save, load, and manage requisition orders

const STORAGE_KEY = 'toqueworks_requisition_orders';

export class OrderManager {
  constructor() {
    this.orders = this.loadAllOrders();
  }

  // Load all orders from localStorage
  loadAllOrders() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading orders:', error);
      return [];
    }
  }

  // Save all orders to localStorage
  saveAllOrders() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.orders));
      return true;
    } catch (error) {
      console.error('Error saving orders:', error);
      return false;
    }
  }

  // Create new order
  createOrder(orderData) {
    const order = {
      id: this.generateOrderId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft', // draft, submitted, approved, ordered, received
      ...orderData
    };
    
    this.orders.push(order);
    this.saveAllOrders();
    return order;
  }

  // Update existing order
  updateOrder(orderId, updates) {
    const index = this.orders.findIndex(o => o.id === orderId);
    if (index === -1) return null;

    this.orders[index] = {
      ...this.orders[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    this.saveAllOrders();
    return this.orders[index];
  }

  // Get order by ID
  getOrder(orderId) {
    return this.orders.find(o => o.id === orderId) || null;
  }

  // Get all orders
  getAllOrders() {
    return [...this.orders];
  }

  // Get orders by status
  getOrdersByStatus(status) {
    return this.orders.filter(o => o.status === status);
  }

  // Get orders by vendor
  getOrdersByVendor(vendor) {
    return this.orders.filter(o => o.vendor === vendor);
  }

  // Get orders by course
  getOrdersByCourse(courseCode) {
    return this.orders.filter(o => o.course === courseCode);
  }

  // Delete order
  deleteOrder(orderId) {
    const index = this.orders.findIndex(o => o.id === orderId);
    if (index === -1) return false;

    this.orders.splice(index, 1);
    this.saveAllOrders();
    return true;
  }

  // Generate unique order ID
  generateOrderId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `ORD-${timestamp}-${random}`;
  }

  // Calculate order totals
  calculateOrderTotal(items) {
    return items.reduce((sum, item) => {
      const itemTotal = item.quantity * item.price;
      return sum + itemTotal;
    }, 0);
  }

  // Get order statistics
  getStatistics() {
    const stats = {
      total: this.orders.length,
      byStatus: {},
      byVendor: {},
      totalValue: 0
    };

    this.orders.forEach(order => {
      // Count by status
      stats.byStatus[order.status] = (stats.byStatus[order.status] || 0) + 1;
      
      // Count by vendor
      stats.byVendor[order.vendor] = (stats.byVendor[order.vendor] || 0) + 1;
      
      // Sum total value
      if (order.total) {
        stats.totalValue += order.total;
      }
    });

    return stats;
  }

  // Export order to CSV
  exportToCSV(orderId) {
    const order = this.getOrder(orderId);
    if (!order) return null;

    let csv = 'Item Code,Description,Unit,Quantity,Price,Total\n';
    
    order.items.forEach(item => {
      const total = (item.quantity * item.price).toFixed(2);
      csv += `${item.code},"${item.name}",${item.unit},${item.quantity},${item.price},${total}\n`;
    });

    csv += `\n,,,,Subtotal,${order.subtotal.toFixed(2)}\n`;
    if (order.tax) csv += `,,,,Tax,${order.tax.toFixed(2)}\n`;
    csv += `,,,,Total,${order.total.toFixed(2)}\n`;

    return csv;
  }

  // Import orders (for backup/restore)
  importOrders(ordersData) {
    try {
      if (!Array.isArray(ordersData)) {
        throw new Error('Invalid orders data format');
      }
      
      this.orders = ordersData;
      this.saveAllOrders();
      return true;
    } catch (error) {
      console.error('Error importing orders:', error);
      return false;
    }
  }

  // Clear all orders (admin function)
  clearAllOrders() {
    this.orders = [];
    this.saveAllOrders();
  }
}

// Create singleton instance
export const orderManager = new OrderManager();

// Vendor configuration
export const vendorConfig = {
  sysco: {
    name: 'Sysco',
    email: 'orders@sysco.com',
    phone: '800-SYSCO-01',
    deliveryDays: ['Monday', 'Wednesday', 'Friday'],
    minimumOrder: 250
  },
  shamrock: {
    name: 'Shamrock Foods',
    email: 'orders@shamrockfoods.com',
    phone: '800-289-2345',
    deliveryDays: ['Tuesday', 'Thursday'],
    minimumOrder: 300
  },
  merit: {
    name: 'Merit',
    email: 'orders@meritfoods.com',
    phone: '888-MERIT-01',
    deliveryDays: ['Monday', 'Wednesday', 'Friday'],
    minimumOrder: 200
  },
  peddlers: {
    name: 'Peddlers',
    email: 'orders@peddlersproduce.com',
    phone: '866-733-3537',
    deliveryDays: ['Monday', 'Tuesday', 'Thursday'],
    minimumOrder: 150
  }
};

// Order status workflow
export const orderStatuses = {
  draft: { label: 'Draft', color: 'gray', next: 'submitted' },
  submitted: { label: 'Submitted', color: 'blue', next: 'approved' },
  approved: { label: 'Approved', color: 'green', next: 'ordered' },
  ordered: { label: 'Ordered', color: 'purple', next: 'received' },
  received: { label: 'Received', color: 'teal', next: null },
  cancelled: { label: 'Cancelled', color: 'red', next: null }
};
