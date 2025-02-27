'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/lib/context/CartContext';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { itemCount, calculateTotals } = useCart();
  const { finalTotal } = calculateTotals();

  // Hide cart button on cart and checkout pages
  const hideCartButton = pathname === '/(customer)/cart' || pathname === '/(customer)/checkout';

  return (
    <div className="min-h-screen bg-white relative">
      {/* Main Content */}
      <main className="max-w-md mx-auto min-h-screen">
        {children}
      </main>

      {/* Cart Button */}
      {!hideCartButton && itemCount > 0 && (
        <div className="fixed bottom-6 left-0 right-0 px-4 z-50">
          <div className="max-w-md mx-auto">
            <Link
              href="/(customer)/cart"
              className="bg-black text-white px-4 py-3 rounded-full flex items-center justify-between shadow-lg"
            >
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                </div>
                <span className="font-medium">View Cart</span>
              </div>
              <span className="font-medium">₹{finalTotal.toFixed(2)}</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
} 