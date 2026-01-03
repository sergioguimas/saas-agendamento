-- 1. Garante que a tabela tem segurança ativada
alter table public.profiles enable row level security;

-- 2. Remove regras antigas de leitura (se existirem) para evitar conflito
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;

-- 3. CRIA A REGRA DE LEITURA (SELECT)
-- "O usuário pode ver a linha da tabela profiles se o ID dela for igual ao ID dele"
create policy "Users can view own profile"
on public.profiles for select
to authenticated
using ( id = auth.uid() );