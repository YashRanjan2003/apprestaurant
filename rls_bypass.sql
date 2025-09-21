-- IMMEDIATE FIX: Complete RLS bypass for development
-- Copy and paste this entire block into Supabase SQL Editor and run it

-- 1. Disable RLS entirely on coupon tables
ALTER TABLE public.coupons DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage DISABLE ROW LEVEL SECURITY;

-- 2. Drop all existing policies that might be interfering
DROP POLICY IF EXISTS "Public can read active coupons" ON public.coupons;
DROP POLICY IF EXISTS "Authenticated users can manage coupons" ON public.coupons;
DROP POLICY IF EXISTS "Allow authenticated users to manage coupons" ON public.coupons;
DROP POLICY IF EXISTS "Allow all users to manage coupons" ON public.coupons;
DROP POLICY IF EXISTS "Users can read own coupon usage" ON public.coupon_usage;
DROP POLICY IF EXISTS "Authenticated users can manage coupon usage" ON public.coupon_usage;
DROP POLICY IF EXISTS "Allow authenticated users to manage coupon usage" ON public.coupon_usage;

-- 3. Verify tables exist and RLS is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN 'ENABLED (❌ - this might cause issues)'
        ELSE 'DISABLED (✅ - good for development)'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('coupons', 'coupon_usage')
ORDER BY tablename;

-- 4. Show current policies (should be empty after this)
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as policy_type
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('coupons', 'coupon_usage')
ORDER BY tablename, policyname;