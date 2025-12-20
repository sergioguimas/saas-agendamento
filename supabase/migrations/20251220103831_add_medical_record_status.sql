-- 1. Adicionar colunas de controle
ALTER TABLE public.medical_records
ADD COLUMN status text default 'draft' check (status in ('draft', 'signed')),
ADD COLUMN signed_at timestamptz,
ADD COLUMN signature_metadata jsonb;

-- 2. Garantir que registros antigos virem rascunho
UPDATE public.medical_records SET status = 'draft' WHERE status IS NULL;

-- 3. SEGURANÇA (O Cadeado)
-- Essa regra impede qualquer edição (UPDATE) se o status for 'signed'
CREATE POLICY "Prevent update of signed records"
ON public.medical_records
FOR UPDATE
USING (status = 'draft')
WITH CHECK (status = 'draft' OR status = 'signed');