-- === 1. LIMPEZA TOTAL (Remove regras antigas para evitar conflito) ===
drop policy if exists "Users can view own organization" on public.organizations;
drop policy if exists "Users can update own organization" on public.organizations;
drop policy if exists "Users can insert organizations" on public.organizations;
-- Remove também variações de nomes comuns que o Supabase cria sozinho
drop policy if exists "Enable read access for users based on organization_id" on public.organizations;
drop policy if exists "Enable insert for authenticated users only" on public.organizations;

-- Limpeza da tabela Profiles
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;


-- === 2. CRIAÇÃO DAS REGRAS CORRETAS ===

-- Habilita RLS
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;

-- Permite CRIAR clínica (Essencial para o Setup inicial)
create policy "Users can insert organizations"
on public.organizations for insert
to authenticated
with check (true);

-- Permite VER a clínica (Se ela estiver vinculada ao seu perfil)
create policy "Users can view own organization"
on public.organizations for select
to authenticated
using (
  id in (
    select organization_id from public.profiles 
    where profiles.id = auth.uid()
  )
);

-- Permite EDITAR a clínica (Se ela estiver vinculada ao seu perfil)
create policy "Users can update own organization"
on public.organizations for update
to authenticated
using (
  id in (
    select organization_id from public.profiles 
    where profiles.id = auth.uid()
  )
);

-- Permite EDITAR o próprio perfil (Para vincular o ID da clínica nele)
create policy "Users can update own profile"
on public.profiles for update
to authenticated
using ( id = auth.uid() );

-- Permite CRIAR o próprio perfil (Caso a trigger falhe ou seja o primeiro acesso)
create policy "Users can insert own profile"
on public.profiles for insert
to authenticated
with check ( id = auth.uid() );