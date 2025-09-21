// Simple test to check if coupons table exists
import { supabase } from './src/lib/supabase/client.js';

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('settings')
      .select('*')
      .limit(1);
    
    if (connectionError) {
      console.error('Database connection failed:', connectionError);
      return;
    }
    
    console.log('✅ Database connected successfully');
    
    // Test coupons table
    const { data: couponsTest, error: couponsError } = await supabase
      .from('coupons')
      .select('*')
      .limit(1);
    
    if (couponsError) {
      console.error('❌ Coupons table error:', couponsError);
      console.error('You need to run the coupon_system.sql script in Supabase');
      return;
    }
    
    console.log('✅ Coupons table exists and accessible');
    console.log('Current coupons:', couponsTest);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testDatabase();