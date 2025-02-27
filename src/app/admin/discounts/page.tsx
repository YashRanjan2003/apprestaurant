'use client';

import { useState, useEffect } from 'react';
import { DiscountType } from '@prisma/client';

interface Discount {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
  minOrderValue?: number | null;
  maxDiscount?: number | null;
  validFrom: string;
  validUntil: string;
  description: string;
  isActive: boolean;
  usageLimit?: number | null;
  usageCount: number;
  applicableCategories: string[];
}

export default function DiscountsManagement() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Discount>>({
    code: '',
    type: 'PERCENTAGE',
    value: 0,
    minOrderValue: 0,
    maxDiscount: 0,
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: new Date().toISOString().split('T')[0],
    description: '',
    isActive: true,
    usageLimit: undefined,
    usageCount: 0,
    applicableCategories: ['All'],
  });

  // Fetch discounts
  useEffect(() => {
    async function fetchDiscounts() {
      try {
        const response = await fetch('/api/admin/discounts');
        if (!response.ok) throw new Error('Failed to fetch discounts');
        const data = await response.json();
        setDiscounts(data.map((discount: Discount) => ({
          ...discount,
          validFrom: new Date(discount.validFrom).toISOString().split('T')[0],
          validUntil: new Date(discount.validUntil).toISOString().split('T')[0],
        })));
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setIsLoading(false);
      }
    }
    fetchDiscounts();
  }, []);

  const handleEdit = (discount: Discount) => {
    setSelectedDiscount(discount);
    setFormData({
      ...discount,
      validFrom: new Date(discount.validFrom).toISOString().split('T')[0],
      validUntil: new Date(discount.validUntil).toISOString().split('T')[0],
    });
    setIsEditing(true);
    setIsAdding(false);
  };

  const handleAdd = () => {
    setSelectedDiscount(null);
    setFormData({
      code: '',
      type: 'PERCENTAGE',
      value: 0,
      minOrderValue: 0,
      maxDiscount: 0,
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: new Date().toISOString().split('T')[0],
      description: '',
      isActive: true,
      usageLimit: undefined,
      usageCount: 0,
      applicableCategories: ['All'],
    });
    setIsEditing(false);
    setIsAdding(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isEditing && selectedDiscount) {
        // Update existing discount
        const response = await fetch('/api/admin/discounts', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, id: selectedDiscount.id }),
        });

        if (!response.ok) throw new Error('Failed to update discount');
        const updatedDiscount = await response.json();
        setDiscounts(discounts.map(discount =>
          discount.id === selectedDiscount.id ? {
            ...updatedDiscount,
            validFrom: new Date(updatedDiscount.validFrom).toISOString().split('T')[0],
            validUntil: new Date(updatedDiscount.validUntil).toISOString().split('T')[0],
          } : discount
        ));
      } else if (isAdding) {
        // Add new discount
        const response = await fetch('/api/admin/discounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!response.ok) throw new Error('Failed to create discount');
        const newDiscount = await response.json();
        setDiscounts([{
          ...newDiscount,
          validFrom: new Date(newDiscount.validFrom).toISOString().split('T')[0],
          validUntil: new Date(newDiscount.validUntil).toISOString().split('T')[0],
        }, ...discounts]);
      }

      // Reset form
      setIsEditing(false);
      setIsAdding(false);
      setSelectedDiscount(null);
      setFormData({
        code: '',
        type: 'PERCENTAGE',
        value: 0,
        minOrderValue: 0,
        maxDiscount: 0,
        validFrom: new Date().toISOString().split('T')[0],
        validUntil: new Date().toISOString().split('T')[0],
        description: '',
        isActive: true,
        usageLimit: undefined,
        usageCount: 0,
        applicableCategories: ['All'],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this discount?')) {
      try {
        const response = await fetch(`/api/admin/discounts?id=${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) throw new Error('Failed to delete discount');
        setDiscounts(discounts.filter(discount => discount.id !== id));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      const discount = discounts.find(d => d.id === id);
      if (!discount) return;

      const response = await fetch('/api/admin/discounts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...discount,
          isActive: !discount.isActive,
          id,
        }),
      });

      if (!response.ok) throw new Error('Failed to update discount');
      const updatedDiscount = await response.json();
      setDiscounts(discounts.map(d =>
        d.id === id ? {
          ...updatedDiscount,
          validFrom: new Date(updatedDiscount.validFrom).toISOString().split('T')[0],
          validUntil: new Date(updatedDiscount.validUntil).toISOString().split('T')[0],
        } : d
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Discounts Management</h1>
          <p className="text-gray-600">Create and manage discount codes and offers.</p>
        </div>
        <button
          onClick={handleAdd}
          className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          Add New Discount
        </button>
      </div>

      {/* Form for adding/editing discounts */}
      {(isEditing || isAdding) && (
        <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {isEditing ? 'Edit Discount' : 'Add New Discount'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-black focus:border-black"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as Discount['type'] })}
                  className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-black focus:border-black"
                  required
                >
                  <option value="PERCENTAGE">Percentage Off</option>
                  <option value="FIXED">Fixed Amount Off</option>
                  <option value="BOGO">Buy One Get One</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formData.type === 'PERCENTAGE' ? 'Percentage' : formData.type === 'FIXED' ? 'Amount' : ''} (₹)
                </label>
                <input
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                  className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-black focus:border-black"
                  required
                  min="0"
                  max={formData.type === 'PERCENTAGE' ? '100' : undefined}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Order Value (₹)
                </label>
                <input
                  type="number"
                  name="minOrderValue"
                  value={formData.minOrderValue ?? ''}
                  onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value ? Number(e.target.value) : null })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              {formData.type !== 'BOGO' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum Discount (₹)
                  </label>
                  <input
                    type="number"
                    name="maxDiscount"
                    value={formData.maxDiscount ?? ''}
                    onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value ? Number(e.target.value) : null })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valid From
                </label>
                <input
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-black focus:border-black"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valid Until
                </label>
                <input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-black focus:border-black"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Usage Limit
                </label>
                <input
                  type="number"
                  name="usageLimit"
                  value={formData.usageLimit ?? ''}
                  onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value ? Number(e.target.value) : null })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-black focus:border-black"
                  rows={3}
                  required
                />
              </div>

              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-gray-300 text-black focus:ring-black"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setIsAdding(false);
                  setSelectedDiscount(null);
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                {isEditing ? 'Save Changes' : 'Add Discount'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Discounts List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {discounts.map((discount) => (
              <tr key={discount.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{discount.code}</div>
                  <div className="text-sm text-gray-500">{discount.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                  {discount.type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {discount.type === 'PERCENTAGE'
                    ? `${discount.value}%`
                    : discount.type === 'FIXED'
                    ? `₹${discount.value}`
                    : 'BOGO'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {discount.usageCount}
                  {discount.usageLimit && ` / ${discount.usageLimit}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleToggleActive(discount.id)}
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      discount.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {discount.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEdit(discount)}
                    className="text-black hover:text-gray-700 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(discount.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 