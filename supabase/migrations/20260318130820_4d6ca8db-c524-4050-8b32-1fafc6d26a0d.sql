
-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');

-- Allow anyone to view images
CREATE POLICY "Anyone can view product images" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'product-images');

-- Allow users to update their own images
CREATE POLICY "Users can update their images" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'product-images');

-- Allow users to delete their own images
CREATE POLICY "Users can delete their images" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'product-images');
