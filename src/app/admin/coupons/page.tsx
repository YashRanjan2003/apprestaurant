'use client';

import { useState, useEffect } from 'react';
import { format, isAfter, isBefore } from 'date-fns';
import {
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  getCouponUsageStats,
} from '@/lib/supabase/coupons';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';

type Coupon = Database['public']['Tables']['coupons']['Row'];
type CouponInsert = Database['public']['Tables']['coupons']['Insert'];

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [usageStats, setUsageStats] = useState<{ [key: string]: any }>({});

  useEffect(() => {
    fetchCoupons();
    // testDirectInsert(); // Test passed - database is working!
  }, []);
  
  // Direct database test function
  const testDirectInsert = async () => {
    console.log('🧪 Testing direct database access...');
    try {
      // First, try to clean up any existing test coupon
      await supabase.from('coupons').delete().eq('code', 'DIRECTTEST');
      
      // Create a unique test code each time
      const testCode = `TEST${Date.now()}`;
      
      const { data, error } = await supabase
        .from('coupons')
        .insert({
          code: testCode,
          name: 'Direct Test Coupon',
          description: 'Testing direct database access',
          discount_type: 'percentage',
          discount_value: 15,
          minimum_order_amount: 0,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          is_active: true
        })
        .select();
      
      if (error) {
        console.error('❌ Direct test failed:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        // Check if it's just a duplicate error (which is actually good news!)
        if (error.code === '23505') {
          console.log('✅ Database is working! (Just had a duplicate key - that\'s normal)');
          console.log('🎉 Coupon creation should work now!');
        }
      } else {
        console.log('✅ Direct test completely successful:', data);
        console.log('🎉 Database is fully working!');
        // Clean up test coupon
        await supabase.from('coupons').delete().eq('code', testCode);
      }
    } catch (err) {
      console.error('❌ Direct test exception:', err);
    }
  };

  const fetchCoupons = async () => {
    try {
      console.log('Attempting to fetch coupons...');
      const data = await getAllCoupons();
      console.log('Coupons fetched successfully:', data);
      setCoupons(data);
    } catch (error: any) {
      console.error('Error fetching coupons:', error);
      console.error('Error message:', error?.message);
      console.error('Error details:', JSON.stringify(error));
      
      // Check if it's a table not found error
      if (error?.message?.includes('relation "public.coupons" does not exist')) {
        console.error('COUPONS TABLE NOT FOUND! Please run the coupon_system.sql script in your Supabase database.');
        alert('Coupons table not found. Please run the database migration script first.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUsageStats = async (couponId: string) => {
    if (usageStats[couponId]) return; // Already loaded
    
    try {
      const stats = await getCouponUsageStats(couponId);
      setUsageStats(prev => ({ ...prev, [couponId]: stats }));
    } catch (error) {
      console.error('Error fetching usage stats:', error);
    }
  };

  const handleSubmit = async (formData: CouponInsert) => {
    console.log('Submitting coupon form data:', formData);
    try {
      if (editingCoupon) {
        console.log('Updating existing coupon:', editingCoupon.id);
        await updateCoupon(editingCoupon.id, formData);
      } else {
        console.log('Creating new coupon');
        await createCoupon(formData);
      }
      await fetchCoupons();
      setShowForm(false);
      setEditingCoupon(null);
    } catch (error: any) {
      console.error('Error saving coupon:', error);
      console.error('Error message:', error?.message);
      console.error('Error details:', JSON.stringify(error));
      
      const errorMessage = error?.message || 'Unknown error occurred';
      alert(`Failed to save coupon: ${errorMessage}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    
    try {
      await deleteCoupon(id);
      await fetchCoupons();
    } catch (error) {
      console.error('Error deleting coupon:', error);
      alert('Failed to delete coupon. Please try again.');
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await toggleCouponStatus(id);
      await fetchCoupons();
    } catch (error) {
      console.error('Error toggling coupon status:', error);
      alert('Failed to update coupon status. Please try again.');
    }
  };

  const getCouponStatus = (coupon: Coupon) => {
    if (!coupon.is_active) return { text: 'Inactive', color: 'bg-gray-500' };
    
    const now = new Date();
    const startDate = new Date(coupon.start_date);
    const endDate = new Date(coupon.end_date);
    
    if (isBefore(now, startDate)) return { text: 'Scheduled', color: 'bg-blue-500' };
    if (isAfter(now, endDate)) return { text: 'Expired', color: 'bg-red-500' };
    return { text: 'Active', color: 'bg-green-500' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Coupon Management</h1>
          <p className="text-gray-600 mt-1">Manage discount coupons for your restaurant</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingCoupon(null);
          }}
          className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Create New Coupon
        </button>
      </div>

      {showForm && (
        <CouponForm
          coupon={editingCoupon}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingCoupon(null);
          }}
        />
      )}

      <div className="grid gap-6">
        {coupons.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No coupons created yet</p>
            <p className="text-gray-400">Create your first coupon to get started</p>
          </div>
        ) : (
          coupons.map((coupon) => (
            <CouponCard
              key={coupon.id}
              coupon={coupon}
              status={getCouponStatus(coupon)}
              onEdit={() => {
                setEditingCoupon(coupon);
                setShowForm(true);
              }}
              onDelete={() => handleDelete(coupon.id)}
              onToggleStatus={() => handleToggleStatus(coupon.id)}
              onViewStats={() => fetchUsageStats(coupon.id)}
              stats={usageStats[coupon.id]}
            />
          ))
        )}
      </div>
    </div>
  );
}

function CouponForm({
  coupon,
  onSubmit,
  onCancel,
}: {
  coupon: Coupon | null;
  onSubmit: (data: CouponInsert) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<CouponInsert>({
    code: coupon?.code || '',
    name: coupon?.name || '',
    description: coupon?.description || '',
    discount_type: coupon?.discount_type || 'percentage',
    discount_value: coupon?.discount_value || 0,
    minimum_order_amount: coupon?.minimum_order_amount || 0,
    maximum_discount_amount: coupon?.maximum_discount_amount || null,
    usage_limit: coupon?.usage_limit || null,
    per_user_limit: coupon?.per_user_limit || 1,
    start_date: coupon?.start_date ? format(new Date(coupon.start_date), "yyyy-MM-dd'T'HH:mm") : '',
    end_date: coupon?.end_date ? format(new Date(coupon.end_date), "yyyy-MM-dd'T'HH:mm") : '',
    is_active: coupon?.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <h2 className="text-xl font-semibold mb-6">
        {coupon ? 'Edit Coupon' : 'Create New Coupon'}
      </h2>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Coupon Code *
          </label>
          <input
            type="text"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            placeholder="e.g., SAVE20"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Coupon Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            placeholder="e.g., 20% Off Special"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            placeholder="Describe your coupon offer"
            rows={2}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Discount Type *
          </label>
          <select
            value={formData.discount_type}
            onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as 'percentage' | 'fixed' })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            required
          >
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed Amount</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Discount Value * {formData.discount_type === 'percentage' ? '(%)' : '(₹)'}
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max={formData.discount_type === 'percentage' ? '100' : undefined}
            value={formData.discount_value}
            onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Order Amount (₹)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.minimum_order_amount}
            onChange={(e) => setFormData({ ...formData, minimum_order_amount: parseFloat(e.target.value) || 0 })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          />
        </div>

        {formData.discount_type === 'percentage' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Discount Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.maximum_discount_amount || ''}
              onChange={(e) => setFormData({ ...formData, maximum_discount_amount: parseFloat(e.target.value) || null })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="No limit"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Total Usage Limit
          </label>
          <input
            type="number"
            min="1"
            value={formData.usage_limit || ''}
            onChange={(e) => setFormData({ ...formData, usage_limit: parseInt(e.target.value) || null })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            placeholder="Unlimited"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Per User Limit
          </label>
          <input
            type="number"
            min="1"
            value={formData.per_user_limit}
            onChange={(e) => setFormData({ ...formData, per_user_limit: parseInt(e.target.value) || 1 })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Date *
          </label>
          <input
            type="datetime-local"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Date *
          </label>
          <input
            type="datetime-local"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            required
          />
        </div>

        <div className="md:col-span-2 flex items-center">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="mr-2 h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
          />
          <label htmlFor="is_active" className="text-sm text-gray-700">
            Active (users can use this coupon)
          </label>
        </div>

        <div className="md:col-span-2 flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors"
          >
            {coupon ? 'Update Coupon' : 'Create Coupon'}
          </button>
        </div>
      </form>
    </div>
  );
}

function CouponCard({
  coupon,
  status,
  onEdit,
  onDelete,
  onToggleStatus,
  onViewStats,
  stats,
}: {
  coupon: Coupon;
  status: { text: string; color: string };
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  onViewStats: () => void;
  stats?: any;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-semibold text-gray-900">{coupon.name}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${status.color}`}>
              {status.text}
            </span>
          </div>
          <p className="text-3xl font-bold text-yellow-600 mb-1">
            {coupon.code}
          </p>
          {coupon.description && (
            <p className="text-gray-600">{coupon.description}</p>
          )}
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={onEdit}
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
            title="Edit coupon"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={onToggleStatus}
            className={`p-2 transition-colors ${
              coupon.is_active
                ? 'text-gray-400 hover:text-red-600'
                : 'text-gray-400 hover:text-green-600'
            }`}
            title={coupon.is_active ? 'Deactivate coupon' : 'Activate coupon'}
          >
            {coupon.is_active ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
            title="Delete coupon"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-500">Discount</p>
          <p className="text-lg font-semibold">
            {coupon.discount_type === 'percentage' 
              ? `${coupon.discount_value}%` 
              : `₹${coupon.discount_value}`
            }
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Min Order</p>
          <p className="text-lg font-semibold">₹{coupon.minimum_order_amount}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Usage</p>
          <p className="text-lg font-semibold">
            {coupon.used_count}
            {coupon.usage_limit && ` / ${coupon.usage_limit}`}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Valid Until</p>
          <p className="text-lg font-semibold">
            {format(new Date(coupon.end_date), 'MMM dd')}
          </p>
        </div>
      </div>

      {stats && (
        <div className="border-t pt-4">
          <p className="text-sm text-gray-500 mb-2">Usage Statistics</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Uses</p>
              <p className="text-xl font-bold text-green-600">{stats.totalUsage}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Discount Given</p>
              <p className="text-xl font-bold text-red-600">₹{stats.totalDiscount.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={onViewStats}
        className="w-full mt-4 py-2 text-yellow-600 hover:text-yellow-700 text-sm font-medium transition-colors"
      >
        {stats ? 'Refresh Stats' : 'View Usage Statistics'}
      </button>
    </div>
  );
}