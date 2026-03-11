
-- Role enum and user_roles table
CREATE TYPE public.app_role AS ENUM ('seller', 'buyer');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own role" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Add seller_id to products
ALTER TABLE public.products ADD COLUMN seller_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Allow sellers to manage their products
CREATE POLICY "Sellers can insert products" ON public.products
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'seller') AND auth.uid() = seller_id);

CREATE POLICY "Sellers can update their products" ON public.products
  FOR UPDATE TO authenticated USING (auth.uid() = seller_id) WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete their products" ON public.products
  FOR DELETE TO authenticated USING (auth.uid() = seller_id);

-- Surprise boxes table
CREATE TABLE public.surprise_boxes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  price numeric NOT NULL,
  original_value numeric NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  pickup_start timestamp with time zone NOT NULL,
  pickup_end timestamp with time zone NOT NULL,
  shop_name text NOT NULL,
  shop_address text,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.surprise_boxes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active boxes" ON public.surprise_boxes
  FOR SELECT USING (is_active = true);

CREATE POLICY "Sellers can manage their boxes" ON public.surprise_boxes
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'seller') AND auth.uid() = seller_id);

CREATE POLICY "Sellers can update their boxes" ON public.surprise_boxes
  FOR UPDATE TO authenticated USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete their boxes" ON public.surprise_boxes
  FOR DELETE TO authenticated USING (auth.uid() = seller_id);

-- Orders table
CREATE TYPE public.order_status AS ENUM ('pending', 'paid', 'ready', 'picked_up', 'expired', 'refunded');
CREATE TYPE public.payment_method AS ENUM ('card', 'cash', 'app_balance');

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  seller_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_number text NOT NULL UNIQUE DEFAULT 'ORD-' || substr(gen_random_uuid()::text, 1, 8),
  item_type text NOT NULL CHECK (item_type IN ('product', 'surprise_box')),
  item_id uuid NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  total_price numeric NOT NULL,
  payment_method payment_method NOT NULL DEFAULT 'card',
  status order_status NOT NULL DEFAULT 'pending',
  pickup_code text NOT NULL DEFAULT upper(substr(md5(random()::text), 1, 6)),
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view their orders" ON public.orders
  FOR SELECT TO authenticated USING (auth.uid() = buyer_id);

CREATE POLICY "Sellers can view orders for their items" ON public.orders
  FOR SELECT TO authenticated USING (auth.uid() = seller_id);

CREATE POLICY "Buyers can create orders" ON public.orders
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Sellers can update order status" ON public.orders
  FOR UPDATE TO authenticated USING (auth.uid() = seller_id);

-- Delete example products
DELETE FROM public.cart_items;
DELETE FROM public.products;

-- Add shop_name and shop_address to profiles for sellers
ALTER TABLE public.profiles ADD COLUMN shop_name text;
ALTER TABLE public.profiles ADD COLUMN shop_address text;
ALTER TABLE public.profiles ADD COLUMN role text;
