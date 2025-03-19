import { supabase } from './client';
import { Json } from './types';

/**
 * Get setting by key
 */
export async function getSetting(key: string) {
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', key)
    .single();
  
  if (error) throw error;
  return data?.value;
}

/**
 * Get platform fees
 */
export async function getPlatformFees() {
  const fees = await getSetting('platform_fees');
  return fees || {
    platformFee: 15.00,
    deliveryCharge: 40.00,
    freeDeliveryThreshold: 500.00,
    gstRate: 0.05
  };
}

/**
 * Get restaurant info
 */
export async function getRestaurantInfo() {
  const info = await getSetting('restaurant_info');
  return info || {
    name: 'Restaurant',
    phone: '1234567890',
    email: 'contact@restaurant.com',
    address: '123 Food Street, Foodville',
    openingHours: '11:00 AM - 10:00 PM',
    description: 'Delicious food at your doorstep'
  };
}

/**
 * Update setting
 */
export async function updateSetting(key: string, value: Json) {
  const { data, error } = await supabase
    .from('settings')
    .upsert({
      key,
      value,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'key'
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
} 