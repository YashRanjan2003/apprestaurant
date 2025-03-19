import { supabase } from './client';

/**
 * Creates a user profile in the database after authentication
 */
export async function createUserProfile(userId: string, userData: { 
  name: string; 
  phone: string; 
  email?: string 
}) {
  const { error } = await supabase
    .from('users')
    .insert({
      id: userId,
      name: userData.name,
      phone: userData.phone,
      email: userData.email || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  
  if (error) throw error;
}

/**
 * Verify OTP for phone authentication
 */
export async function verifyOtp(phone: string, otp: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token: otp,
    type: 'sms'
  });
  
  if (error) throw error;
  return data.user;
}

/**
 * Update user profile information
 */
export async function updateUserProfile(userId: string, userData: {
  name?: string;
  phone?: string;
  email?: string;
}) {
  const updateData = {
    ...userData,
    updated_at: new Date().toISOString()
  };
  
  const { error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId);
  
  if (error) throw error;
}

/**
 * Get user profile by ID
 */
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
} 