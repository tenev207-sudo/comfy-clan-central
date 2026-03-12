
CREATE POLICY "Anyone can view seller profiles for map"
ON public.profiles
FOR SELECT
TO public
USING (role = 'seller');
