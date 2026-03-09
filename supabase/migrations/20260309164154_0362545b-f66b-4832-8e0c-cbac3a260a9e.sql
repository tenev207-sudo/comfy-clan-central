
-- Fix RLS policies to be PERMISSIVE (default) instead of RESTRICTIVE
DROP POLICY "Users can view their own profile" ON public.profiles;
DROP POLICY "Users can insert their own profile" ON public.profiles;
DROP POLICY "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Also allow the trigger (service role) to insert profiles
CREATE POLICY "Service role can insert profiles" ON public.profiles FOR INSERT TO service_role WITH CHECK (true);
