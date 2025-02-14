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
}

// Menu items with actual images
const menuItems: MenuItem[] = [
  // South Indian Specialties
  {
    id: '1',
    name: 'Masala Dosa',
    description: 'Crispy rice and lentil crepe filled with spiced potato, served with sambar and chutneys',
    price: 149,
    category: 'South Indian Specialties',
    imageUrl: '/assets/images/menu/masala-dosa.jpg',
    isVeg: true
  },
  {
    id: '2',
    name: 'Medu Vada',
    description: 'Crispy lentil doughnuts seasoned with spices, curry leaves, and black pepper',
    price: 99,
    category: 'South Indian Specialties',
    imageUrl: '/assets/images/menu/medu-vada.jpg',
    isVeg: true
  },
  {
    id: '3',
    name: 'Fried Idli',
    description: 'Pan-fried rice cakes tossed with spices and curry leaves, served with chutney',
    price: 129,
    category: 'South Indian Specialties',
    imageUrl: '/assets/images/menu/fried-idli.jpg',
    isVeg: true
  },
  // Gujarati Specialties
  {
    id: '4',
    name: 'Dhokla',
    description: 'Soft and spongy steamed snack made from fermented rice and chickpea batter, tempered with mustard seeds and curry leaves',
    price: 89,
    category: 'Gujarati Specialties',
    imageUrl: '/assets/images/menu/dhokla.jpg',
    isVeg: true
  },
  // Mumbai Street Food
  {
    id: '5',
    name: 'Pav Bhaji',
    description: 'Spiced mashed vegetables served with buttered pav bread, onions, and lemon',
    price: 159,
    category: 'Mumbai Street Food',
    imageUrl: '/assets/images/menu/pav bhaji.jpg',
    isVeg: true
  },
  // Indo-Chinese
  {
    id: '6',
    name: 'Schezwan Noodles',
    description: 'Spicy stir-fried noodles with vegetables in a flavorful Schezwan sauce',
    price: 179,
    category: 'Indo-Chinese',
    imageUrl: '/assets/images/menu/noodles.jpg',
    isVeg: true
  }
];

export default function MenuPage() {
  const { items, addItem, updateQuantity, total, itemCount } = useCart();
  const [showCategories, setShowCategories] = useState(false);
  const [pureVegOnly, setPureVegOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Add state for animation
  const [isClosing, setIsClosing] = useState(false);

  const getItemQuantity = (itemId: string) => {
    const cartItem = items.find(item => item.id === itemId);
    return cartItem?.quantity || 0;
  };

  // Filter items based on pure veg selection
  const filteredItems = pureVegOnly 
    ? menuItems.filter(item => item.isVeg)
    : menuItems;

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
                    <div className="w-24 h-24 relative rounded-lg flex-shrink-0 overflow-hidden">
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 96px) 96px, 96px"
                      />
                      {/* Veg indicator */}
                      {item.isVeg && (
                        <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-sm flex items-center justify-center">
                          <div className="w-3 h-3 border border-green-600 rounded-sm flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-green-600" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{item.name}</h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>
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

      {/* Categories Quick Navigation */}
      <div className="fixed bottom-20 right-4 z-20">
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
              <span className="font-semibold">₹{total.toFixed(2)}</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
} 