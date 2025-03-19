'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/lib/context/CartContext';
import { useState, useEffect, useRef } from 'react';
import { getAllMenuItems } from '@/lib/supabase/menu';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category_id: string;
  image_url: string;
  is_veg: boolean;
  rating: number | null;
  rating_count: number | null;
  calories: number | null;
  protein: number | null;
  original_price: number | null;
  offer: string | null;
  menu_categories: {
    name: string;
  };
}

export default function MenuPage() {
  const { addItem, itemCount, updateQuantity, items: cartItems } = useCart();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVegOnly, setIsVegOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Create refs for category sections
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Fetch menu items from Supabase
  useEffect(() => {
    async function fetchMenuItems() {
      try {
        setIsLoading(true);
        const data = await getAllMenuItems();
        setMenuItems(data as MenuItem[]);
        setError(null);
      } catch (err) {
        console.error('Error fetching menu items:', err);
        setError('Failed to load menu items. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchMenuItems();
  }, []);

  // Initialize quantities from cart
  useEffect(() => {
    const newQuantities: Record<string, number> = {};
    cartItems.forEach(item => {
      newQuantities[item.id] = item.quantity;
    });
    setQuantities(newQuantities);
  }, [cartItems]);

  // Get unique categories from the menu items
  const categories = Array.from(new Set(menuItems.map(item => item.menu_categories.name)));

  // Filter menu items based on selected category, veg filter, and search term
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory ? item.menu_categories.name === selectedCategory : true;
    const matchesVegFilter = isVegOnly ? item.is_veg : true;
    const matchesSearch = searchTerm 
      ? item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    
    return matchesCategory && matchesVegFilter && matchesSearch;
  });

  // Group items by category for display
  const itemsByCategory: Record<string, MenuItem[]> = {};
  
  if (selectedCategory) {
    itemsByCategory[selectedCategory] = filteredItems;
  } else {
    filteredItems.forEach(item => {
      const category = item.menu_categories.name;
      if (!itemsByCategory[category]) {
        itemsByCategory[category] = [];
      }
      itemsByCategory[category].push(item);
    });
  }

  const handleAddToCart = (item: MenuItem) => {
    addItem({
      id: item.id,
      name: item.name,
      price: item.price
    });
    
    // Update quantities
    setQuantities(prev => ({
      ...prev,
      [item.id]: (prev[item.id] || 0) + 1
    }));
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 0) return;
    
    updateQuantity(itemId, newQuantity);
    setQuantities(prev => ({
      ...prev,
      [itemId]: newQuantity
    }));
  };

  const calculateCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Function to scroll to a category section
  const scrollToCategory = (category: string) => {
    if (categoryRefs.current[category]) {
      categoryRefs.current[category]?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
      // Close the menu after selection
      setIsMenuOpen(false);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-gray-800">
            <span className="sr-only">Back to Home</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold">Menu</h1>
          <div className="w-6"></div> {/* Spacer for centering */}
        </div>

        {/* Search and Filters */}
        <div className="px-4 py-2 border-b border-gray-100">
          <div className="relative mb-3">
            <input
              type="text"
              placeholder="Search dishes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2 pl-10 pr-3 border border-gray-200 rounded-full text-sm bg-gray-50"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <div className="flex flex-col space-y-3">
            <div className="inline-flex items-center w-auto bg-gray-50 px-4 py-2 rounded-full cursor-pointer">
              <input
                type="checkbox"
                checked={isVegOnly}
                onChange={() => setIsVegOnly(!isVegOnly)}
                className="sr-only"
                id="veg-toggle"
              />
              <label 
                htmlFor="veg-toggle"
                className="flex items-center cursor-pointer"
              >
                <div className={`w-5 h-5 border rounded-full mr-2 flex items-center justify-center ${isVegOnly ? 'border-gray-400' : 'border-gray-300'}`}>
                  <div className={`w-3 h-3 rounded-full ${isVegOnly ? 'bg-gray-400' : 'bg-transparent'}`}></div>
                </div>
                <span className="text-sm text-gray-700">Pure Veg Only</span>
              </label>
            </div>

            {/* Categories */}
            <div className="flex overflow-x-auto py-1 scrollbar-hide">
              <button
                className={`px-3 py-1 text-sm whitespace-nowrap mr-2 rounded-full ${
                  selectedCategory === null ? 'bg-black text-white' : 'bg-gray-100 text-gray-800'
                }`}
                onClick={() => setSelectedCategory(null)}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  className={`px-3 py-1 text-sm whitespace-nowrap mr-2 rounded-full ${
                    selectedCategory === category ? 'bg-black text-white' : 'bg-gray-100 text-gray-800'
                  }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="pb-24">
        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        )}
        
        {/* Error state */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 m-4 rounded-md">
            {error}
          </div>
        )}
        
        {/* No results */}
        {!isLoading && filteredItems.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No items found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filter to find what you're looking for.
            </p>
            <div className="mt-6">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory(null);
                  setIsVegOnly(false);
                }}
              >
                Reset filters
              </button>
            </div>
          </div>
        )}

        {/* Menu Items */}
        {Object.entries(itemsByCategory).map(([category, items]) => (
          <div 
            key={category} 
            className="mt-4"
            ref={el => { categoryRefs.current[category] = el; }}
          >
            <h2 className="text-2xl font-bold px-4 mb-3">{category}</h2>
            <div className="divide-y divide-gray-100">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="px-4 py-4"
                  onClick={() => {
                    setSelectedItem(item);
                    setIsModalOpen(true);
                  }}
                >
                  <div className="flex">
                    <div className="w-24 h-24 relative rounded-md overflow-hidden mr-3 flex-shrink-0">
                      <Image
                        src={item.image_url || '/placeholder-food.jpg'}
                        alt={item.name}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                      {item.is_veg && (
                        <div className="absolute top-1 left-1 bg-white p-0.5 rounded-sm">
                          <div className="w-4 h-4 border border-green-600 flex items-center justify-center">
                            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-medium text-lg text-gray-900">{item.name}</h3>
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">{item.description}</p>
                      <div className="mt-auto flex items-center justify-between">
                        <div className="font-medium">₹{item.price.toFixed(2)}</div>
                        
                        {quantities[item.id] ? (
                          <div className="flex items-center">
                            <button 
                              className="w-8 h-8 flex items-center justify-center text-green-600 border border-green-600 rounded-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuantityChange(item.id, quantities[item.id] - 1);
                              }}
                            >
                              -
                            </button>
                            <span className="mx-3 min-w-[1.5rem] text-center">{quantities[item.id]}</span>
                            <button 
                              className="w-8 h-8 flex items-center justify-center text-green-600 border border-green-600 rounded-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuantityChange(item.id, quantities[item.id] + 1);
                              }}
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            className="px-4 py-1 text-sm font-medium text-green-600 border border-green-600 rounded-full uppercase hover:bg-green-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(item);
                            }}
                          >
                            ADD
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>

      {/* Item details modal */}
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white w-full max-h-[90vh] overflow-auto z-10 relative rounded-t-xl m-4">
            <div className="relative">
              <div className="h-64 relative">
                <Image
                  src={selectedItem.image_url || '/placeholder-food.jpg'}
                  alt={selectedItem.name}
                  fill
                  className="object-cover"
                />
                {selectedItem.offer && (
                  <div className="absolute top-4 left-4">
                    <div className="bg-white text-orange-500 font-medium px-3 py-1 rounded-full text-sm">
                      {selectedItem.offer}
                    </div>
                  </div>
                )}
                <button
                  className="absolute top-4 right-4 bg-white rounded-full p-2"
                  onClick={() => setIsModalOpen(false)}
                >
                  <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center">
                <h2 className="text-2xl font-bold text-gray-800">{selectedItem.name}</h2>
                {selectedItem.is_veg && (
                  <div className="ml-2">
                    <div className="w-5 h-5 border border-green-600 flex items-center justify-center">
                      <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center mt-1">
                {selectedItem.rating && (
                  <div className="flex items-center bg-green-50 px-2 py-1 rounded text-sm">
                    <span className="text-green-700 font-medium">★ {selectedItem.rating}</span>
                    {selectedItem.rating_count && (
                      <span className="text-gray-600 ml-1">({selectedItem.rating_count} ratings)</span>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex items-center mt-3">
                <span className="text-2xl font-bold">₹{selectedItem.price}</span>
                {selectedItem.original_price && (
                  <span className="ml-2 text-gray-500 line-through">₹{selectedItem.original_price}</span>
                )}
              </div>
              
              {(selectedItem.calories || selectedItem.protein) && (
                <div className="flex mt-4 text-sm text-gray-600">
                  {selectedItem.calories && (
                    <div className="mr-4">
                      <span>Energy - {selectedItem.calories}kcal</span>
                    </div>
                  )}
                  {selectedItem.protein && (
                    <div>
                      <span>Protein - {selectedItem.protein}gm</span>
                    </div>
                  )}
                </div>
              )}
              
              <div className="mt-4">
                <p className="text-gray-700 text-base">{selectedItem.description}</p>
              </div>
              
              <button
                onClick={() => {
                  handleAddToCart(selectedItem);
                  setIsModalOpen(false);
                }}
                className="mt-6 w-full py-3 bg-black text-white font-medium rounded-lg"
              >
                ADD
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart floating pill - updated to be more stretched and fully clickable */}
      {cartItems.length > 0 && (
        <Link href="/cart">
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-[95%] max-w-md mx-auto bg-black text-white py-3 px-6 rounded-full flex justify-between items-center shadow-lg z-20 cursor-pointer hover:bg-gray-800 transition-all">
            <div className="flex items-center">
              <div className="bg-white text-black rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-2">
                {cartItems.reduce((total, item) => total + item.quantity, 0)}
              </div>
              <span className="font-medium">View Cart</span>
            </div>
            <div className="font-bold">₹{calculateCartTotal().toFixed(2)}</div>
          </div>
        </Link>
      )}

      {/* Floating menu button and categories submenu */}
      <div className="fixed bottom-20 right-4 z-10">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="w-12 h-12 rounded-full bg-black flex items-center justify-center shadow-lg text-white"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Categories popup menu */}
        {isMenuOpen && (
          <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-xl p-4 min-w-[180px] border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Jump to</h3>
            <div className="flex flex-col gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => scrollToCategory(category)}
                  className="text-left text-sm py-2 px-3 hover:bg-gray-100 rounded-md transition-colors"
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 