
-- Flash sales table for real-time notifications
CREATE TABLE public.flash_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  original_price numeric NOT NULL DEFAULT 0,
  flash_price numeric NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 1,
  latitude double precision,
  longitude double precision,
  shop_name text NOT NULL,
  shop_address text,
  expires_at timestamptz NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.flash_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active flash sales" ON public.flash_sales
  FOR SELECT TO public USING (is_active = true);

CREATE POLICY "Sellers can insert flash sales" ON public.flash_sales
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'seller'::app_role) AND auth.uid() = seller_id);

CREATE POLICY "Sellers can update their flash sales" ON public.flash_sales
  FOR UPDATE TO authenticated USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete their flash sales" ON public.flash_sales
  FOR DELETE TO authenticated USING (auth.uid() = seller_id);

-- Enable realtime for flash sales
ALTER PUBLICATION supabase_realtime ADD TABLE public.flash_sales;
