'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { updateOrderStatus } from '@/lib/supabase/orders';
import { formatPrice, formatDate, formatTime } from '@/lib/utils/helpers';
import { getOrderFeedback, getItemsFeedback } from '@/lib/supabase/feedback';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  menu_item_id: string;
}

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  created_at: string;
  status: string;
  order_type: 'pickup' | 'delivery';
  delivery_address: string | null;
  scheduled_time: string;
  payment_method: 'card' | 'cash';
  payment_id?: string;
  payment_status?: string;
  item_total: number;
  gst: number;
  platform_fee: number;
  delivery_charge: number;
  final_total: number;
  otp: string;
  order_items: OrderItem[];
}

interface OrderWithFeedback extends Order {
  feedback?: {
    rating: number;
    comment?: string;
  } | null;
  itemFeedback?: Array<{
    item_name: string;
    rating: number;
    comment?: string;
  }> | null;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderWithFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithFeedback | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('orders')
        .select('*, order_items(*)');
      
      if (sortBy === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: true });
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      // Format orders and fetch feedback data
      const formattedOrders = await Promise.all((data || []).map(async (order) => {
        // Get order feedback
        let orderFeedback = null;
        try {
          orderFeedback = await getOrderFeedback(order.id);
        } catch (err) {
          console.error(`Error fetching feedback for order ${order.id}:`, err);
        }
        
        // Get item feedback
        let itemsFeedbackData = null;
        try {
          const itemsFeedbackRaw = await getItemsFeedback(order.id);
          if (itemsFeedbackRaw && itemsFeedbackRaw.length > 0) {
            itemsFeedbackData = itemsFeedbackRaw.map(feedback => {
              // Find the item name from order_items
              const item = order.order_items.find(item => item.id === feedback.order_item_id);
              return {
                item_name: item ? item.name : 'Unknown Item',
                rating: feedback.rating,
                comment: feedback.comment
              };
            });
          }
        } catch (err) {
          console.error(`Error fetching item feedback for order ${order.id}:`, err);
        }
        
        return {
          ...order,
          feedback: orderFeedback,
          itemFeedback: itemsFeedbackData
        };
      }));
      
      setOrders(formattedOrders);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      setError(error.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [sortBy]);

  useEffect(() => {
    fetchOrders();
    
    // Set up real-time subscription for new orders
    const subscription = supabase
      .channel('orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('Order change received:', payload);
          // Refresh orders when there's any change
          fetchOrders();
        }
      )
      .subscribe();

    // Cleanup subscription on component unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [fetchOrders]);

  // Filter orders by status
  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') {
      return ['pending', 'confirmed', 'preparing', 'ready'].includes(order.status);
    }
    return order.status === statusFilter;
  });

  // Handle status update
  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingStatus(true);
      await updateOrderStatus(orderId, newStatus);
      
      // Update local state
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (err: any) {
      console.error('Error updating order status:', err);
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Get the next status in the flow
  const getNextStatus = (currentStatus: string) => {
    const statusFlow = {
      'pending': 'confirmed',
      'confirmed': 'preparing',
      'preparing': 'ready',
      'ready': 'delivered'
    };
    return statusFlow[currentStatus as keyof typeof statusFlow];
  };

  // Quick status update
  const handleQuickStatusUpdate = async (e: React.MouseEvent, orderId: string, currentStatus: string) => {
    e.stopPropagation(); // Prevent opening the modal
    const nextStatus = getNextStatus(currentStatus);
    if (nextStatus) {
      await handleStatusUpdate(orderId, nextStatus);
    }
  };

  // Helper function to render stars based on rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Order Management</h1>
        <p className="text-gray-600">Manage your restaurant orders</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Status
            </label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="all">All Orders</option>
              <option value="active">Active Orders</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-800"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          {error}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">No orders found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order Info
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Feedback
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr 
                  key={order.id} 
                  onClick={() => {
                    setSelectedOrder(order);
                    setModalOpen(true);
                  }} 
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">#{order.otp}</span>
                      <span className="text-sm text-gray-500">{formatDate(order.created_at)}</span>
                      <span className="text-sm text-gray-500">{formatPrice(order.final_total)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{order.customer_name}</div>
                    <div className="text-sm text-gray-500">{order.customer_phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('_', ' ')}
                      </span>
                      {getNextStatus(order.status) && !['delivered', 'cancelled'].includes(order.status) && (
                        <button
                          onClick={(e) => handleQuickStatusUpdate(e, order.id, order.status)}
                          disabled={updatingStatus}
                          className={`px-2 py-1 text-xs font-medium rounded-full bg-black text-white hover:bg-gray-800 transition-colors ${
                            updatingStatus ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          → {getNextStatus(order.status)?.charAt(0).toUpperCase() + getNextStatus(order.status)?.slice(1)}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {order.feedback ? (
                      <div>
                        {renderStars(order.feedback.rating)}
                        {order.feedback.comment && (
                          <p className="text-xs text-gray-500 mt-1 truncate max-w-[150px]">
                            "{order.feedback.comment}"
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">No feedback</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Detail Modal */}
      {modalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Order #{selectedOrder.otp}</h3>
                <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="px-6 py-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Customer Info</h4>
                  <p className="mt-1">{selectedOrder.customer_name}</p>
                  <p>{selectedOrder.customer_phone}</p>
                  {selectedOrder.customer_email && <p>{selectedOrder.customer_email}</p>}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Order Info</h4>
                  <p className="mt-1">Date: {formatDate(selectedOrder.created_at)}</p>
                  <p>Time: {formatTime(selectedOrder.created_at)}</p>
                  <p>Type: {selectedOrder.order_type === 'pickup' ? 'Pickup' : 'Delivery'}</p>
                  {selectedOrder.scheduled_time && <p>Scheduled: {selectedOrder.scheduled_time === '' ? 'ASAP' : selectedOrder.scheduled_time}</p>}
                </div>
              </div>
              
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Status</h4>
                <div className="flex flex-wrap gap-2">
                  {['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'].map((status) => (
                    <button
                      key={status}
                      onClick={() => !updatingStatus && handleStatusUpdate(selectedOrder.id, status)}
                      disabled={updatingStatus || selectedOrder.status === status}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        selectedOrder.status === status 
                          ? 'bg-black text-white' 
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      } ${updatingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Items</h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                        <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                        <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedOrder.order_items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">{item.quantity}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">{formatPrice(item.price * item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td className="px-4 py-2 text-sm text-gray-500" colSpan={2}>Subtotal</td>
                        <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatPrice(selectedOrder.item_total)}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm text-gray-500" colSpan={2}>GST</td>
                        <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatPrice(selectedOrder.gst)}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 text-sm text-gray-500" colSpan={2}>Platform Fee</td>
                        <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatPrice(selectedOrder.platform_fee)}</td>
                      </tr>
                      {selectedOrder.delivery_charge > 0 && (
                        <tr>
                          <td className="px-4 py-2 text-sm text-gray-500" colSpan={2}>Delivery Fee</td>
                          <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatPrice(selectedOrder.delivery_charge)}</td>
                        </tr>
                      )}
                      <tr className="font-bold">
                        <td className="px-4 py-2 text-sm text-gray-900" colSpan={2}>Total</td>
                        <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatPrice(selectedOrder.final_total)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
                          
              {/* Payment Info */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Payment</h4>
                <p>Method: {selectedOrder.payment_method === 'card' ? 'Card' : 'Cash'}</p>
                {selectedOrder.payment_id && <p>Payment ID: {selectedOrder.payment_id}</p>}
                {selectedOrder.payment_status && <p>Status: {selectedOrder.payment_status}</p>}
              </div>

              {/* Feedback Section */}
              {selectedOrder.feedback && (
                <div className="pt-4 border-t">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Customer Feedback</h3>
                  <div className="flex items-center mb-2">
                    <span className="font-medium mr-2">Overall Rating:</span>
                    {renderStars(selectedOrder.feedback.rating)}
                  </div>
                  {selectedOrder.feedback.comment && (
                    <div className="mb-4">
                      <span className="font-medium">Comment:</span>
                      <p className="mt-1 text-gray-600 italic">"{selectedOrder.feedback.comment}"</p>
                    </div>
                  )}
                  
                  {selectedOrder.itemFeedback && selectedOrder.itemFeedback.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-800 mb-2">Item Ratings:</h4>
                      <div className="space-y-3">
                        {selectedOrder.itemFeedback.map((feedback, index) => (
                          <div key={index} className="border-t pt-2">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{feedback.item_name}</span>
                              {renderStars(feedback.rating)}
                            </div>
                            {feedback.comment && (
                              <p className="text-sm text-gray-600 italic mt-1">"{feedback.comment}"</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 flex justify-end">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 