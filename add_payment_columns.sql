-- Add payment_id and payment_status columns to the orders table

-- Add payment_id column
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_id TEXT;

-- Add payment_status column
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_status TEXT 
CHECK (payment_status IN ('pending', 'completed', 'failed'));

-- Update RLS policies to include awaiting_payment status
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled', 'awaiting_payment'));

-- Comment on new columns
COMMENT ON COLUMN public.orders.payment_id IS 'Payment gateway reference ID';
COMMENT ON COLUMN public.orders.payment_status IS 'Status of payment (pending, completed, failed)';
