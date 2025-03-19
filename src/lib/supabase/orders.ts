import { supabase } from './client';
import { generateOTP } from '@/lib/utils/helpers';

// Order types
export interface OrderItem {
  id?: string;
  order_id?: string;
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface OrderData {
  user_id: string | null;
  order_type: 'pickup';  // Only pickup is available
  delivery_address: null;  // No delivery address needed
  scheduled_time: string;
  payment_method: 'card' | 'cash';
  item_total: number;
  gst: number;
  platform_fee: number;
  delivery_charge: number;
  final_total: number;
  order_items: OrderItem[];
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string | null;
  payment_id?: string;
  payment_status?: 'pending' | 'completed' | 'failed';
}

/**
 * Create a new order in the database
 */
export async function createOrder(orderData: OrderData) {
  try {
    // Generate a unique OTP for the order
    const otp = generateOTP();
    
    // Set initial payment status based on payment method
    const paymentStatus = orderData.payment_method === 'cash' ? 'completed' : 'pending';
    
    // Create the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: orderData.user_id,
        order_type: orderData.order_type,
        delivery_address: null,  // Always null since we only support pickup
        scheduled_time: orderData.scheduled_time,
        payment_method: orderData.payment_method,
        item_total: orderData.item_total,
        gst: orderData.gst,
        platform_fee: orderData.platform_fee,
        delivery_charge: 0,  // Always 0 since we only support pickup
        final_total: orderData.final_total,
        customer_name: orderData.customer_name,
        customer_phone: orderData.customer_phone,
        customer_email: orderData.customer_email,
        status: paymentStatus === 'completed' ? 'pending' : 'awaiting_payment',
        payment_status: paymentStatus,
        payment_id: orderData.payment_id || null,
        otp
      })
      .select('id')
      .single();

    if (orderError) throw orderError;
    
    // Add order items
    const orderItems = orderData.order_items.map(item => ({
      order_id: order.id,
      menu_item_id: item.menu_item_id,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    }));
    
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;
    
    return { orderId: order.id, otp };
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

/**
 * Update order payment status
 */
export async function updateOrderPayment(orderId: string, paymentId: string, paymentStatus: 'completed' | 'failed') {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ 
        payment_id: paymentId,
        payment_status: paymentStatus,
        status: paymentStatus === 'completed' ? 'pending' : 'cancelled'
      })
      .eq('id', orderId);

    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }
}

/**
 * Get orders for a specific user
 */
export async function getUserOrders(userId: string) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error fetching user orders:', error);
    throw error;
  }
}

/**
 * Get a specific order by ID
 */
export async function getOrderById(orderId: string) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*)
      `)
      .eq('id', orderId)
      .single();

    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error fetching order:', error);
    throw error;
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(orderId: string, status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'awaiting_payment') {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
}

/**
 * Get order statistics for the past week
 */
export async function getOrderStatistics() {
  // Get orders from the last 7 days
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);
  
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .gte('created_at', startDate.toISOString());
  
  if (error) throw error;
  
  // Calculate statistics manually
  const stats = {
    total: data.length,
    pending: data.filter(order => order.status === 'pending').length,
    confirmed: data.filter(order => order.status === 'confirmed').length,
    preparing: data.filter(order => order.status === 'preparing').length,
    ready: data.filter(order => order.status === 'ready').length,
    out_for_delivery: data.filter(order => order.status === 'out_for_delivery').length,
    delivered: data.filter(order => order.status === 'delivered').length,
    cancelled: data.filter(order => order.status === 'cancelled').length,
    revenue: data.reduce((sum, order) => sum + order.final_total, 0)
  };
  
  return stats;
} 