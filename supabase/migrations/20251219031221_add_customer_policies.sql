-- 1. Permitir VISUALIZAR clientes do próprio organization
CREATE POLICY "Users can view own organization customers"
ON public.customers
FOR SELECT
USING (
  organizations_id IN (
    SELECT organizations_id 
    FROM public.profiles 
    WHERE profiles.id = auth.uid()
  )
);

-- 2. Permitir CRIAR clientes no próprio organization
CREATE POLICY "Users can create customers in own organizations"
ON public.customers
FOR INSERT
WITH CHECK (
  organizations_id IN (
    SELECT organizations_id 
    FROM public.profiles 
    WHERE profiles.id = auth.uid()
  )
);

-- 3. Permitir ATUALIZAR clientes do próprio organization
CREATE POLICY "Users can update own organization customers"
ON public.customers
FOR UPDATE
USING (
  organizations_id IN (
    SELECT organizations_id 
    FROM public.profiles 
    WHERE profiles.id = auth.uid()
  )
);