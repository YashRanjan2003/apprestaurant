'use client';

import Link from 'next/link';
import { useCart } from '@/lib/context/CartContext';
import { useState } from 'react';

export default function CartPage() {
  const { items, removeItem, updateQuantity, calculateTotals, clearCart } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Get all totals
  const { itemTotal, gst, platformFee, deliveryCharge, finalTotal } = calculateTotals();

  // Constants
  const freeDeliveryThreshold = 500.00;
  const standardDeliveryCharge = 40.00;

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
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
    <div className="min-h-screen flex flex-col">
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

      <main className="flex-1 p-4">
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
      </main>

      <footer className="bg-white border-t">
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
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Delivery Charge</span>
                  <div className="text-right">
                    {itemTotal >= freeDeliveryThreshold ? (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 line-through">₹{standardDeliveryCharge.toFixed(2)}</span>
                        <span className="text-green-600 font-medium">Free</span>
                      </div>
                    ) : (
                      <span>₹{deliveryCharge.toFixed(2)}</span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500">Free delivery on orders above ₹{freeDeliveryThreshold}</p>
              </div>
              {/* Savings message if there are any discounted items */}
              <div className="flex items-center text-green-600 text-sm py-2">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                You save ₹90.00 on this order!
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