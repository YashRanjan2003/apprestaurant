-- Create admin_users table for simple admin authentication
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert a default admin user (username: admin, password: admin123)
-- In a production environment, you would use proper password hashing
INSERT INTO public.admin_users (username, password)
VALUES ('admin', 'admin123')
ON CONFLICT (username) DO NOTHING;

-- Add RLS policies to restrict access to admin_users table
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Only allow admins to view admin_users
CREATE POLICY "Allow admins to view admin_users"
ON public.admin_users
FOR SELECT
USING (auth.uid() IN (SELECT id FROM public.admin_users));

-- Only allow admins to update admin_users
CREATE POLICY "Allow admins to update admin_users"
ON public.admin_users
FOR UPDATE
USING (auth.uid() IN (SELECT id FROM public.admin_users));

-- Only allow specific operations on the admin_users table
CREATE POLICY "Deny insert to admin_users"
ON public.admin_users
FOR INSERT
WITH CHECK (FALSE);

CREATE POLICY "Deny delete from admin_users"
ON public.admin_users
FOR DELETE
USING (FALSE);

COMMENT ON TABLE public.admin_users IS 'Admin users for the restaurant platform'; 