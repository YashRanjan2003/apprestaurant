'use client';

import Link from 'next/link';
import { useCart } from '@/lib/context/CartContext';
import { useState } from 'react';
import Image from 'next/image';

export default function CartPage() {
  const { 
    items, 
    updateQuantity, 
    removeItem, 
    calculateTotals, 
    applyDiscount, 
    removeDiscount,
    activeDiscount 
  } = useCart();
  
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const { 
    itemTotal, 
    gst, 
    platformFee, 
    deliveryCharge, 
    discount,
    finalTotal 
  } = calculateTotals();

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setIsApplyingCoupon(true);
    setCouponError(null);

    const result = await applyDiscount(couponCode.trim());
    
    if (!result.success) {
      setCouponError(result.error || 'Failed to apply coupon');
    }

    setIsApplyingCoupon(false);
  };

  const handleRemoveCoupon = () => {
    removeDiscount();
    setCouponCode('');
    setCouponError(null);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
          <p className="text-gray-600 mb-8">Add some delicious items to get started!</p>
          <Link
            href="/menu"
            className="bg-black text-white px-6 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors"
          >
            Browse Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>

      {/* Cart Items */}
      <div className="space-y-4 mb-8">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm"
          >
            <div className="flex items-center space-x-4">
              <Image
                src={item.imageUrl || '/placeholder.png'}
                alt={item.name}
                width={60}
                height={60}
                className="rounded-md"
              />
              <div>
                <h3 className="font-medium">{item.name}</h3>
                <p className="text-gray-600">₹{item.price.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300"
                >
                  -
                </button>
                <span className="w-8 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => removeItem(item.id)}
                className="text-red-500 hover:text-red-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Coupon Section */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <h2 className="font-medium mb-3">Have a coupon code?</h2>
        {activeDiscount ? (
          <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
            <div>
              <span className="font-medium text-green-700">{activeDiscount.code}</span>
              <p className="text-sm text-green-600">
                {activeDiscount.type === 'PERCENTAGE' 
                  ? `${activeDiscount.value}% off`
                  : `₹${activeDiscount.value} off`}
              </p>
            </div>
            <button
              onClick={handleRemoveCoupon}
              className="text-red-500 hover:text-red-600"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="flex space-x-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Enter coupon code"
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
            <button
              onClick={handleApplyCoupon}
              disabled={isApplyingCoupon}
              className="bg-black text-white px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {isApplyingCoupon ? 'Applying...' : 'Apply'}
            </button>
          </div>
        )}
        {couponError && (
          <p className="text-red-500 text-sm mt-2">{couponError}</p>
        )}
      </div>

      {/* Price Breakdown */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <h2 className="font-medium mb-3">Price Details</h2>
        <div className="space-y-2 text-gray-600">
          <div className="flex justify-between">
            <span>Item Total</span>
            <span>₹{itemTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>GST (5%)</span>
            <span>₹{gst.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Platform Fee</span>
            <span>₹{platformFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery Charge</span>
            <span>₹{deliveryCharge.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span>-₹{discount.toFixed(2)}</span>
            </div>
          )}
          <div className="border-t pt-2 mt-2 font-medium text-black flex justify-between">
            <span>Total Amount</span>
            <span>₹{finalTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Checkout Button */}
      <Link
        href="/checkout"
        className="block w-full bg-black text-white text-center py-4 rounded-full font-medium hover:bg-gray-800 transition-colors"
      >
        Proceed to Checkout
      </Link>
    </div>
  );
} 