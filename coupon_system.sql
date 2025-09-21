-- Create coupons table
CREATE TABLE public.coupons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')) NOT NULL,
    discount_value DECIMAL(10,2) NOT NULL,
    minimum_order_amount DECIMAL(10,2) DEFAULT 0,
    maximum_discount_amount DECIMAL(10,2),
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    per_user_limit INTEGER DEFAULT 1,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create coupon_usage table to track individual usage
CREATE TABLE public.coupon_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    coupon_id UUID REFERENCES public.coupons(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id),
    order_id UUID REFERENCES public.orders(id),
    discount_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add coupon fields to orders table
ALTER TABLE public.orders 
ADD COLUMN coupon_id UUID REFERENCES public.coupons(id),
ADD COLUMN coupon_code TEXT,
ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0;

-- Create indexes for better performance
CREATE INDEX idx_coupons_code ON public.coupons(code);
CREATE INDEX idx_coupons_active_dates ON public.coupons(is_active, start_date, end_date);
CREATE INDEX idx_coupon_usage_coupon_user ON public.coupon_usage(coupon_id, user_id);
CREATE INDEX idx_orders_coupon ON public.orders(coupon_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON public.coupons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active coupons (for validation)
CREATE POLICY "Public can read active coupons" ON public.coupons
    FOR SELECT USING (is_active = true AND start_date <= now() AND end_date >= now());

-- Allow authenticated users to read all coupon data (for admin)
CREATE POLICY "Authenticated users can manage coupons" ON public.coupons
    FOR ALL USING (auth.role() = 'authenticated');

-- Allow users to read their own coupon usage
CREATE POLICY "Users can read own coupon usage" ON public.coupon_usage
    FOR SELECT USING (user_id = (SELECT id FROM public.users WHERE id = auth.uid()));

-- Allow authenticated users to manage coupon usage (for admin and system)
CREATE POLICY "Authenticated users can manage coupon usage" ON public.coupon_usage
    FOR ALL USING (auth.role() = 'authenticated');

-- Function to validate and apply coupon
CREATE OR REPLACE FUNCTION validate_coupon(
    coupon_code TEXT,
    user_id_param UUID,
    order_total DECIMAL(10,2)
)
RETURNS JSON AS $$
DECLARE
    coupon_record RECORD;
    user_usage_count INTEGER;
    discount_amount DECIMAL(10,2);
    result JSON;
BEGIN
    -- Get coupon details
    SELECT * INTO coupon_record
    FROM public.coupons
    WHERE code = coupon_code
      AND is_active = true
      AND start_date <= now()
      AND end_date >= now();
    
    -- Check if coupon exists and is valid
    IF coupon_record IS NULL THEN
        RETURN json_build_object(
            'valid', false,
            'error', 'Coupon code is invalid or expired'
        );
    END IF;
    
    -- Check minimum order amount
    IF order_total < coupon_record.minimum_order_amount THEN
        RETURN json_build_object(
            'valid', false,
            'error', format('Minimum order amount is ₹%s', coupon_record.minimum_order_amount)
        );
    END IF;
    
    -- Check total usage limit
    IF coupon_record.usage_limit IS NOT NULL AND coupon_record.used_count >= coupon_record.usage_limit THEN
        RETURN json_build_object(
            'valid', false,
            'error', 'Coupon usage limit exceeded'
        );
    END IF;
    
    -- Check per-user usage limit
    IF user_id_param IS NOT NULL THEN
        SELECT COUNT(*) INTO user_usage_count
        FROM public.coupon_usage
        WHERE coupon_id = coupon_record.id AND user_id = user_id_param;
        
        IF coupon_record.per_user_limit IS NOT NULL AND user_usage_count >= coupon_record.per_user_limit THEN
            RETURN json_build_object(
                'valid', false,
                'error', 'You have already used this coupon'
            );
        END IF;
    END IF;
    
    -- Calculate discount amount
    IF coupon_record.discount_type = 'percentage' THEN
        discount_amount := order_total * (coupon_record.discount_value / 100);
        IF coupon_record.maximum_discount_amount IS NOT NULL THEN
            discount_amount := LEAST(discount_amount, coupon_record.maximum_discount_amount);
        END IF;
    ELSE
        discount_amount := coupon_record.discount_value;
    END IF;
    
    -- Ensure discount doesn't exceed order total
    discount_amount := LEAST(discount_amount, order_total);
    
    RETURN json_build_object(
        'valid', true,
        'coupon_id', coupon_record.id,
        'discount_amount', discount_amount,
        'discount_type', coupon_record.discount_type,
        'discount_value', coupon_record.discount_value,
        'name', coupon_record.name,
        'description', coupon_record.description
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record coupon usage
CREATE OR REPLACE FUNCTION record_coupon_usage(
    coupon_id_param UUID,
    user_id_param UUID,
    order_id_param UUID,
    discount_amount_param DECIMAL(10,2)
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Insert coupon usage record
    INSERT INTO public.coupon_usage (coupon_id, user_id, order_id, discount_amount)
    VALUES (coupon_id_param, user_id_param, order_id_param, discount_amount_param);
    
    -- Update coupon used count
    UPDATE public.coupons
    SET used_count = used_count + 1
    WHERE id = coupon_id_param;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;