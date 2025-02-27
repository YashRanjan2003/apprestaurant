'use client';

import React, { useRef, useMemo, useState, useEffect, useCallback, memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/lib/context/CartContext';
import { useVirtualizer } from '@tanstack/react-virtual';

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
  isAvailable?: boolean;
}

async function fetchMenuItems(): Promise<MenuItem[]> {
  const res = await fetch('/api/menu');
  if (!res.ok) throw new Error('Failed to fetch menu items');
  return res.json();
}

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isVegOnly, setIsVegOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCategories, setShowCategories] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { addItem, items: cartItems, updateQuantity, calculateTotals, removeItem } = useCart();
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const _observerRef = useRef<IntersectionObserver>();
  const parentRef = useRef<HTMLDivElement>(null);

  // Fetch menu items
  useEffect(() => {
    async function loadMenuItems() {
      try {
        const data = await fetchMenuItems();
        const availableItems = data.filter(item => item.isAvailable);
        setItems(availableItems);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch menu items'));
        setIsLoading(false);
      }
    }
    loadMenuItems();
  }, []);

  // Setup intersection observer for category headers
  useEffect(() => {
    const callback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const categoryId = entry.target.getAttribute('data-category');
          if (categoryId) {
            setSelectedCategory(categoryId);
          }
        }
      });
    };

    const observer = new IntersectionObserver(callback, {
      rootMargin: '-50% 0px',
      threshold: 0,
    });

    Object.entries(categoryRefs.current).forEach(([_, element]) => {
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, []);

  // Memoized values
  const categories = useMemo(() => {
    return Array.from(new Set(items.map(item => item.category))) as string[];
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesVeg = !isVegOnly || item.isVeg;
      const matchesSearch = searchQuery === '' || 
                         item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesVeg && matchesSearch;
    });
  }, [items, isVegOnly, searchQuery]);

  const itemsByCategory = useMemo(() => {
    return categories.reduce((acc, category) => {
      const categoryItems = filteredItems.filter(item => item.category === category);
      if (categoryItems.length > 0) {
        acc[category] = categoryItems;
      }
      return acc;
    }, {} as Record<string, MenuItem[]>);
  }, [categories, filteredItems]);

  const scrollToCategory = (category: string) => {
    const element = categoryRefs.current[category];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const headerOffset = 120;
      window.scrollBy(0, -headerOffset);
    }
    setSelectedCategory(category);
    setShowCategories(false);
  };

  // Memoize cart item quantities for better performance
  const cartItemQuantities = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      acc[item.id] = item.quantity;
      return acc;
    }, {} as Record<string, number>);
  }, [cartItems]);

  const handleQuantityChange = useCallback((itemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      removeItem(itemId);
    } else {
      const item = items.find(i => i.id === itemId);
      if (item) {
        updateQuantity(itemId, newQuantity);
      }
    }
  }, [items, removeItem, updateQuantity]);

  // Virtualize the menu list for better performance
  const rowVirtualizer = useVirtualizer({
    count: categories.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => 300, []),
    overscan: 2,
  });

  // Optimize image loading
  const ImageWithLoading = memo(({ src, alt }: { src: string; alt: string }) => (
    <Image
      src={src}
      alt={alt}
      width={120}
      height={120}
      className="rounded-lg"
      loading="lazy"
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQdHx4eHRoaHSQrJyEwPENDPzE2Nj0xRVBQW1NTQUVeYWJhXV9jY2NfcnNkZXJzdGFj/2wBDARVFxceGh4lHx8lY1BQY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
    />
  ));
  ImageWithLoading.displayName = 'ImageWithLoading';

  if (!items.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {isLoading ? (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
        ) : (
          <div className="text-red-600">Error: {error?.message}</div>
        )}
      </div>
    );
  }

  const totals = calculateTotals();
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleAddToCart = (item: MenuItem) => {
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      category: item.category,
      imageUrl: item.imageUrl
    });
  };

  return (
    <div ref={parentRef} className="min-h-screen p-4">
      {/* Header */}
      <div className="sticky top-0 bg-white z-20 border-b">
        <div className="flex items-center px-4 h-14">
          <Link href="/" className="text-gray-800">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-semibold mx-auto">Menu</h1>
          <div className="w-6" /> {/* Spacer for alignment */}
        </div>

        {/* Search Bar */}
        <div className="px-4 py-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 focus:ring-0 focus:border-gray-300 text-gray-600"
            />
          </div>

          {/* Veg Filter */}
          <div className="mt-3">
            <button
              onClick={() => setIsVegOnly(!isVegOnly)}
              className={`inline-flex items-center px-4 py-2 rounded-full ${
                isVegOnly 
                  ? 'bg-green-50 text-green-600 border border-green-600'
                  : 'bg-gray-50 text-gray-600 border border-gray-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isVegOnly ? 'bg-green-600' : 'bg-gray-400'} mr-2`} />
              Pure Veg Only
            </button>
          </div>
        </div>
      </div>

      {/* Virtualized menu list */}
      <div
        className="relative"
        style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const category = categories[virtualRow.index];
          const categoryItems = itemsByCategory[category];

          return (
            <div
              key={virtualRow.index}
              className="absolute top-0 left-0 w-full"
              style={{
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <h2 className="text-xl font-bold mb-4">{category}</h2>
              <div className="grid grid-cols-2 gap-4">
                {categoryItems.map((item) => (
                  <div key={item.id} className="bg-white rounded-lg shadow-sm p-4">
                    <ImageWithLoading src={item.imageUrl} alt={item.name} />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">{item.description}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="font-medium">₹{item.price.toFixed(2)}</span>
                        {!cartItemQuantities[item.id] ? (
                          <button
                            onClick={() => handleAddToCart(item)}
                            className="bg-white text-green-600 px-8 py-1.5 rounded-full text-sm font-medium border border-green-600"
                          >
                            ADD
                          </button>
                        ) : (
                          <div className="flex items-center bg-white rounded-full border border-gray-200">
                            <button
                              className="w-10 h-8 flex items-center justify-center text-green-600"
                              onClick={() => handleQuantityChange(item.id, (cartItemQuantities[item.id] || 0) - 1)}
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-medium">
                              {cartItemQuantities[item.id] || 0}
                            </span>
                            <button
                              className="w-10 h-8 flex items-center justify-center text-green-600"
                              onClick={() => handleQuantityChange(item.id, (cartItemQuantities[item.id] || 0) + 1)}
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Categories Quick Navigation */}
      <div className={`fixed z-30 transition-all duration-300 ${
        cartItemCount > 0 ? 'bottom-24' : 'bottom-6'
      } right-4`}>
        <button
          onClick={() => setShowCategories(!showCategories)}
          className="w-12 h-12 bg-black text-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-800 transition-all duration-200"
        >
          <svg 
            className={`w-6 h-6 transition-transform duration-200 ${showCategories ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Categories Popup */}
        {showCategories && (
          <div 
            className="absolute bottom-14 right-0 bg-white rounded-lg shadow-xl p-2 min-w-[200px] animate-fade-in origin-bottom-right"
          >
            {categories.map(category => (
              <button
                key={category}
                onClick={() => scrollToCategory(category)}
                className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-all duration-200
                  ${selectedCategory === category 
                    ? 'bg-gray-100 font-semibold' 
                    : 'hover:bg-gray-50'
                  }
                  transform hover:translate-x-1
                `}
              >
                {category}
                <span className="float-right text-gray-400">›</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cart Button */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-6 left-0 right-0 px-4 z-20">
          <Link
            href="/cart"
            className="flex items-center justify-between bg-black text-white px-6 py-3 rounded-full max-w-md mx-auto"
          >
            <div className="flex items-center gap-2">
              <div className="bg-white text-black w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium">
                {cartItemCount}
              </div>
              <span className="font-medium">View Cart</span>
            </div>
            <span className="font-medium">₹{totals.finalTotal.toFixed(2)}</span>
          </Link>
        </div>
      )}

      {/* Backdrop for category menu */}
      {showCategories && (
        <div 
          className="fixed inset-0 bg-black/20 z-20"
          onClick={() => setShowCategories(false)}
        />
      )}
    </div>
  );
} 