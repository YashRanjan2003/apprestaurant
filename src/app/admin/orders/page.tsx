'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { updateOrderStatus } from '@/lib/supabase/orders';
import { formatPrice, formatDate, formatTime, getOrderStatusInfo } from '@/lib/utils/helpers';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  menu_item_id: string;
}

interface Order {
  id: string;
  created_at: string;
  user_id: string | null;
  order_type: 'pickup' | 'delivery';
  delivery_address: string | null;
  scheduled_time: string;
  payment_method: 'card' | 'cash';
  item_total: number;
  gst: number;
  platform_fee: number;
  delivery_charge: number;
  final_total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
  otp: string;
  order_items: OrderItem[];
}

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Fetch orders
  useEffect(() => {
    async function fetchOrders() {
      try {
        setIsLoading(true);
        let query = supabase
          .from('orders')
          .select(`
            *,
            order_items(*)
          `);
        
        // Apply sorting
        if (sortBy === 'newest') {
          query = query.order('created_at', { ascending: false });
        } else if (sortBy === 'oldest') {
          query = query.order('created_at', { ascending: true });
        }
        
        const { data, error: fetchError } = await query;
        
        if (fetchError) throw fetchError;
        
        setOrders(data as Order[]);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching orders:', err);
        setError(err.message || 'Failed to load orders');
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrders();
  }, [sortBy]);

  // Filter orders by status
  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') {
      return ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(order.status);
    }
    return order.status === statusFilter;
  });

  // Handle status update
  const handleStatusUpdate = async (orderId: string, newStatus: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled') => {
    try {
      setUpdatingStatus(true);
      await updateOrderStatus(orderId, newStatus);
      
      // Update local state
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      
    } catch (err: any) {
      console.error('Error updating order status:', err);
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Order Management</h1>
        <p className="text-gray-600">Manage your restaurant orders</p>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-800"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {!isLoading && !error && (
        <>
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
                  <option value="out_for_delivery">Out for Delivery</option>
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

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
              <p className="mt-1 text-sm text-gray-500">
                No orders match your current filter criteria.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  {/* Order Header */}
                  <div
                    className="p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setActiveOrderId(activeOrderId === order.id ? null : order.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-medium">Order #{order.otp}</span>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              getOrderStatusInfo(order.status).color
                            } bg-opacity-10`}
                          >
                            {getOrderStatusInfo(order.status).text}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {formatDate(order.created_at)} at {formatTime(order.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatPrice(order.final_total)}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {order.order_type === 'pickup' ? 'Pickup' : 'Delivery'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Order Details (collapsible) */}
                  {activeOrderId === order.id && (
                    <div className="p-6 bg-gray-50 border-b">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Order Items */}
                        <div className="lg:col-span-2">
                          <h3 className="font-medium mb-3">Order Items</h3>
                          <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                                  <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {order.order_items.map((item) => (
                                  <tr key={item.id}>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-center">{item.quantity}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right">{formatPrice(item.price)}</td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right font-medium">{formatPrice(item.price * item.quantity)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Order Details & Price */}
                        <div className="space-y-6">
                          {/* Order Details */}
                          <div>
                            <h3 className="font-medium mb-3">Order Details</h3>
                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <strong className="text-gray-500">Order Type:</strong> 
                                  <span className="ml-1 font-medium">{order.order_type === 'pickup' ? 'Pickup' : 'Delivery'}</span>
                                </div>
                                <div>
                                  <strong className="text-gray-500">Payment Method:</strong> 
                                  <span className="ml-1 font-medium">{order.payment_method === 'card' ? 'Card Payment' : 'Cash on Delivery'}</span>
                                </div>
                                <div>
                                  <strong className="text-gray-500">Scheduled Time:</strong> 
                                  <span className="ml-1 font-medium">{formatTime(order.scheduled_time)}</span>
                                </div>
                                <div>
                                  <strong className="text-gray-500">Order ID:</strong> 
                                  <span className="ml-1 font-medium text-xs text-gray-600">{order.id}</span>
                                </div>
                                {order.order_type === 'delivery' && (
                                  <div className="sm:col-span-2">
                                    <strong className="text-gray-500">Delivery Address:</strong> 
                                    <div className="mt-1 text-gray-900 bg-gray-50 p-2 rounded">{order.delivery_address}</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Price Breakdown */}
                          <div>
                            <h3 className="font-medium mb-3">Price Breakdown</h3>
                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Item Total</span>
                                  <span className="font-medium">{formatPrice(order.item_total)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">GST (5%)</span>
                                  <span>{formatPrice(order.gst)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Platform Fee</span>
                                  <span>{formatPrice(order.platform_fee)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Delivery Charge</span>
                                  <span>{formatPrice(order.delivery_charge)}</span>
                                </div>
                                <div className="flex justify-between font-medium pt-2 border-t border-gray-200">
                                  <span>Total</span>
                                  <span>{formatPrice(order.final_total)}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Update Status */}
                          <div>
                            <h3 className="font-medium mb-3">Update Status</h3>
                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                              <div className="flex flex-wrap gap-2">
                                {['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'].map((status) => (
                                  <button
                                    key={status}
                                    disabled={order.status === status || updatingStatus}
                                    className={`px-3 py-1 text-xs rounded-full ${
                                      order.status === status
                                        ? 'bg-gray-700 text-white'
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                    }`}
                                    onClick={() => handleStatusUpdate(order.id, status as any)}
                                  >
                                    {getOrderStatusInfo(status).text}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
} 