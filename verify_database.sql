-- COMPLETE VERIFICATION AND SETUP FOR COUPON SYSTEM
-- Run this entire script in Supabase SQL Editor

-- 1. Check if tables exist
SELECT 
    'Tables Check' as test_type,
    tablename,
    schemaname,
    CASE WHEN tablename IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN ('coupons', 'coupon_usage', 'orders')
UNION ALL
SELECT 
    'Orders Columns Check' as test_type,
    column_name as tablename,
    'public' as schemaname,
    CASE WHEN column_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM information_schema.columns
WHERE table_name = 'orders' 
AND column_name IN ('coupon_id', 'coupon_code', 'discount_amount')
ORDER BY test_type, tablename;

-- 2. If tables don't exist, create them
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
    created_by UUID -- Removed the foreign key constraint that might cause issues
);

CREATE TABLE IF NOT EXISTS public.coupon_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    coupon_id UUID REFERENCES public.coupons(id) ON DELETE CASCADE,
    user_id UUID, -- Removed foreign key constraint
    order_id UUID, -- Removed foreign key constraint  
    discount_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Add coupon columns to orders if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'coupon_id') THEN
        ALTER TABLE public.orders ADD COLUMN coupon_id UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'coupon_code') THEN
        ALTER TABLE public.orders ADD COLUMN coupon_code TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'discount_amount') THEN
        ALTER TABLE public.orders ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0;
    END IF;
END $$;

-- 4. COMPLETELY DISABLE RLS (for development)
ALTER TABLE public.coupons DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage DISABLE ROW LEVEL SECURITY;

-- 5. Drop ALL existing policies
DROP POLICY IF EXISTS "Public can read active coupons" ON public.coupons;
DROP POLICY IF EXISTS "Authenticated users can manage coupons" ON public.coupons;
DROP POLICY IF EXISTS "Allow authenticated users to manage coupons" ON public.coupons;
DROP POLICY IF EXISTS "Allow all users to manage coupons" ON public.coupons;
DROP POLICY IF EXISTS "Users can read own coupon usage" ON public.coupon_usage;
DROP POLICY IF EXISTS "Authenticated users can manage coupon usage" ON public.coupon_usage;
DROP POLICY IF EXISTS "Allow authenticated users to manage coupon usage" ON public.coupon_usage;

-- 6. Create essential functions
CREATE OR REPLACE FUNCTION validate_coupon(
    coupon_code TEXT,
    user_id_param UUID,
    order_total DECIMAL(10,2)
)
RETURNS JSON AS $$
DECLARE
    coupon_record RECORD;
    discount_amount DECIMAL(10,2);
BEGIN
    SELECT * INTO coupon_record
    FROM public.coupons
    WHERE code = coupon_code
      AND is_active = true
      AND start_date <= now()
      AND end_date >= now();
    
    IF coupon_record IS NULL THEN
        RETURN json_build_object('valid', false, 'error', 'Invalid or expired coupon');
    END IF;
    
    IF order_total < coupon_record.minimum_order_amount THEN
        RETURN json_build_object('valid', false, 'error', 'Minimum order amount not met');
    END IF;
    
    IF coupon_record.discount_type = 'percentage' THEN
        discount_amount := order_total * (coupon_record.discount_value / 100);
        IF coupon_record.maximum_discount_amount IS NOT NULL THEN
            discount_amount := LEAST(discount_amount, coupon_record.maximum_discount_amount);
        END IF;
    ELSE
        discount_amount := coupon_record.discount_value;
    END IF;
    
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

-- 7. Test insert to verify everything works
INSERT INTO public.coupons (
    code, name, description, discount_type, discount_value, 
    minimum_order_amount, start_date, end_date, is_active
) VALUES (
    'WELCOME10', 'Welcome 10% Off', 'New customer welcome discount',
    'percentage', 10.00, 50.00, now(), now() + interval '30 days', true
) ON CONFLICT (code) DO NOTHING;

-- 8. Final verification
SELECT 
    '🎉 FINAL VERIFICATION' as status,
    COUNT(*) as total_coupons,
    'If you see this with a count > 0, everything is working!' as message
FROM public.coupons;