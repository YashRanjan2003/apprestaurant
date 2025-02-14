'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface OrderDetails {
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  orderType: 'pickup' | 'delivery';
  deliveryAddress: string | null;
  scheduledTime: string;
  paymentMethod: 'card' | 'cash';
  otp: string;
  status: string;
  createdAt: string;
}

export default function ConfirmationPage() {
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrder = () => {
      try {
        const savedOrder = localStorage.getItem('lastOrder');
        console.log('Saved order:', savedOrder); // Debug log
        
        if (!savedOrder) {
          setError('Order not found');
          setIsLoading(false);
          return;
        }

        const orderDetails = JSON.parse(savedOrder);
        console.log('Parsed order:', orderDetails); // Debug log
        
        setOrder(orderDetails);
        
        // Calculate estimated time in minutes
        const estimatedTime = orderDetails.scheduledTime === 'ASAP'
          ? 20 // Default 20 minutes for ASAP orders
          : parseInt(orderDetails.scheduledTime, 10);
        
        setTimeLeft(estimatedTime);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load order:', error);
        setError('Failed to load order details');
        setIsLoading(false);
      }
    };

    loadOrder();
  }, []);

  // Separate useEffect for the timer
  useEffect(() => {
    if (!order || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [order, timeLeft]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-4">{error || "We couldn't find your order details."}</p>
          <Link
            href="/menu"
            className="bg-black text-white px-6 py-3 rounded-full font-semibold hover:bg-gray-800 transition-colors inline-block"
          >
            Return to Menu
          </Link>
        </div>
      </div>
    );
  }

  const estimatedTime = new Date();
  estimatedTime.setMinutes(estimatedTime.getMinutes() + timeLeft);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Order Confirmed</h1>
          <Link href="/menu" className="text-sm text-gray-600 hover:text-black">
            Back to Menu
          </Link>
        </div>
      </header>

      <main className="flex-1 p-4">
        <div className="space-y-6">
          {/* Success Message */}
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold mb-2">Thank You!</h2>
            <p className="text-gray-600">Your order has been confirmed.</p>
          </div>

          {/* OTP */}
          <div className="bg-black text-white rounded-lg p-4 text-center">
            <p className="text-sm mb-1">Show this code when picking up your order</p>
            <p className="text-3xl font-mono font-bold tracking-wider">{order.otp}</p>
          </div>

          {/* Estimated Time */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold mb-2">Estimated {order.orderType === 'delivery' ? 'Delivery' : 'Pickup'} Time</h3>
            <p className="text-lg">
              {estimatedTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              {' '}
              ({timeLeft} minutes)
            </p>
          </div>

          {/* Delivery Address (if applicable) */}
          {order.orderType === 'delivery' && order.deliveryAddress && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-semibold mb-2">Delivery Address</h3>
              <p className="text-gray-600">{order.deliveryAddress}</p>
            </div>
          )}

          {/* Order Details */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold mb-3">Order Summary</h3>
            <div className="space-y-2">
              {order.items.map((item) => (
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
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-semibold mb-2">Payment Method</h3>
            <p className="capitalize">{order.paymentMethod}</p>
          </div>

          {/* Help */}
          <div className="text-center text-sm text-gray-600">
            <p>Need help with your order?</p>
            <a href="tel:+1234567890" className="text-black font-semibold hover:underline">
              Call Restaurant
            </a>
          </div>
        </div>
      </main>
    </div>
  );
} 