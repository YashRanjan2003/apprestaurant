// Razorpay integration utility functions

// Razorpay test credentials
const RAZORPAY_KEY_ID = 'rzp_test_De5qzj7KVmYOSn';

// Load Razorpay SDK dynamically
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// Initialize Razorpay payment
export const initializeRazorpayPayment = async ({
  amount,
  orderId,
  customerName,
  customerEmail,
  customerPhone,
  onSuccess,
  onFailure
}: {
  amount: number;
  orderId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  onSuccess: (paymentId: string, orderId: string, signature: string) => void;
  onFailure: (error: any) => void;
}) => {
  try {
    // Load Razorpay script
    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      onFailure(new Error('Failed to load Razorpay SDK'));
      return;
    }

    // Create options for Razorpay
    const options = {
      key: RAZORPAY_KEY_ID,
      amount: Math.round(amount * 100), // Razorpay expects amount in paise
      currency: 'INR',
      name: 'Restaurant',
      description: 'Food Order Payment',
      image: 'https://your-restaurant-logo.png', // Replace with your logo URL if available
      prefill: {
        name: customerName,
        email: customerEmail || '',
        contact: customerPhone,
      },
      theme: {
        color: '#000000',
      },
      handler: function (response: any) {
        // Handle successful payment
        console.log('Payment successful:', response);
        onSuccess(
          response.razorpay_payment_id || 'test_payment_id',
          orderId, // Use our internal order ID
          response.razorpay_signature || 'test_signature'
        );
      },
      modal: {
        ondismiss: function() {
          console.log('Checkout form closed');
          onFailure(new Error('Payment cancelled by user'));
        },
        escape: false,
        backdropclose: false
      },
      notes: {
        address: "Restaurant Address",
        merchant_order_id: orderId,
      },
    };

    // Create Razorpay object
    const razorpay = new (window as any).Razorpay(options);

    // Register event listeners
    razorpay.on('payment.failed', function (response: any) {
      console.log('Payment failed:', response.error);
      onFailure(new Error(response.error.description || 'Payment failed'));
    });

    // Open Razorpay checkout form
    razorpay.open();
  } catch (error) {
    console.error('Razorpay error:', error);
    onFailure(error);
  }
};

// Verify Razorpay payment (can be implemented on the server side)
export const verifyRazorpayPayment = (
  paymentId: string,
  orderId: string,
  signature: string
) => {
  // This verification should ideally be done on the server side
  // Here, we're just returning true for test purposes
  return true;
}; 