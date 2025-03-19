'use client';

import Link from 'next/link';
import { useCart } from '@/lib/context/CartContext';
import { useState, useEffect, useRef } from 'react';

export default function CartPage() {
  const { items, removeItem, updateQuantity, calculateTotals, clearCart } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Get all totals
  const { itemTotal, gst, platformFee, deliveryCharge, finalTotal } = calculateTotals();

  // Check if scroll indicator should be shown
  useEffect(() => {
    if (items.length <= 2) return;
    
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;
    
    const checkScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      // Show indicator only when not scrolled and content is scrollable
      const isScrollable = scrollHeight > clientHeight;
      const hasNotScrolledMuch = scrollTop < 10;
      setShowScrollIndicator(isScrollable && hasNotScrolledMuch);
    };
    
    // Check immediately
    checkScroll();
    
    // Add scroll listener
    scrollContainer.addEventListener('scroll', checkScroll);
    return () => scrollContainer.removeEventListener('scroll', checkScroll);
  }, [items]);

  // Constants
  const freeDeliveryThreshold = 500.00;
  const standardDeliveryCharge = 40.00;

  if (items.length === 0) {
    return (
      <div className="h-[100dvh] flex flex-col">
        <header className="bg-white shadow-sm">
          <div className="max-w-md mx-auto px-4 py-4 flex items-center">
            <Link href="/menu" className="text-gray-800">
              <span className="sr-only">Back to Menu</span>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-xl font-semibold ml-4">Cart</h1>
          </div>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-gray-600 mb-4">Your cart is empty</p>
          <Link
            href="/menu"
            className="bg-black text-white px-6 py-3 rounded-full font-semibold hover:bg-gray-800 transition-colors"
          >
            Browse Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto h-[100dvh] bg-white shadow-sm flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/menu" className="text-gray-800">
              <span className="sr-only">Back to Menu</span>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-xl font-semibold ml-4">Cart</h1>
          </div>
          <button
            onClick={clearCart}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Clear Cart
          </button>
        </div>
      </header>

      {/* Scrollable cart items */}
      <main 
        ref={scrollContainerRef} 
        className="flex-1 p-4 overflow-y-auto relative"
      >
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-gray-600">₹{item.price.toFixed(2)}</p>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <span className="sr-only">Remove item</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="mt-2 flex items-center">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 border rounded-full"
                >
                  -
                </button>
                <span className="mx-3 min-w-[2rem] text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 border rounded-full"
                >
                  +
                </button>
                <div className="ml-auto font-semibold">
                  ₹{(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Scroll indicator arrow */}
        {showScrollIndicator && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 animate-bounce">
            <svg 
              className="w-5 h-5 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M19 9l-7 7-7-7" 
              />
            </svg>
          </div>
        )}
      </main>

      {/* Fixed footer with bill details */}
      <footer className="bg-white border-t shadow-md">
        <div className="max-w-md mx-auto px-4 py-4">
          {/* Coupon Section */}
          {!showCouponInput ? (
            <button
              onClick={() => setShowCouponInput(true)}
              className="flex items-center text-sm text-gray-600 mb-4 hover:text-black"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Add Coupon
            </button>
          ) : (
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter coupon code"
                className="flex-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-black focus:border-black uppercase"
                maxLength={10}
              />
              <button
                onClick={() => {
                  // Handle coupon application here
                  setShowCouponInput(false);
                  setCouponCode('');
                }}
                className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-gray-800"
              >
                Apply
              </button>
            </div>
          )}

          {/* Bill Details */}
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-3">Bill Details</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Item Total</span>
                <span>₹{itemTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">GST (5%)</span>
                <span>₹{gst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Platform Fee</span>
                <span>₹{platformFee.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-600">To Pay</span>
            <span className="text-xl font-semibold">₹{finalTotal.toFixed(2)}</span>
          </div>
          <Link
            href="/checkout"
            className="block w-full bg-black text-white text-center py-3 rounded-full font-semibold hover:bg-gray-800 transition-colors"
          >
            Proceed to Checkout
          </Link>
        </div>
      </footer>
    </div>
  );
} 