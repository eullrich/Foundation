-- Drop the problematic policy that's causing infinite recursion
DROP POLICY IF EXISTS "Only admins can insert/update/delete roles" ON public.user_roles;

-- Create separate policies for each operation with non-recursive checks
CREATE POLICY "Admins can insert roles" 
ON public.user_roles FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM public.user_roles 
    WHERE role = 'admin'
  )
);

CREATE POLICY "Admins can update roles" 
ON public.user_roles FOR UPDATE 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.user_roles 
    WHERE role = 'admin'
  )
);

CREATE POLICY "Admins can delete roles" 
ON public.user_roles FOR DELETE 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.user_roles 
    WHERE role = 'admin'
  )
);

-- Allow public read access to user_roles for authenticated users
-- This is important for checking admin status without recursion
CREATE POLICY "Authenticated users can read all roles" 
ON public.user_roles FOR SELECT 
TO authenticated
USING (true);
