'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/lib/context/CartContext';
import { useState } from 'react';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  isVeg?: boolean;
  rating?: number;
  ratingCount?: number;
  calories?: number;
  protein?: number;
  originalPrice?: number;
  offer?: string;
}

// Menu items with actual images
const menuItems: MenuItem[] = [
  // South Indian Specialties
  {
    id: '1',
    name: 'Masala Dosa',
    description: 'Crispy rice and lentil crepe filled with spiced potato, served with sambar and chutneys. Made with high-quality ingredients and traditional spices.',
    price: 149,
    originalPrice: 179,
    category: 'South Indian Specialties',
    imageUrl: '/assets/images/menu/masala-dosa.jpg',
    isVeg: true,
    rating: 4.4,
    ratingCount: 351,
    calories: 245,
    protein: 8,
    offer: 'Buy 1 Get 1 Free'
  },
  {
    id: '2',
    name: 'Medu Vada',
    description: 'Crispy lentil doughnuts seasoned with spices, curry leaves, and black pepper. A protein-rich South Indian delicacy.',
    price: 99,
    originalPrice: 129,
    category: 'South Indian Specialties',
    imageUrl: '/assets/images/menu/medu-vada.jpg',
    isVeg: true,
    rating: 4.3,
    ratingCount: 289,
    calories: 185,
    protein: 12
  },
  {
    id: '3',
    name: 'Fried Idli',
    description: 'Pan-fried rice cakes tossed with spices and curry leaves, served with chutney. A healthy twist on the classic idli.',
    price: 129,
    category: 'South Indian Specialties',
    imageUrl: '/assets/images/menu/fried-idli.jpg',
    isVeg: true,
    rating: 4.5,
    ratingCount: 156,
    calories: 165,
    protein: 6
  },
  // Gujarati Specialties
  {
    id: '4',
    name: 'Dhokla',
    description: 'Soft and spongy steamed snack made from fermented rice and chickpea batter, tempered with mustard seeds and curry leaves. High in protein, low in calories.',
    price: 89,
    originalPrice: 119,
    category: 'Gujarati Specialties',
    imageUrl: '/assets/images/menu/dhokla.jpg',
    isVeg: true,
    rating: 4.6,
    ratingCount: 423,
    calories: 120,
    protein: 10,
    offer: '25% OFF'
  },
  // Mumbai Street Food
  {
    id: '5',
    name: 'Pav Bhaji',
    description: 'Spiced mashed vegetables served with buttered pav bread, onions, and lemon. A Mumbai street food classic made healthy.',
    price: 159,
    category: 'Mumbai Street Food',
    imageUrl: '/assets/images/menu/pav bhaji.jpg',
    isVeg: true,
    rating: 4.7,
    ratingCount: 512,
    calories: 325,
    protein: 9
  },
  // Indo-Chinese
  {
    id: '6',
    name: 'Schezwan Noodles',
    description: 'Spicy stir-fried noodles with vegetables in a flavorful Schezwan sauce. Made with whole wheat noodles for added nutrition.',
    price: 179,
    originalPrice: 199,
    category: 'Indo-Chinese',
    imageUrl: '/assets/images/menu/noodles.jpg',
    isVeg: true,
    rating: 4.2,
    ratingCount: 345,
    calories: 385,
    protein: 14
  }
];

export default function MenuPage() {
  const { items, addItem, updateQuantity, calculateTotals, itemCount } = useCart();
  const [showCategories, setShowCategories] = useState(false);
  const [pureVegOnly, setPureVegOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDish, setSelectedDish] = useState<MenuItem | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Get just the itemTotal
  const { itemTotal } = calculateTotals();

  const getItemQuantity = (itemId: string) => {
    const cartItem = items.find(item => item.id === itemId);
    return cartItem?.quantity || 0;
  };

  // Filter items based on pure veg selection and search query
  const filteredItems = menuItems
    .filter(item => !pureVegOnly || item.isVeg)
    .filter(item => 
      searchQuery === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // Group items by category
  const categories = Array.from(new Set(filteredItems.map(item => item.category)));

  const scrollToCategory = (category: string) => {
    const element = document.getElementById(category);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setSelectedCategory(category);
    setShowCategories(false);
  };

  const handleCategoryClick = (category: string) => {
    setIsClosing(true);
    setTimeout(() => {
      scrollToCategory(category);
      setIsClosing(false);
    }, 200);
  };

  const handleDishClick = (dish: MenuItem) => {
    setSelectedDish(dish);
  };

  const handleCloseQuickLook = () => {
    setIsClosing(true);
    setTimeout(() => {
      setSelectedDish(null);
      setIsClosing(false);
    }, 300);
  };

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white z-10 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-gray-800">
            <span className="sr-only">Back</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-semibold">Menu</h1>
          <div className="w-6" />
        </div>
      </header>

      {/* Menu Content */}
      <main className="pt-16 px-4">
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 pr-4 rounded-lg border border-gray-200 focus:ring-2 focus:ring-black focus:border-black transition-colors"
            />
            <svg
              className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Pure Veg Toggle */}
        <div className="mb-6 flex justify-start">
          <button
            onClick={() => setPureVegOnly(!pureVegOnly)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm border transition-all duration-200 ${
              pureVegOnly 
                ? 'border-green-600 text-green-600 bg-green-50 shadow-sm'
                : 'border-gray-300 text-gray-600 hover:border-gray-400'
            }`}
          >
            <span className={`w-2 h-2 rounded-full transition-colors duration-200 ${pureVegOnly ? 'bg-green-600' : 'bg-gray-400'}`} />
            Pure Veg Only
          </button>
        </div>

        {categories.map(category => (
          <div key={category} id={category} className="mb-8">
            <h2 className="text-xl font-bold mb-4">{category}</h2>
            <div className="grid gap-4">
              {filteredItems
                .filter(item => item.category === category)
                .map((item) => (
                  <div key={item.id} className="bg-white rounded-lg shadow-sm p-4 flex gap-4">
                    <div 
                      className="w-24 h-24 relative rounded-lg flex-shrink-0 overflow-hidden cursor-pointer"
                      onClick={() => handleDishClick(item)}
                    >
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 96px) 96px, 96px"
                      />
                      {item.isVeg && (
                        <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-sm flex items-center justify-center">
                          <div className="w-3 h-3 border border-green-600 rounded-sm flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-green-600" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div 
                        className="cursor-pointer"
                        onClick={() => handleDishClick(item)}
                      >
                        <h3 className="font-semibold truncate">{item.name}</h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="font-semibold">₹{item.price.toFixed(2)}</span>
                        
                        {getItemQuantity(item.id) === 0 ? (
                          <button
                            className="bg-white text-green-600 px-4 py-2 rounded-full text-sm font-semibold border border-green-600 hover:bg-green-50 transition-colors"
                            onClick={() => addItem({
                              id: item.id,
                              name: item.name,
                              price: item.price,
                            })}
                          >
                            ADD
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full">
                            <button
                              className="w-8 h-8 flex items-center justify-center text-green-600 hover:bg-green-50 rounded-full"
                              onClick={() => updateQuantity(item.id, getItemQuantity(item.id) - 1)}
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-semibold">{getItemQuantity(item.id)}</span>
                            <button
                              className="w-8 h-8 flex items-center justify-center text-green-600 hover:bg-green-50 rounded-full"
                              onClick={() => updateQuantity(item.id, getItemQuantity(item.id) + 1)}
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
        ))}
      </main>

      {/* Quick Look Modal */}
      {selectedDish && (
        <>
          {/* Backdrop */}
          <div 
            className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
              isClosing ? 'opacity-0' : 'opacity-100'
            }`}
            onClick={handleCloseQuickLook}
          />
          
          {/* Modal */}
          <div 
            className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 transition-transform duration-300 transform ${
              isClosing ? 'translate-y-full' : 'translate-y-0'
            }`}
            style={{ maxHeight: '85vh' }}
          >
            {/* Drag Handle */}
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 mb-2" />

            <div className="relative p-4">
              {/* Close Button */}
              <button 
                onClick={handleCloseQuickLook}
                className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 z-10 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Image */}
              <div className="w-full h-64 relative rounded-2xl overflow-hidden mb-4">
                <Image
                  src={selectedDish.imageUrl}
                  alt={selectedDish.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 768px"
                />
                {selectedDish.offer && (
                  <div className="absolute top-4 left-4 bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm font-medium">
                    {selectedDish.offer}
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-xl font-bold">{selectedDish.name}</h2>
                      {selectedDish.isVeg && (
                        <div className="w-4 h-4 bg-white rounded-sm flex items-center justify-center border border-green-600">
                          <div className="w-2 h-2 rounded-full bg-green-600" />
                        </div>
                      )}
                    </div>
                    {selectedDish.rating && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="flex items-center gap-1 bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          {selectedDish.rating}
                        </span>
                        <span className="text-gray-500">({selectedDish.ratingCount} ratings)</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      {selectedDish.originalPrice && (
                        <span className="text-gray-500 line-through">₹{selectedDish.originalPrice}</span>
                      )}
                      <span className="text-xl font-bold">₹{selectedDish.price}</span>
                    </div>
                  </div>
                </div>

                {(selectedDish.calories || selectedDish.protein) && (
                  <div className="flex gap-4 text-sm text-gray-600 border-t border-b border-gray-100 py-3">
                    {selectedDish.calories && (
                      <div>
                        <span className="font-medium">Energy - </span>
                        {selectedDish.calories}kcal
                      </div>
                    )}
                    {selectedDish.protein && (
                      <div>
                        <span className="font-medium">Protein - </span>
                        {selectedDish.protein}gm
                      </div>
                    )}
                  </div>
                )}

                <p className="text-gray-600">{selectedDish.description}</p>

                <div className="pt-4">
                  {getItemQuantity(selectedDish.id) === 0 ? (
                    <button
                      className="w-full bg-black text-white py-3 rounded-full text-sm font-semibold hover:bg-gray-800 transition-colors"
                      onClick={() => {
                        addItem({
                          id: selectedDish.id,
                          name: selectedDish.name,
                          price: selectedDish.price,
                        });
                        handleCloseQuickLook();
                      }}
                    >
                      ADD
                    </button>
                  ) : (
                    <div className="flex items-center justify-center gap-3 bg-black text-white py-2 rounded-full">
                      <button
                        className="w-12 h-8 flex items-center justify-center hover:bg-gray-800 rounded-full"
                        onClick={() => updateQuantity(selectedDish.id, getItemQuantity(selectedDish.id) - 1)}
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-semibold">{getItemQuantity(selectedDish.id)}</span>
                      <button
                        className="w-12 h-8 flex items-center justify-center hover:bg-gray-800 rounded-full"
                        onClick={() => updateQuantity(selectedDish.id, getItemQuantity(selectedDish.id) + 1)}
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Categories Quick Navigation */}
      <div className={`fixed right-4 z-20 transition-all duration-300 ${
        itemCount > 0 ? 'bottom-32' : 'bottom-8'
      }`}>
        <button
          onClick={() => {
            if (showCategories && !isClosing) {
              setIsClosing(true);
              setTimeout(() => {
                setShowCategories(false);
                setIsClosing(false);
              }, 200);
            } else if (!showCategories) {
              setShowCategories(true);
            }
          }}
          className="w-12 h-12 bg-black text-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-800 transition-all duration-200 active:scale-95"
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
            className={`absolute bottom-14 right-0 bg-white rounded-lg shadow-xl p-2 min-w-[200px]
              animate-${isClosing ? 'slideOut' : 'slideIn'} origin-bottom-right`}
            style={{
              animation: isClosing 
                ? 'slideOut 0.2s ease-out forwards'
                : 'slideIn 0.2s ease-out forwards'
            }}
          >
            {categories.map(category => (
              <button
                key={category}
                onClick={() => handleCategoryClick(category)}
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

      {/* Add these styles to your CSS */}
      <style jsx global>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes slideOut {
          from {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          to {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
        }
      `}</style>

      {/* Fixed Cart Button */}
      {itemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
          <div className="max-w-md mx-auto">
            <Link
              href="/cart"
              className="flex items-center justify-between bg-black text-white p-4 rounded-full shadow-lg hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="bg-white text-black w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold">
                  {itemCount}
                </span>
                <span className="font-semibold">View Cart</span>
              </div>
              <span className="font-semibold">₹{itemTotal.toFixed(2)}</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
} 