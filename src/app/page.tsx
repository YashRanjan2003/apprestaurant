'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/context/CartContext';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  isVeg: boolean;
  rating?: number;
  ratingCount?: number;
  originalPrice?: number;
  offer?: string;
}

export default function HomePage() {
  const [featuredItems, setFeaturedItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addItem } = useCart();

  useEffect(() => {
    fetchFeaturedItems();
  }, []);

  const fetchFeaturedItems = async () => {
    try {
      const response = await fetch('/api/menu/featured');
      if (!response.ok) {
        throw new Error('Failed to fetch featured items');
      }
      const data = await response.json();
      setFeaturedItems(data);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsLoading(false);
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
    <div className="min-h-screen bg-white">
      <div className="max-w-md mx-auto min-h-screen bg-black">
        {/* Hero Section */}
        <div className="relative h-screen">
          <div className="absolute inset-0 hero-image-container">
            <img
              src="/assets/images/hero.jpg"
              alt="Restaurant Food"
              className="w-full h-full object-cover brightness-50"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent" />
          </div>
          
          <div className="relative h-full flex flex-col justify-between p-6 text-white">
            {/* Top Section */}
            <div className="mt-16 text-center animate-fade-in">
              <h1 className="text-4xl font-bold mb-4">
                <span className="text-2xl opacity-90">Welcome to</span>
                <img 
                  src="/assets/images/currypoorilogo.png" 
                  alt="CurryPoori" 
                  className="h-24 mx-auto my-4"
                />
              </h1>
              <p className="text-lg opacity-90 delay-200">
                Order food or make a reservation
              </p>
            </div>

            {/* Bottom Section */}
            <div className="space-y-4 mb-8 animate-fade-in delay-300">
              <Link
                href="/menu"
                className="flex w-full items-center justify-center bg-white text-black py-4 rounded-full font-semibold text-lg"
              >
                Order Now
              </Link>
              <Link
                href="/track"
                className="flex w-full items-center justify-center bg-black/20 backdrop-blur-sm border border-white/20 text-white py-4 rounded-full font-semibold text-lg"
              >
                Track Order
              </Link>
              <div className="text-center mt-6">
                <p className="text-sm opacity-80">Open daily: 11:00 AM - 10:00 PM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 