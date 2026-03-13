
CREATE TABLE public.product_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  barcode text NOT NULL,
  name text NOT NULL,
  description text,
  old_price numeric NOT NULL DEFAULT 0,
  new_price numeric NOT NULL DEFAULT 0,
  category text DEFAULT 'general',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(seller_id, barcode)
);

ALTER TABLE public.product_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view their codes" ON public.product_codes
  FOR SELECT TO authenticated USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can insert codes" ON public.product_codes
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'seller'::app_role) AND auth.uid() = seller_id);

CREATE POLICY "Sellers can update their codes" ON public.product_codes
  FOR UPDATE TO authenticated USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete their codes" ON public.product_codes
  FOR DELETE TO authenticated USING (auth.uid() = seller_id);
