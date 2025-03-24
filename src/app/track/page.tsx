'use client';

import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useSearchParams } from 'next/navigation';
import FeedbackForm from '@/components/FeedbackForm';
import { Toaster } from 'react-hot-toast';

interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
}

interface OrderDetails {
  id: string;
  items: OrderItem[];
  itemTotal: number;
  gst: number;
  platformFee: number;
  deliveryCharge: number;
  finalTotal: number;
  orderType: 'pickup';
  deliveryAddress: null;
  scheduledTime: string;
  paymentMethod: 'card' | 'cash';
  otp: string;
  status: string;
  createdAt: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
}

// Create a client component that uses search params
function TrackOrderContent() {
  const [otp, setOtp] = useState('');
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  // Auto-fetch order if OTP is provided in URL
  useEffect(() => {
    const otpFromUrl = searchParams.get('otp');
    if (otpFromUrl && otpFromUrl.length === 6) {
      setOtp(otpFromUrl);
      fetchOrderByOtp(otpFromUrl)
        .then(orderDetails => {
          setOrder(orderDetails);
        })
        .catch(err => {
          console.error('Failed to fetch order:', err);
          setError('Order not found. Please check your code and try again.');
        });
    }
  }, [searchParams]);

  const fetchOrderByOtp = async (otp: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(*)
        `)
        .eq('otp', otp)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Order not found');
      
      // Format the data to match our expected format
      const orderDetails: OrderDetails = {
        id: data.id,
        items: data.order_items,
        itemTotal: data.item_total,
        gst: data.gst,
        platformFee: data.platform_fee,
        deliveryCharge: data.delivery_charge,
        finalTotal: data.final_total,
        orderType: data.order_type,
        deliveryAddress: data.delivery_address,
        scheduledTime: data.scheduled_time,
        paymentMethod: data.payment_method,
        otp: data.otp,
        status: data.status,
        createdAt: data.created_at,
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        customer_email: data.customer_email
      };
      
      return orderDetails;
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const orderDetails = await fetchOrderByOtp(otp);
      setOrder(orderDetails);
    } catch (err: any) {
      console.error('Failed to fetch order:', err);
      setError('Order not found. Please check your code and try again.');
      setOrder(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Get the status text and color
  const getStatusDetails = (status: string) => {
    const statusMap: Record<string, { text: string, color: string }> = {
      'pending': { text: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
      'confirmed': { text: 'Confirmed', color: 'bg-blue-100 text-blue-700' },
      'preparing': { text: 'Preparing', color: 'bg-orange-100 text-orange-700' },
      'ready': { text: 'Ready for Pickup', color: 'bg-green-100 text-green-700' },
      'delivered': { text: 'Completed', color: 'bg-green-100 text-green-700' },
      'cancelled': { text: 'Cancelled', color: 'bg-red-100 text-red-700' },
    };
    
    return statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-700' };
  };

  // Check if order is delivered and can be rated
  const canLeaveFeedback = order?.status === 'delivered';

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white shadow-sm">
      <Toaster position="top-center" />
      <header className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center">
          <Link href="/" className="text-gray-800">
            <span className="sr-only">Back to Home</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-semibold ml-4">Track Order</h1>
        </div>
      </header>

      <main className="flex-1 p-4">
        <div className="max-w-md mx-auto">
          {!order ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                  Enter Order Code
                </label>
                <input
                  type="text"
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-black focus:border-black text-lg tracking-wider text-center font-mono"
                  maxLength={6}
                  required
                  pattern="[0-9]{6}"
                />
                {error && (
                  <p className="mt-2 text-red-600 text-sm">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={isLoading || otp.length !== 6}
                  className="w-full mt-4 bg-black text-white py-3 rounded-full font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Searching...' : 'Track Order'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {/* Order Status */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold">Order Status</h2>
                  <span className={`px-3 py-1 ${getStatusDetails(order.status).color} rounded-full text-sm`}>
                    {getStatusDetails(order.status).text}
                  </span>
                </div>
                <div className="text-sm space-y-2">
                  <p>
                    <span className="text-gray-600">Order Type:</span>{' '}
                    Pickup
                  </p>
                  <p>
                    <span className="text-gray-600">Customer:</span>{' '}
                    {order.customer_name}
                  </p>
                  <p>
                    <span className="text-gray-600">Phone:</span>{' '}
                    {order.customer_phone}
                  </p>
                  <p>
                    <span className="text-gray-600">Time:</span>{' '}
                    {new Date(order.scheduledTime).toLocaleString()}
                  </p>
                  <p>
                    <span className="text-gray-600">Payment Method:</span>{' '}
                    {order.paymentMethod === 'card' ? 'Card' : 'Cash'}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="font-semibold mb-4">Order Items</h2>
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>
                        {item.quantity}x {item.name}
                      </span>
                      <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Item Total</span>
                      <span>₹{order.itemTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">GST (5%)</span>
                      <span>₹{order.gst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Platform Fee</span>
                      <span>₹{order.platformFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-2 border-t mt-2">
                      <span>Total</span>
                      <span>₹{order.finalTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feedback Form (only shown for delivered orders) */}
              {canLeaveFeedback && (
                <FeedbackForm orderId={order.id} items={order.items} />
              )}

              {/* Help Section */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="font-semibold mb-4">Need Help?</h2>
                <div className="space-y-4">
                  <a
                    href="tel:+1234567890"
                    className="flex items-center text-sm text-gray-600 hover:text-black"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Call Restaurant
                  </a>
                </div>
              </div>

              <button
                onClick={() => {
                  setOrder(null);
                  setOtp('');
                  setError(null);
                }}
                className="w-full py-3 border-2 border-black rounded-full font-semibold hover:bg-gray-50 transition-colors"
              >
                Track Another Order
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Loading fallback
function TrackOrderLoading() {
  return (
    <div className="max-w-md mx-auto min-h-screen bg-white shadow-sm flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
    </div>
  );
}

// Main component with Suspense boundary
export default function TrackOrderPage() {
  return (
    <Suspense fallback={<TrackOrderLoading />}>
      <TrackOrderContent />
    </Suspense>
  );
} 