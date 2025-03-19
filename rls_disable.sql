-- Disable RLS on menu_categories table
ALTER TABLE menu_categories DISABLE ROW LEVEL SECURITY;

-- Disable RLS on menu_items table
ALTER TABLE menu_items DISABLE ROW LEVEL SECURITY;

-- Disable RLS on orders table
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- Disable RLS on order_items table
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;

-- Disable RLS on users table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Disable RLS on restaurant_settings table  
ALTER TABLE restaurant_settings DISABLE ROW LEVEL SECURITY;

-- Grant access to anon and authenticated roles
GRANT SELECT, INSERT, UPDATE, DELETE ON menu_categories TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON menu_items TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON orders TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON order_items TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON restaurant_settings TO anon, authenticated; 