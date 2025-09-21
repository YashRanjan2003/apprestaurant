-- ================================================================
-- COUPON SYSTEM DATABASE MIGRATION
-- Run this in your Supabase SQL Editor
-- ================================================================

-- First, check if tables already exist and drop if needed (CAREFUL!)
-- Only uncomment the lines below if you want to recreate existing tables
-- DROP TABLE IF EXISTS public.coupon_usage CASCADE;
-- DROP TABLE IF EXISTS public.coupons CASCADE;

-- Create coupons table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')) NOT NULL,
    discount_value DECIMAL(10,2) NOT NULL,
    minimum_order_amount DECIMAL(10,2) DEFAULT 0,
    maximum_discount_amount DECIMAL(10,2),
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    per_user_limit INTEGER DEFAULT 1,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create coupon_usage table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.coupon_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    coupon_id UUID REFERENCES public.coupons(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id),
    order_id UUID REFERENCES public.orders(id),
    discount_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add coupon fields to orders table if they don't exist
DO $$
BEGIN
    -- Check if coupon_id column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'coupon_id') THEN
        ALTER TABLE public.orders ADD COLUMN coupon_id UUID REFERENCES public.coupons(id);
    END IF;
    
    -- Check if coupon_code column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'coupon_code') THEN
        ALTER TABLE public.orders ADD COLUMN coupon_code TEXT;
    END IF;
    
    -- Check if discount_amount column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'discount_amount') THEN
        ALTER TABLE public.orders ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0;
    END IF;
END $$;

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active_dates ON public.coupons(is_active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon_user ON public.coupon_usage(coupon_id, user_id);
CREATE INDEX IF NOT EXISTS idx_orders_coupon ON public.orders(coupon_id);

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS update_coupons_updated_at ON public.coupons;
CREATE TRIGGER update_coupons_updated_at 
    BEFORE UPDATE ON public.coupons
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate them
DROP POLICY IF EXISTS "Public can read active coupons" ON public.coupons;
DROP POLICY IF EXISTS "Authenticated users can manage coupons" ON public.coupons;
DROP POLICY IF EXISTS "Users can read own coupon usage" ON public.coupon_usage;
DROP POLICY IF EXISTS "Authenticated users can manage coupon usage" ON public.coupon_usage;

-- Create policies
CREATE POLICY "Public can read active coupons" ON public.coupons
    FOR SELECT USING (is_active = true AND start_date <= now() AND end_date >= now());

CREATE POLICY "Authenticated users can manage coupons" ON public.coupons
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can read own coupon usage" ON public.coupon_usage
    FOR SELECT USING (user_id = (SELECT id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Authenticated users can manage coupon usage" ON public.coupon_usage
    FOR ALL USING (auth.role() = 'authenticated');

-- Create or replace validation function
CREATE OR REPLACE FUNCTION validate_coupon(
    coupon_code TEXT,
    user_id_param UUID,
    order_total DECIMAL(10,2)
)
RETURNS JSON AS $$
DECLARE
    coupon_record RECORD;
    user_usage_count INTEGER;
    discount_amount DECIMAL(10,2);
    result JSON;
BEGIN
    -- Get coupon details
    SELECT * INTO coupon_record
    FROM public.coupons
    WHERE code = coupon_code
      AND is_active = true
      AND start_date <= now()
      AND end_date >= now();
    
    -- Check if coupon exists and is valid
    IF coupon_record IS NULL THEN
        RETURN json_build_object(
            'valid', false,
            'error', 'Coupon code is invalid or expired'
        );
    END IF;
    
    -- Check minimum order amount
    IF order_total < coupon_record.minimum_order_amount THEN
        RETURN json_build_object(
            'valid', false,
            'error', format('Minimum order amount is ₹%s', coupon_record.minimum_order_amount)
        );
    END IF;
    
    -- Check total usage limit
    IF coupon_record.usage_limit IS NOT NULL AND coupon_record.used_count >= coupon_record.usage_limit THEN
        RETURN json_build_object(
            'valid', false,
            'error', 'Coupon usage limit exceeded'
        );
    END IF;
    
    -- Check per-user usage limit
    IF user_id_param IS NOT NULL THEN
        SELECT COUNT(*) INTO user_usage_count
        FROM public.coupon_usage
        WHERE coupon_id = coupon_record.id AND user_id = user_id_param;
        
        IF coupon_record.per_user_limit IS NOT NULL AND user_usage_count >= coupon_record.per_user_limit THEN
            RETURN json_build_object(
                'valid', false,
                'error', 'You have already used this coupon'
            );
        END IF;
    END IF;
    
    -- Calculate discount amount
    IF coupon_record.discount_type = 'percentage' THEN
        discount_amount := order_total * (coupon_record.discount_value / 100);
        IF coupon_record.maximum_discount_amount IS NOT NULL THEN
            discount_amount := LEAST(discount_amount, coupon_record.maximum_discount_amount);
        END IF;
    ELSE
        discount_amount := coupon_record.discount_value;
    END IF;
    
    -- Ensure discount doesn't exceed order total
    discount_amount := LEAST(discount_amount, order_total);
    
    RETURN json_build_object(
        'valid', true,
        'coupon_id', coupon_record.id,
        'discount_amount', discount_amount,
        'discount_type', coupon_record.discount_type,
        'discount_value', coupon_record.discount_value,
        'name', coupon_record.name,
        'description', coupon_record.description
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace coupon usage function
CREATE OR REPLACE FUNCTION record_coupon_usage(
    coupon_id_param UUID,
    user_id_param UUID,
    order_id_param UUID,
    discount_amount_param DECIMAL(10,2)
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Insert coupon usage record
    INSERT INTO public.coupon_usage (coupon_id, user_id, order_id, discount_amount)
    VALUES (coupon_id_param, user_id_param, order_id_param, discount_amount_param);
    
    -- Update coupon used count
    UPDATE public.coupons
    SET used_count = used_count + 1
    WHERE id = coupon_id_param;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert a test coupon for verification
INSERT INTO public.coupons (
    code, 
    name, 
    description, 
    discount_type, 
    discount_value, 
    minimum_order_amount, 
    maximum_discount_amount, 
    usage_limit, 
    per_user_limit, 
    start_date, 
    end_date, 
    is_active
) VALUES (
    'TEST20',
    'Test 20% Off',
    'Test coupon for 20% discount',
    'percentage',
    20.00,
    100.00,
    200.00,
    100,
    1,
    now(),
    now() + interval '30 days',
    true
) ON CONFLICT (code) DO NOTHING;

-- Verification query - run this to check if everything worked
SELECT 
    'Coupons table created' as status,
    count(*) as total_coupons 
FROM public.coupons
UNION ALL
SELECT 
    'Coupon usage table created' as status,
    count(*) as total_usage 
FROM public.coupon_usage;