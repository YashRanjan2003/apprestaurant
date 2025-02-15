'use client';

import Link from 'next/link';
import { useState } from 'react';

interface OrderDetails {
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  itemTotal: number;
  gst: number;
  platformFee: number;
  deliveryCharge: number;
  finalTotal: number;
  orderType: 'pickup' | 'delivery';
  deliveryAddress: string | null;
  scheduledTime: string;
  paymentMethod: 'card' | 'cash';
  otp: string;
  status: string;
  createdAt: string;
}

export default function TrackOrderPage() {
  const [otp, setOtp] = useState('');
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      try {
        const savedOrder = localStorage.getItem('lastOrder');
        if (!savedOrder) {
          setError('No order found with this code');
          setOrder(null);
          return;
        }

        const orderDetails = JSON.parse(savedOrder);
        if (orderDetails.otp !== otp) {
          setError('Invalid order code');
          setOrder(null);
          return;
        }

        setOrder(orderDetails);
      } catch (error) {
        setError('Failed to fetch order details');
        setOrder(null);
      } finally {
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col">
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
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    {order.status}
                  </span>
                </div>
                <div className="text-sm space-y-2">
                  <p>
                    <span className="text-gray-600">Order Type:</span>{' '}
                    {order.orderType === 'delivery' ? 'Delivery' : 'Pickup'}
                  </p>
                  <p>
                    <span className="text-gray-600">Time:</span>{' '}
                    {order.scheduledTime}
                  </p>
                  {order.deliveryAddress && (
                    <p>
                      <span className="text-gray-600">Delivery Address:</span>{' '}
                      {order.deliveryAddress}
                    </p>
                  )}
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
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Delivery Charge</span>
                      {order.itemTotal >= 500 ? (
                        <span className="text-green-600">Free</span>
                      ) : (
                        <span>₹{order.deliveryCharge.toFixed(2)}</span>
                      )}
                    </div>
                    <div className="flex justify-between font-semibold pt-2 border-t mt-2">
                      <span>Total</span>
                      <span>₹{order.finalTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

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