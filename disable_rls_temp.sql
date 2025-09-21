-- ================================================================
-- TEMPORARY FIX: DISABLE RLS FOR TESTING
-- Run this in Supabase SQL Editor for quick testing
-- WARNING: This disables security - only use for development/testing
-- ================================================================

-- Temporarily disable RLS on coupon tables
ALTER TABLE public.coupons DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename IN ('coupons', 'coupon_usage');

-- This should show 'f' (false) for rowsecurity column

-- REMEMBER TO RE-ENABLE RLS LATER:
-- ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;