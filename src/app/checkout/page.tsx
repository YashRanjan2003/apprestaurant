'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useCart } from '@/lib/context/CartContext';
import { useAuth } from '@/lib/context/AuthContext';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, clearCart } = useCart();
  const { user, isLoading: authLoading } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');

  useEffect(() => {
    // First check if we have items in the cart
    if (items.length === 0) {
      router.push('/menu');
      return;
    }

    // Then check authentication after loading is complete
    if (!authLoading && !user) {
      localStorage.setItem('redirectUrl', '/checkout');
      router.push('/auth/login');
    }
  }, [authLoading, user, items.length, router]);

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated or no items, the useEffect will handle redirection
  if (!user || items.length === 0) {
    return null;
  }

  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    
    setIsProcessing(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      const orderDetails = {
        items,
        total,
        orderType,
        deliveryAddress: orderType === 'delivery' ? deliveryAddress : null,
        scheduledTime: scheduledTime || 'ASAP',
        paymentMethod,
        otp: generateOTP(),
        userId: user?.id,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
      };

      // Store order details in localStorage
      localStorage.setItem('lastOrder', JSON.stringify(orderDetails));

      // Clear the cart first
      clearCart();

      // Use window.location for a full page navigation
      window.location.href = '/checkout/confirmation';
    } catch (error) {
      console.error('Checkout failed:', error);
      alert('Something went wrong. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center">
          <Link href="/cart" className="text-gray-800">
            <span className="sr-only">Back to Cart</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-semibold ml-4">Checkout</h1>
        </div>
      </header>

      <main className="flex-1 p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Type Selection */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h2 className="font-semibold mb-3">Order Type</h2>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setOrderType('pickup')}
                className={`flex-1 py-2 rounded-full border-2 ${
                  orderType === 'pickup'
                    ? 'border-black bg-black text-white'
                    : 'border-gray-200 text-gray-700'
                }`}
              >
                Pickup
              </button>
              <button
                type="button"
                onClick={() => setOrderType('delivery')}
                className={`flex-1 py-2 rounded-full border-2 ${
                  orderType === 'delivery'
                    ? 'border-black bg-black text-white'
                    : 'border-gray-200 text-gray-700'
                }`}
              >
                Delivery
              </button>
            </div>
          </div>

          {/* Delivery Address (if delivery selected) */}
          {orderType === 'delivery' && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Address
              </label>
              <textarea
                id="address"
                required
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-black focus:border-black"
                rows={3}
                placeholder="Enter your delivery address"
              />
            </div>
          )}

          {/* Scheduled Time */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
              Pickup/Delivery Time
            </label>
            <select
              id="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-black focus:border-black"
            >
              <option value="">ASAP</option>
              <option value="30">In 30 minutes</option>
              <option value="60">In 1 hour</option>
              <option value="90">In 1.5 hours</option>
              <option value="120">In 2 hours</option>
            </select>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h2 className="font-semibold mb-3">Payment Method</h2>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`flex-1 py-2 rounded-full border-2 ${
                  paymentMethod === 'card'
                    ? 'border-black bg-black text-white'
                    : 'border-gray-200 text-gray-700'
                }`}
              >
                Card
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`flex-1 py-2 rounded-full border-2 ${
                  paymentMethod === 'cash'
                    ? 'border-black bg-black text-white'
                    : 'border-gray-200 text-gray-700'
                }`}
              >
                Cash
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h2 className="font-semibold mb-3">Order Summary</h2>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.quantity}x {item.name}
                  </span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full bg-black text-white py-3 rounded-full font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : `Pay $${total.toFixed(2)}`}
          </button>
        </form>
      </main>
    </div>
  );
} 