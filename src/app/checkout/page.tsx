'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useCart } from '@/lib/context/CartContext';
import { createOrder, updateOrderPayment } from '@/lib/supabase/orders';
import { initializeRazorpayPayment } from '@/lib/utils/razorpay';
import { getPlatformFees, getRestaurantSettings, isRestaurantOpen } from '@/lib/supabase/settings';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart, calculateTotals } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');
  const [orderError, setOrderError] = useState<string | null>(null);
  const [totals, setTotals] = useState({
    itemTotal: 0,
    gst: 0,
    platformFee: 0,
    deliveryCharge: 0,
    finalTotal: 0
  });
  const [taxRate, setTaxRate] = useState(5); // Default to 5% but will be updated from settings
  const [paymentSettings, setPaymentSettings] = useState({
    accept_credit_cards: true,
    accept_cash: true
  });
  
  // Customer information fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  // Calculate totals, tax rate, and payment settings whenever items change
  useEffect(() => {
    const loadSettingsAndTotals = async () => {
      const [calculatedTotals, fees, restaurantSettings] = await Promise.all([
        calculateTotals(),
        getPlatformFees(),
        getRestaurantSettings()
      ]);
      
      setTotals(calculatedTotals);
      setTaxRate(Math.round(fees.gstRate * 100)); // Convert decimal to percentage
      
      if (restaurantSettings) {
        setPaymentSettings({
          accept_credit_cards: restaurantSettings.accept_credit_cards ?? true,
          accept_cash: restaurantSettings.accept_cash ?? true
        });
      }
    };
    loadSettingsAndTotals();
  }, [items, calculateTotals]);

  const finalAmount = totals.finalTotal - totals.deliveryCharge;
  
  // Is ASAP delivery selected?
  const isASAPPickup = scheduledTime === '';

  // Update payment method when pickup time or settings change
  useEffect(() => {
    // If not ASAP and payment method is cash, switch to card
    if (!isASAPPickup && paymentMethod === 'cash') {
      if (paymentSettings.accept_credit_cards) {
        setPaymentMethod('card');
      }
    }
    
    // If current payment method is not available, switch to an available one
    if (paymentMethod === 'card' && !paymentSettings.accept_credit_cards) {
      if (paymentSettings.accept_cash) {
        setPaymentMethod('cash');
      }
    } else if (paymentMethod === 'cash' && !paymentSettings.accept_cash) {
      if (paymentSettings.accept_credit_cards) {
        setPaymentMethod('card');
      }
    }
  }, [scheduledTime, isASAPPickup, paymentMethod, paymentSettings]);

  useEffect(() => {
    // Check if we have items in the cart
    if (items.length === 0) {
      router.push('/menu');
    }
  }, [items.length, router]);

  // If no items, the useEffect will handle redirection
  if (items.length === 0) {
    return null;
  }

  const formatScheduledTime = () => {
    if (!scheduledTime || scheduledTime === '') return new Date().toISOString();
    
    // For relative times (30, 60, 90, 120 minutes)
    const minutes = parseInt(scheduledTime, 10);
    if (!isNaN(minutes)) {
      const date = new Date();
      date.setMinutes(date.getMinutes() + minutes);
      return date.toISOString();
    }
    
    return new Date().toISOString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    
    setIsProcessing(true);
    setOrderError(null);

    try {
      // Check if restaurant is still open before placing order
      const restaurantIsOpen = await isRestaurantOpen();
      if (!restaurantIsOpen) {
        setOrderError('Sorry, the restaurant is currently closed. Please try again during our operating hours.');
        setIsProcessing(false);
        return;
      }
      // Format the order data for Supabase
      const formattedScheduledTime = formatScheduledTime();
      
      // Prepare order items
      const orderItems = items.map(item => ({
        menu_item_id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      }));
      
      // Create the order data structure
      const orderData = {
        user_id: null, // No user ID for guest checkout
        order_type: 'pickup' as const, // Explicitly type as 'pickup'
        delivery_address: null,
        scheduled_time: formattedScheduledTime,
        payment_method: paymentMethod,
        item_total: totals.itemTotal,
        gst: totals.gst,
        platform_fee: totals.platformFee,
        delivery_charge: 0, // No delivery charge since only pickup is available
        final_total: finalAmount,
        order_items: orderItems,
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: customerEmail || null
      };

      // Submit order to Supabase
      const { orderId, otp } = await createOrder(orderData);
      
      // Build order details for localStorage (for confirmation page)
      const orderDetails = {
        id: orderId,
        items,
        itemTotal: totals.itemTotal,
        gst: totals.gst,
        platformFee: totals.platformFee,
        deliveryCharge: 0,
        finalTotal: finalAmount,
        orderType: 'pickup',
        deliveryAddress: null,
        scheduledTime: scheduledTime || 'ASAP',
        paymentMethod,
        otp,
        customer: {
          name: customerName,
          phone: customerPhone,
          email: customerEmail || null,
        },
        status: paymentMethod === 'cash' ? 'confirmed' : 'awaiting_payment',
        createdAt: new Date().toISOString(),
      };

      // Clear the cart 
      clearCart();

      // Store order details in localStorage
      localStorage.setItem('lastOrder', JSON.stringify(orderDetails));

      // If payment method is card, initialize Razorpay
      if (paymentMethod === 'card') {
        try {
          await initializeRazorpayPayment({
            amount: finalAmount,
            orderId: orderId,
            customerName: customerName,
            customerEmail: customerEmail,
            customerPhone: customerPhone,
            onSuccess: async (paymentId, _, __) => {
              try {
                console.log(`Payment successful: ID ${paymentId}`);
                // Update order payment status
                await updateOrderPayment(orderId, paymentId, 'completed');
                
                // Update stored order details
                const updatedOrderDetails = {
                  ...orderDetails,
                  status: 'confirmed',
                  paymentId,
                };
                localStorage.setItem('lastOrder', JSON.stringify(updatedOrderDetails));
                
                // Navigate to confirmation page
                window.location.href = '/checkout/confirmation';
              } catch (error) {
                console.error('Error updating payment status:', error);
                // Still redirect to confirmation, but with the original order details
                window.location.href = '/checkout/confirmation';
              }
            },
            onFailure: async (error) => {
              console.error('Payment failed or cancelled:', error?.message || error);
              
              try {
                // Update order payment status
                await updateOrderPayment(orderId, 'failed', 'failed');
                
                // Update stored order details
                const updatedOrderDetails = {
                  ...orderDetails,
                  status: 'cancelled',
                };
                localStorage.setItem('lastOrder', JSON.stringify(updatedOrderDetails));
              } catch (err) {
                console.error('Error updating payment status:', err);
              }
              
              // Show error and allow retry
              setOrderError('Payment failed or was cancelled. Please try again.');
              setIsProcessing(false);
            }
          });
        } catch (error) {
          console.error('Razorpay initialization failed:', error);
          setOrderError('Failed to initialize payment gateway. Please try again.');
          setIsProcessing(false);
        }
      } else {
        // For cash payments, redirect immediately
        window.location.href = '/checkout/confirmation';
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      setOrderError('Something went wrong while processing your order. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white shadow-sm">
      <header className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center">
          <Link href="/cart" className="text-gray-800">
            <span className="sr-only">Back to Cart</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-xl font-semibold ml-4">Checkout</h1>
        </div>
      </header>

      <main className="flex-1 p-4">
        {orderError && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
            {orderError}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Details */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h2 className="font-semibold mb-3">Your Information</h2>
            <div className="space-y-3">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name*
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="Enter your full name"
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number*
                </label>
                <input
                  id="phone"
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="Enter your phone number"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email (Optional)
                </label>
                <input
                  id="email"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-black focus:border-black"
                  placeholder="Enter your email address"
                />
              </div>
            </div>
          </div>

          {/* Pickup Information Section */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h2 className="font-semibold mb-3">Pickup Information</h2>
            <p className="text-sm text-gray-600 mb-3">
              Your order will be available for pickup at our restaurant.
              {/* Add restaurant address here if available */}
            </p>
          </div>

          {/* Scheduled Time */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
              Pickup Time
            </label>
            <select
              id="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-black focus:border-black"
            >
              <option value="">ASAP</option>
              <option value="30">In 30 minutes</option>
              <option value="60">In 1 hour</option>
              <option value="90">In 1.5 hours</option>
              <option value="120">In 2 hours</option>
            </select>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h2 className="font-semibold mb-3">Payment Method</h2>
            <div className="flex gap-4">
              {paymentSettings.accept_credit_cards && (
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`flex-1 py-2 rounded-full border-2 ${
                    paymentMethod === 'card'
                      ? 'border-black bg-black text-white'
                      : 'border-gray-200 text-gray-700'
                  }`}
                >
                  Card
                </button>
              )}
              {paymentSettings.accept_cash && isASAPPickup && (
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`flex-1 py-2 rounded-full border-2 ${
                    paymentMethod === 'cash'
                      ? 'border-black bg-black text-white'
                      : 'border-gray-200 text-gray-700'
                  }`}
                >
                  Cash
                </button>
              )}
            </div>
            
            {!paymentSettings.accept_credit_cards && !paymentSettings.accept_cash && (
              <p className="mt-2 text-sm text-red-600">
                No payment methods are currently available. Please contact the restaurant.
              </p>
            )}
            
            {paymentMethod === 'card' && paymentSettings.accept_credit_cards && (
              <p className="mt-2 text-sm text-gray-600">
                You'll be redirected to our secure payment partner Razorpay to complete your payment.
              </p>
            )}
            
            {!isASAPPickup && paymentSettings.accept_cash && (
              <p className="mt-2 text-sm text-gray-600">
                Cash payment is only available for ASAP pickup orders.
              </p>
            )}
            
            {!paymentSettings.accept_credit_cards && paymentSettings.accept_cash && (
              <p className="mt-2 text-sm text-gray-600">
                Only cash payments are accepted for pickup orders.
              </p>
            )}
            
            {paymentSettings.accept_credit_cards && !paymentSettings.accept_cash && (
              <p className="mt-2 text-sm text-gray-600">
                Only card payments are accepted.
              </p>
            )}
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h2 className="font-semibold mb-3">Order Summary</h2>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.quantity}x {item.name}
                  </span>
                  <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Item Total</span>
                  <span>₹{totals.itemTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">GST ({taxRate}%)</span>
                  <span>₹{totals.gst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Platform Fee</span>
                  <span>₹{totals.platformFee.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="font-semibold">₹{finalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isProcessing || (!paymentSettings.accept_credit_cards && !paymentSettings.accept_cash)}
            className={`w-full py-3 rounded-lg font-medium ${
              isProcessing || (!paymentSettings.accept_credit_cards && !paymentSettings.accept_cash)
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-black text-white hover:bg-gray-800'
            } transition-colors`}
          >
            {isProcessing ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : (
              paymentMethod === 'card' ? 'Pay & Place Order' : 'Place Order'
            )}
          </button>
        </form>
      </main>
    </div>
  );
} 