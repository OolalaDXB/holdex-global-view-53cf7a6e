-- Allow users to insert their own profile rows so upsert works without RLS errors
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);