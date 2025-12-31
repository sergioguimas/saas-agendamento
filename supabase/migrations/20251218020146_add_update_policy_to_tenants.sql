-- Permite que usuários autenticados atualizem a PRÓPRIA clínica (organization)
CREATE POLICY "Users can update their own organization"
ON public.organizations
FOR UPDATE
USING (
  id IN (
    SELECT organizations_id 
    FROM public.profiles 
    WHERE profiles.id = auth.uid()
  )
);