'use client';

import { useState, useEffect } from 'react';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  menuItem: {
    name: string;
    price: number;
  };
}

interface Order {
  id: string;
  items: OrderItem[];
  itemTotal: number;
  gst: number;
  platformFee: number;
  deliveryCharge: number;
  finalTotal: number;
  orderType: 'PICKUP' | 'DELIVERY';
  deliveryAddress: string | null;
  scheduledTime: string;
  paymentMethod: 'CARD' | 'CASH';
  otp: string;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  createdAt: string;
}

const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PREPARING: 'bg-purple-100 text-purple-800',
  READY: 'bg-indigo-100 text-indigo-800',
  OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const STATUS_LABELS = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing',
  READY: 'Ready',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isViewingDetails, setIsViewingDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      const data = await response.json();
      setOrders(data);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsLoading(false);
    }
  };

  const handleViewDetails = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }
      const orderDetails = await response.json();
      setSelectedOrder(orderDetails);
      setIsViewingDetails(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">My Orders</h1>
        <p className="text-gray-600">View your order history and track current orders.</p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
          <p className="text-gray-500">Your order history will appear here once you place an order.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Order #{order.id}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()} at{' '}
                      {new Date(order.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      STATUS_COLORS[order.status]
                    }`}
                  >
                    {STATUS_LABELS[order.status]}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>
                        {item.quantity}x {item.menuItem.name}
                      </span>
                      <span>₹{(item.menuItem.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-sm">
                    <span className="text-gray-500">Total:</span>{' '}
                    <span className="font-medium">₹{order.finalTotal.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={() => handleViewDetails(order.id)}
                    className="text-black hover:text-gray-700 text-sm font-medium"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Details Modal */}
      {isViewingDetails && selectedOrder && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsViewingDetails(false)}
          />

          {/* Modal */}
          <div className="fixed inset-x-4 top-[10%] max-w-2xl mx-auto bg-white rounded-xl shadow-lg z-50 overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">Order Details</h2>
              <button
                onClick={() => setIsViewingDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Order ID</p>
                  <p className="font-medium">#{selectedOrder.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">
                    {new Date(selectedOrder.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Order Type</p>
                  <p className="font-medium capitalize">{selectedOrder.orderType.toLowerCase()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      STATUS_COLORS[selectedOrder.status]
                    }`}
                  >
                    {STATUS_LABELS[selectedOrder.status]}
                  </span>
                </div>
                {selectedOrder.deliveryAddress && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Delivery Address</p>
                    <p className="font-medium">{selectedOrder.deliveryAddress}</p>
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-2">Items</h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>
                        {item.quantity}x {item.menuItem.name}
                      </span>
                      <span>₹{(item.menuItem.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Breakdown */}
              <div>
                <h3 className="font-semibold mb-2">Price Breakdown</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Item Total</span>
                    <span>₹{selectedOrder.itemTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">GST (5%)</span>
                    <span>₹{selectedOrder.gst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Platform Fee</span>
                    <span>₹{selectedOrder.platformFee.toFixed(2)}</span>
                  </div>
                  {selectedOrder.orderType === 'DELIVERY' && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Delivery Charge</span>
                      <span>₹{selectedOrder.deliveryCharge.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t font-medium">
                    <span>Total</span>
                    <span>₹{selectedOrder.finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* OTP */}
              <div>
                <h3 className="font-semibold mb-2">OTP</h3>
                <p className="text-sm">
                  Use this OTP to track your order: <span className="font-mono font-medium">{selectedOrder.otp}</span>
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 