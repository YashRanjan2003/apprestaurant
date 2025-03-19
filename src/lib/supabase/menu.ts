import { supabase } from './client';

/**
 * Get all menu categories
 */
export async function getMenuCategories() {
  const { data, error } = await supabase
    .from('menu_categories')
    .select('*')
    .order('display_order', { ascending: true });
  
  if (error) throw error;
  return data;
}

/**
 * Get menu items by category
 */
export async function getMenuItemsByCategory(categoryId: string) {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('category_id', categoryId)
    .eq('available', true);
  
  if (error) throw error;
  return data;
}

/**
 * Get all menu items
 */
export async function getAllMenuItems() {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*, menu_categories(name)')
    .eq('available', true);
  
  if (error) throw error;
  return data;
}

/**
 * Get menu item by ID
 */
export async function getMenuItemById(itemId: string) {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('id', itemId)
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Search menu items
 */
export async function searchMenuItems(query: string) {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('available', true)
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`);
  
  if (error) throw error;
  return data;
}

/**
 * Get vegetarian menu items
 */
export async function getVegetarianItems() {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('is_veg', true)
    .eq('available', true);
  
  if (error) throw error;
  return data;
} 