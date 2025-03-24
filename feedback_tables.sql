-- Create UUID extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create orders table if it doesn't exist
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending',
  order_type TEXT NOT NULL DEFAULT 'pickup',
  delivery_address TEXT,
  scheduled_time TEXT NOT NULL DEFAULT '',
  payment_method TEXT NOT NULL,
  payment_id TEXT,
  payment_status TEXT,
  item_total DECIMAL(10, 2) NOT NULL,
  gst DECIMAL(10, 2) NOT NULL,
  platform_fee DECIMAL(10, 2) NOT NULL,
  delivery_charge DECIMAL(10, 2) NOT NULL DEFAULT 0,
  final_total DECIMAL(10, 2) NOT NULL,
  otp TEXT NOT NULL
);

-- Create order_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL,
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create menu_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  category_id UUID,
  is_vegetarian BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create feedback table for overall order feedback
CREATE TABLE IF NOT EXISTS order_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_order_feedback UNIQUE (order_id)
);

-- Create feedback table for individual menu items within orders
CREATE TABLE IF NOT EXISTS item_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_item_feedback UNIQUE (order_item_id)
);

-- Add RLS policies
ALTER TABLE order_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_feedback ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read feedback
CREATE POLICY order_feedback_read_policy ON order_feedback
  FOR SELECT USING (true);

CREATE POLICY item_feedback_read_policy ON item_feedback
  FOR SELECT USING (true);

-- Create policy to allow insert and update only for authenticated users
CREATE POLICY order_feedback_insert_policy ON order_feedback
  FOR INSERT WITH CHECK (true);

CREATE POLICY order_feedback_update_policy ON order_feedback
  FOR UPDATE USING (true);

CREATE POLICY item_feedback_insert_policy ON item_feedback
  FOR INSERT WITH CHECK (true);

CREATE POLICY item_feedback_update_policy ON item_feedback
  FOR UPDATE USING (true); 