-- 1. Permitir VISUALIZAR clientes do próprio tenant
CREATE POLICY "Users can view own tenant customers"
ON public.customers
FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id 
    FROM public.profiles 
    WHERE profiles.id = auth.uid()
  )
);

-- 2. Permitir CRIAR clientes no próprio tenant
CREATE POLICY "Users can create customers in own tenant"
ON public.customers
FOR INSERT
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id 
    FROM public.profiles 
    WHERE profiles.id = auth.uid()
  )
);

-- 3. Permitir ATUALIZAR clientes do próprio tenant
CREATE POLICY "Users can update own tenant customers"
ON public.customers
FOR UPDATE
USING (
  tenant_id IN (
    SELECT tenant_id 
    FROM public.profiles 
    WHERE profiles.id = auth.uid()
  )
);