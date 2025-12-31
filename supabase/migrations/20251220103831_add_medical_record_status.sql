-- 1. Adicionar colunas de controle
ALTER TABLE public.medical_records
ADD COLUMN status text default 'draft' check (status in ('draft', 'signed')),
ADD COLUMN signed_at timestamptz,
ADD COLUMN signature_metadata jsonb;

-- 2. Garantir que registros antigos virem rascunho
UPDATE public.medical_records SET status = 'draft' WHERE status IS NULL;

-- 3. SEGURANÇA
-- Removemos a política anterior se existir (apenas segurança para re-runs)
DROP POLICY IF EXISTS "Prevent update of signed records" ON public.medical_records;

CREATE POLICY "Users can update own organizations drafts"
ON public.medical_records FOR UPDATE
USING (
  organizations_id = (select organizations_id from public.profiles where id = auth.uid()) 
  AND
  status = 'draft'
)
WITH CHECK (
  organizations_id = (select organizations_id from public.profiles where id = auth.uid())
  AND
  (status = 'draft' or status = 'signed')
);

-- Permite apagar APENAS se for draft e pertencer ao meu organizations
create policy "Users can delete own organizations drafts"
on public.medical_records for delete
using (
  organizations_id = (select organizations_id from public.profiles where id = auth.uid()) 
  AND
  status = 'draft'
);