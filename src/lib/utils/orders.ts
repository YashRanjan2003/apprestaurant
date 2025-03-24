interface StoredOrder {
  id: string;
  otp: string;
  customer_name: string;
  status: string;
  expiresAt: number;
}

const STORAGE_KEY = 'recentOrders';
const EXPIRY_HOURS = 24;

export function storeOrder(order: StoredOrder) {
  try {
    // Get existing orders
    const existingOrders = getStoredOrders();
    
    // Add expiry time if not set
    if (!order.expiresAt) {
      order.expiresAt = Date.now() + (EXPIRY_HOURS * 60 * 60 * 1000);
    }
    
    // Add new order at the beginning
    const updatedOrders = [order, ...existingOrders];
    
    // Store in localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));
    
    return true;
  } catch (error) {
    console.error('Error storing order:', error);
    return false;
  }
}

export function getStoredOrders(): StoredOrder[] {
  try {
    // Get orders from localStorage
    const ordersJson = localStorage.getItem(STORAGE_KEY);
    if (!ordersJson) return [];
    
    const orders: StoredOrder[] = JSON.parse(ordersJson);
    const now = Date.now();
    
    // Filter out expired orders
    const validOrders = orders.filter(order => order.expiresAt > now);
    
    // If some orders were expired, update localStorage
    if (validOrders.length !== orders.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(validOrders));
    }
    
    return validOrders;
  } catch (error) {
    console.error('Error getting stored orders:', error);
    return [];
  }
}

export function clearExpiredOrders() {
  const validOrders = getStoredOrders(); // This will automatically clear expired orders
  return validOrders.length;
} 