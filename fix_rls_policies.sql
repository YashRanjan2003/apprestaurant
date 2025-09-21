-- ================================================================
-- FIX RLS POLICIES FOR COUPON SYSTEM
-- Run this in your Supabase SQL Editor to fix the permission issues
-- ================================================================

-- Drop the problematic policies
DROP POLICY IF EXISTS "Authenticated users can manage coupons" ON public.coupons;
DROP POLICY IF EXISTS "Authenticated users can manage coupon usage" ON public.coupon_usage;

-- Create more permissive policies for coupons management
-- Option 1: Allow all authenticated users to manage coupons
CREATE POLICY "Allow authenticated users to manage coupons" ON public.coupons
    FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- Option 2: Allow all users (including anon) to manage coupons (for admin functionality)
-- Uncomment this if you want to allow anonymous admin access
-- CREATE POLICY "Allow all users to manage coupons" ON public.coupons
--     FOR ALL 
--     USING (true) 
--     WITH CHECK (true);

-- Create more permissive policies for coupon usage
CREATE POLICY "Allow authenticated users to manage coupon usage" ON public.coupon_usage
    FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);

-- Keep the public read policy for active coupons (for customer validation)
-- This one should remain as-is
-- CREATE POLICY "Public can read active coupons" ON public.coupons
--     FOR SELECT USING (is_active = true AND start_date <= now() AND end_date >= now());

-- If you still have issues, you can temporarily disable RLS for testing
-- IMPORTANT: Only use this for testing, not in production!
-- ALTER TABLE public.coupons DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.coupon_usage DISABLE ROW LEVEL SECURITY;

-- To re-enable RLS later (after testing):
-- ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

-- Verify the policies are created
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('coupons', 'coupon_usage')
ORDER BY tablename, policyname;