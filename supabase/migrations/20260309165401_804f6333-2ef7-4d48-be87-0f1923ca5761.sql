
-- Products table
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  shop text NOT NULL,
  old_price numeric(10,2) NOT NULL,
  new_price numeric(10,2) NOT NULL,
  discount text NOT NULL,
  expiry_date timestamptz NOT NULL,
  image_url text,
  category text DEFAULT 'general',
  description text,
  stock integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Cart items table
CREATE TABLE public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Products: anyone can read
CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);

-- Cart: authenticated users only
CREATE POLICY "Users can view their cart" ON public.cart_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can add to cart" ON public.cart_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their cart" ON public.cart_items FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete from cart" ON public.cart_items FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Seed products
INSERT INTO public.products (name, shop, old_price, new_price, discount, expiry_date, image_url, category, description, stock) VALUES
('Пакет занаятчийски хляб и закуски (Излишък)', 'Пекарна "Златен Клас"', 12.00, 6.00, '-50%', now() + interval '6 hours', '/images/bread.jpg', 'bakery', 'Свеж занаятчийски хляб и разнообразни закуски от днешното производство. Идеални за обяд или вечеря.', 3),
('Микс свежи зеленчуци (2 кг) - Нестандартни', 'Супермаркет "Свежест"', 8.50, 5.10, '-40%', now() + interval '1 day', '/images/vegetables.jpg', 'vegetables', 'Пресни зеленчуци с нестандартна форма, но отлично качество. Перфектни за супи и салати.', 5),
('Кашкавал от краве мляко (400 гр)', 'Магазин "Млечен Път"', 11.90, 4.76, '-60%', now() + interval '2 days', '/images/cheese.jpg', 'dairy', 'Натурален кашкавал от краве мляко, произведен в България. Богат вкус и кремообразна текстура.', 2),
('Суши сет "Сьомга" (12 хапки) - от обедно меню', 'Ресторант "Азия"', 18.00, 12.60, '-30%', now() + interval '4 hours', '/images/sushi.jpg', 'restaurant', 'Прясно приготвено суши от обедното меню с качествена норвежка сьомга.', 4);
