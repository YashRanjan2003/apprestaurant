-- Add customer information fields to orders table
ALTER TABLE IF EXISTS public.orders
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS customer_phone TEXT,
ADD COLUMN IF NOT EXISTS customer_email TEXT;

-- Make user_id nullable (if it's not already)
ALTER TABLE IF EXISTS public.orders
ALTER COLUMN user_id DROP NOT NULL;

-- First update all existing orders to have order_type = 'pickup'
UPDATE public.orders
SET order_type = 'pickup',
    delivery_address = NULL,
    delivery_charge = 0
WHERE order_type = 'delivery';

-- Update order_type to only allow 'pickup'
ALTER TABLE IF EXISTS public.orders
DROP CONSTRAINT IF EXISTS orders_order_type_check;

ALTER TABLE IF EXISTS public.orders
ADD CONSTRAINT orders_order_type_check CHECK (order_type = 'pickup');

-- Add index for order lookups by phone
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone 
ON public.orders(customer_phone);

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Allow users to view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Allow users to view their orders or guest orders by phone" ON public.orders;
DROP POLICY IF EXISTS "Allow authenticated users to create orders" ON public.orders;
DROP POLICY IF EXISTS "Allow users to create orders (authenticated or guest)" ON public.orders;

-- Create new policies
CREATE POLICY "Allow users to view their orders or guest orders by phone"
ON public.orders
FOR SELECT
USING (
  (auth.uid() = user_id) OR 
  (customer_phone IS NOT NULL AND user_id IS NULL)
);

CREATE POLICY "Allow users to create orders (authenticated or guest)"
ON public.orders
FOR INSERT
WITH CHECK (true);

COMMENT ON TABLE public.orders IS 'Customer orders with pickup-only service and support for both authenticated and guest customers'; 