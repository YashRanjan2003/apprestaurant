'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  imageUrl: string;
}

interface Discount {
  code: string;
  type: 'PERCENTAGE' | 'FIXED' | 'BOGO';
  value: number;
  discountAmount: number;
  minOrderValue?: number;
  maxDiscount?: number;
}

interface CartTotals {
  itemTotal: number;
  gst: number;
  platformFee: number;
  deliveryCharge: number;
  discount: number;
  finalTotal: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  calculateTotals: () => CartTotals;
  applyDiscount: (code: string) => Promise<{ success: boolean; error?: string }>;
  removeDiscount: () => void;
  activeDiscount: Discount | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const PLATFORM_FEE = 15.00;
const DELIVERY_CHARGE = 40.00;
const FREE_DELIVERY_THRESHOLD = 500.00;
const GST_RATE = 0.05; // 5%

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [activeDiscount, setActiveDiscount] = useState<Discount | null>(null);

  // Memoize cart operations
  const addItem = useCallback((newItem: Omit<CartItem, 'quantity'>) => {
    setItems(currentItems => {
      const existingItem = currentItems.find(item => item.id === newItem.id);
      if (existingItem) {
        return currentItems.map(item =>
          item.id === newItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...currentItems, { ...newItem, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(currentItems => currentItems.filter(item => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(id);
      return;
    }
    setItems(currentItems =>
      currentItems.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
    setActiveDiscount(null);
  }, []);

  // Memoize calculations
  const calculateTotals = useCallback((): CartTotals => {
    const itemTotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    
    const gst = itemTotal * GST_RATE;
    const platformFee = PLATFORM_FEE;
    const deliveryCharge = itemTotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;
    
    let discount = 0;
    if (activeDiscount) {
      if (activeDiscount.type === 'PERCENTAGE') {
        discount = (itemTotal * activeDiscount.value) / 100;
        if (activeDiscount.maxDiscount) {
          discount = Math.min(discount, activeDiscount.maxDiscount);
        }
      } else if (activeDiscount.type === 'FIXED') {
        discount = activeDiscount.value;
      }
    }

    const finalTotal = itemTotal + gst + platformFee + deliveryCharge - discount;

    return {
      itemTotal,
      gst,
      platformFee,
      deliveryCharge,
      discount,
      finalTotal
    };
  }, [items, activeDiscount]);

  // Debounced discount validation
  const applyDiscount = useCallback(async (code: string) => {
    try {
      const { itemTotal } = calculateTotals();
      const categories = [...new Set(items.map(item => item.category))];

      const response = await fetch('/api/discounts/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          cartTotal: itemTotal,
          categories,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setActiveDiscount(data.discount);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to apply discount',
      };
    }
  }, [items, calculateTotals]);

  const removeDiscount = useCallback(() => {
    setActiveDiscount(null);
  }, []);

  // Memoize item count
  const itemCount = useMemo(() => 
    items.reduce((count, item) => count + item.quantity, 0),
    [items]
  );

  // Memoize context value
  const contextValue = useMemo(() => ({
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    itemCount,
    calculateTotals,
    applyDiscount,
    removeDiscount,
    activeDiscount,
  }), [
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    itemCount,
    calculateTotals,
    applyDiscount,
    removeDiscount,
    activeDiscount,
  ]);

  // Load cart data only once on mount
  useEffect(() => {
    const loadSavedData = () => {
      const savedCart = localStorage.getItem('cart');
      const savedDiscount = localStorage.getItem('cartDiscount');
      
      if (savedCart) {
        try {
          setItems(JSON.parse(savedCart));
        } catch (error) {
          console.error('Failed to parse cart from localStorage:', error);
        }
      }
      
      if (savedDiscount) {
        try {
          setActiveDiscount(JSON.parse(savedDiscount));
        } catch (error) {
          console.error('Failed to parse discount from localStorage:', error);
        }
      }
    };

    loadSavedData();
  }, []);

  // Debounce localStorage updates
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      localStorage.setItem('cart', JSON.stringify(items));
    }, 300);
    return () => clearTimeout(saveTimeout);
  }, [items]);

  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      if (activeDiscount) {
        localStorage.setItem('cartDiscount', JSON.stringify(activeDiscount));
      } else {
        localStorage.removeItem('cartDiscount');
      }
    }, 300);
    return () => clearTimeout(saveTimeout);
  }, [activeDiscount]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
} 