import { supabase } from './client';
import type { Database } from './types';

type Coupon = Database['public']['Tables']['coupons']['Row'];
type CouponInsert = Database['public']['Tables']['coupons']['Insert'];
type CouponUpdate = Database['public']['Tables']['coupons']['Update'];
type CouponUsage = Database['public']['Tables']['coupon_usage']['Row'];

export interface CouponValidationResult {
  valid: boolean;
  error?: string;
  coupon_id?: string;
  discount_amount?: number;
  discount_type?: 'percentage' | 'fixed';
  discount_value?: number;
  name?: string;
  description?: string;
}

// Get all coupons (admin only)
export async function getAllCoupons(): Promise<Coupon[]> {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Get active coupons
export async function getActiveCoupons(): Promise<Coupon[]> {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('is_active', true)
    .lte('start_date', new Date().toISOString())
    .gte('end_date', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Get coupon by code
export async function getCouponByCode(code: string): Promise<Coupon | null> {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.toUpperCase())
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

// Create new coupon
export async function createCoupon(coupon: CouponInsert): Promise<Coupon> {
  console.log('Attempting to create coupon:', coupon);
  
  // Remove fields that might cause RLS issues
  const { created_by, ...cleanCoupon } = coupon as any;
  
  const { data, error } = await supabase
    .from('coupons')
    .insert({
      ...cleanCoupon,
      code: coupon.code.toUpperCase(),
      created_by: null, // Explicitly set to null to avoid auth issues
    })
    .select()
    .single();

  if (error) {
    console.error('Supabase error creating coupon:', error);
    throw new Error(`Failed to create coupon: ${error.message || 'Unknown error'}`);
  }
  
  console.log('Coupon created successfully:', data);
  return data;
}

// Update coupon
export async function updateCoupon(id: string, updates: CouponUpdate): Promise<Coupon> {
  console.log('Attempting to update coupon:', id, updates);
  
  const { data, error } = await supabase
    .from('coupons')
    .update({
      ...updates,
      code: updates.code ? updates.code.toUpperCase() : undefined,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Supabase error updating coupon:', error);
    throw new Error(`Failed to update coupon: ${error.message || 'Unknown error'}`);
  }
  
  console.log('Coupon updated successfully:', data);
  return data;
}

// Delete coupon
export async function deleteCoupon(id: string): Promise<void> {
  const { error } = await supabase
    .from('coupons')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Validate coupon
export async function validateCoupon(
  code: string,
  userId: string | null,
  orderTotal: number
): Promise<CouponValidationResult> {
  try {
    const { data, error } = await supabase.rpc('validate_coupon', {
      coupon_code: code.toUpperCase(),
      user_id_param: userId,
      order_total: orderTotal
    });

    if (error) throw error;
    return data as CouponValidationResult;
  } catch (error) {
    console.error('Error validating coupon:', error);
    return {
      valid: false,
      error: 'Failed to validate coupon. Please try again.'
    };
  }
}

// Record coupon usage
export async function recordCouponUsage(
  couponId: string,
  userId: string | null,
  orderId: string,
  discountAmount: number
): Promise<void> {
  try {
    const { error } = await supabase.rpc('record_coupon_usage', {
      coupon_id_param: couponId,
      user_id_param: userId,
      order_id_param: orderId,
      discount_amount_param: discountAmount
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error recording coupon usage:', error);
    throw error;
  }
}

// Get coupon usage statistics
export async function getCouponUsageStats(couponId: string): Promise<{
  totalUsage: number;
  totalDiscount: number;
  recentUsages: CouponUsage[];
}> {
  const { data: usageData, error: usageError } = await supabase
    .from('coupon_usage')
    .select(`
      *,
      users(name),
      orders(id, created_at)
    `)
    .eq('coupon_id', couponId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (usageError) throw usageError;

  const { data: statsData, error: statsError } = await supabase
    .from('coupon_usage')
    .select('discount_amount')
    .eq('coupon_id', couponId);

  if (statsError) throw statsError;

  const totalUsage = statsData?.length || 0;
  const totalDiscount = statsData?.reduce((sum, usage) => sum + usage.discount_amount, 0) || 0;

  return {
    totalUsage,
    totalDiscount,
    recentUsages: usageData || []
  };
}

// Get user's coupon usage history
export async function getUserCouponUsage(userId: string): Promise<CouponUsage[]> {
  const { data, error } = await supabase
    .from('coupon_usage')
    .select(`
      *,
      coupons(name, code, description),
      orders(id, created_at)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Check if user has used a specific coupon
export async function hasUserUsedCoupon(userId: string, couponId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('coupon_usage')
    .select('id')
    .eq('user_id', userId)
    .eq('coupon_id', couponId)
    .limit(1);

  if (error) throw error;
  return (data?.length || 0) > 0;
}

// Toggle coupon active status
export async function toggleCouponStatus(id: string): Promise<Coupon> {
  // First get current status
  const { data: currentCoupon, error: fetchError } = await supabase
    .from('coupons')
    .select('is_active')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;

  // Update with opposite status
  const { data, error } = await supabase
    .from('coupons')
    .update({ is_active: !currentCoupon.is_active })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}