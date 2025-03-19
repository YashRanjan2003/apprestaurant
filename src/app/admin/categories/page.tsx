'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { getMenuCategories } from '@/lib/supabase/menu';

interface Category {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  created_at: string;
  item_count?: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isEditingCategory, setIsEditingCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [sortField, setSortField] = useState<'name' | 'display_order' | 'item_count'>('display_order');

  // Fetch categories and count menu items in each category
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const categoriesData = await getMenuCategories();
        
        // Get count of menu items for each category
        const { data: menuItemsData, error: countError } = await supabase
          .from('menu_items')
          .select('category_id');
          
        if (countError) throw countError;
        
        // Count items per category
        const itemCountByCategory: Record<string, number> = {};
        menuItemsData.forEach(item => {
          if (item.category_id) {
            itemCountByCategory[item.category_id] = (itemCountByCategory[item.category_id] || 0) + 1;
          }
        });
        
        // Add item count to categories
        const enhancedCategories = (categoriesData as Category[]).map(category => ({
          ...category,
          item_count: itemCountByCategory[category.id] || 0
        }));
        
        setCategories(enhancedCategories);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, []);
  
  // Handle adding new category
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      setError('Category name is required');
      return;
    }
    
    try {
      const newOrder = displayOrder || Math.max(...categories.map(c => c.display_order), 0) + 10;
      
      const { data, error: insertError } = await supabase
        .from('menu_categories')
        .insert({
          name: newCategoryName.trim(),
          description: newCategoryDescription.trim() || null,
          display_order: newOrder
        })
        .select()
        .single();
        
      if (insertError) throw insertError;
      
      // Add to local state
      setCategories([...categories, { ...data, item_count: 0 }]);
      
      // Reset form
      setNewCategoryName('');
      setNewCategoryDescription('');
      setDisplayOrder(0);
      setIsAddingCategory(false);
      setError(null);
      
    } catch (err: any) {
      console.error('Error adding category:', err);
      setError('Failed to add category');
    }
  };
  
  // Handle updating category
  const handleUpdateCategory = async (id: string) => {
    if (!newCategoryName.trim()) {
      setError('Category name is required');
      return;
    }
    
    try {
      const { error: updateError } = await supabase
        .from('menu_categories')
        .update({
          name: newCategoryName.trim(),
          description: newCategoryDescription.trim() || null,
          display_order: displayOrder
        })
        .eq('id', id);
        
      if (updateError) throw updateError;
      
      // Update local state
      setCategories(categories.map(category => 
        category.id === id
          ? { 
              ...category, 
              name: newCategoryName.trim(), 
              description: newCategoryDescription.trim() || null,
              display_order: displayOrder
            }
          : category
      ));
      
      // Reset form
      setNewCategoryName('');
      setNewCategoryDescription('');
      setDisplayOrder(0);
      setIsEditingCategory(null);
      setError(null);
      
    } catch (err: any) {
      console.error('Error updating category:', err);
      setError('Failed to update category');
    }
  };
  
  // Handle deleting category
  const handleDeleteCategory = async (id: string) => {
    // Get the category to check its item count
    const categoryToDelete = categories.find(c => c.id === id);
    
    if (categoryToDelete?.item_count && categoryToDelete.item_count > 0) {
      if (!window.confirm(`This category contains ${categoryToDelete.item_count} menu items. Deleting it will remove the category association from these items. Are you sure you want to proceed?`)) {
        return;
      }
    } else {
      if (!window.confirm('Are you sure you want to delete this category?')) {
        return;
      }
    }
    
    try {
      const { error: deleteError } = await supabase
        .from('menu_categories')
        .delete()
        .eq('id', id);
        
      if (deleteError) throw deleteError;
      
      // Remove from local state
      setCategories(categories.filter(category => category.id !== id));
      setError(null);
      
    } catch (err: any) {
      console.error('Error deleting category:', err);
      setError('Failed to delete category');
    }
  };
  
  // Handle editing category
  const startEditingCategory = (category: Category) => {
    setIsEditingCategory(category.id);
    setNewCategoryName(category.name);
    setNewCategoryDescription(category.description || '');
    setDisplayOrder(category.display_order);
  };
  
  // Cancel editing/adding
  const handleCancel = () => {
    setIsEditingCategory(null);
    setIsAddingCategory(false);
    setNewCategoryName('');
    setNewCategoryDescription('');
    setDisplayOrder(0);
    setError(null);
  };
  
  // Filter categories based on search query
  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  // Sort categories
  const sortedCategories = [...filteredCategories].sort((a, b) => {
    let comparison = 0;
    
    if (sortField === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortField === 'display_order') {
      comparison = a.display_order - b.display_order;
    } else if (sortField === 'item_count') {
      comparison = (a.item_count || 0) - (b.item_count || 0);
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });
  
  // Handle sorting
  const handleSort = (field: 'name' | 'display_order' | 'item_count') => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Categories</h1>
          <p className="text-gray-600">Manage your menu categories ({categories.length} total)</p>
        </div>
        <div>
          <button
            onClick={() => {
              setIsAddingCategory(true);
              setIsEditingCategory(null);
            }}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 flex items-center"
            disabled={isAddingCategory || isEditingCategory !== null}
          >
            <svg 
              className="w-4 h-4 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 4v16m8-8H4" 
              />
            </svg>
            Add Category
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}
      
      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
          />
        </div>
      </div>

      {/* Add Category Form */}
      {isAddingCategory && (
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Add New Category</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="category-name" className="block text-sm font-medium text-gray-700 mb-1">
                Category Name*
              </label>
              <input
                id="category-name"
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Enter category name"
              />
            </div>
            
            <div>
              <label htmlFor="category-description" className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                id="category-description"
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Enter category description"
                rows={3}
              />
            </div>
            
            <div>
              <label htmlFor="display-order" className="block text-sm font-medium text-gray-700 mb-1">
                Display Order
              </label>
              <input
                id="display-order"
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Enter display order (lower numbers appear first)"
              />
              <p className="mt-1 text-sm text-gray-500">
                Lower numbers appear first in category listings
              </p>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCategory}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
              >
                Add Category
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-800"></div>
        </div>
      ) : sortedCategories.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No categories found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery ? 'Try adjusting your search query.' : 'Get started by adding a new category.'}
          </p>
          <div className="mt-6">
            <button
              onClick={() => setIsAddingCategory(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Category
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      <span>Category Name</span>
                      {sortField === 'name' && (
                        <svg 
                          className={`ml-1 w-4 h-4 ${sortDirection === 'asc' ? '' : 'transform rotate-180'}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('display_order')}
                  >
                    <div className="flex items-center">
                      <span>Display Order</span>
                      {sortField === 'display_order' && (
                        <svg 
                          className={`ml-1 w-4 h-4 ${sortDirection === 'asc' ? '' : 'transform rotate-180'}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('item_count')}
                  >
                    <div className="flex items-center">
                      <span>Menu Items</span>
                      {sortField === 'item_count' && (
                        <svg 
                          className={`ml-1 w-4 h-4 ${sortDirection === 'asc' ? '' : 'transform rotate-180'}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedCategories.map((category) => (
                  isEditingCategory === category.id ? (
                    <tr key={category.id}>
                      <td colSpan={5} className="px-6 py-4">
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">
                                Category Name*
                              </label>
                              <input
                                id="edit-name"
                                type="text"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                              </label>
                              <input
                                id="edit-description"
                                type="text"
                                value={newCategoryDescription}
                                onChange={(e) => setNewCategoryDescription(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label htmlFor="edit-order" className="block text-sm font-medium text-gray-700 mb-1">
                                Display Order
                              </label>
                              <input
                                id="edit-order"
                                type="number"
                                value={displayOrder}
                                onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end space-x-3">
                            <button
                              onClick={handleCancel}
                              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleUpdateCategory(category.id)}
                              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={category.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{category.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 line-clamp-2">{category.description || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{category.display_order}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{category.item_count || 0}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => startEditingCategory(category)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
} 