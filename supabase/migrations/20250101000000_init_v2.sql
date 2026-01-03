-- 1. Configuração Inicial e Extensões
create extension if not exists "uuid-ossp";
create extension if not exists "btree_gist";

-- 2. Tabela de Organizações (Multi-tenancy)
-- Unificamos configs do WhatsApp e Evolution aqui ou num JSONB, mantendo colunas explícitas para o que é essencial.
create table public.organizations (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  name text not null,
  slug text unique not null,
  document text, -- CPF/CNPJ genérico
  
  -- Configuração da Evolution API (Por tenant)
  evolution_instance_name text,
  evolution_api_key text,
  evolution_api_url text, -- Caso cada cliente tenha sua URL, senão pode ser var de ambiente
  
  subscription_status text default 'active',
  stripe_customer_id text,
  
  whatsapp_config jsonb default '{}'::jsonb -- Para configurações extras
);

-- 3. Tabela de Perfis (Vinculada ao Auth do Supabase)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  created_at timestamptz default now(),
  organization_id uuid references public.organizations(id) on delete set null,
  full_name text,
  avatar_url text,
  role text default 'staff' check (role in ('owner', 'admin', 'staff'))
);

-- 4. Tabela de Serviços (O que a empresa vende)
create table public.services (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references public.organizations(id) not null,
  title text not null,
  description text,
  duration_minutes int not null default 30,
  price decimal(10,2) default 0.00,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 5. Tabela de Clientes (Genérico: serve para Pacientes, Leads, Alunos)
create table public.customers (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references public.organizations(id) not null,
  name text not null,
  phone text not null, -- Importante para o WhatsApp
  email text,
  document text, -- CPF/RG opcional
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 6. Tabela de Agendamentos
create table public.appointments (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references public.organizations(id) not null,
  customer_id uuid references public.customers(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  profile_id uuid references public.profiles(id), -- Quem atendeu (opcional)
  
  start_time timestamptz not null,
  end_time timestamptz not null,
  
  status text default 'pending' check (status in ('pending', 'confirmed', 'canceled', 'completed', 'no_show')),
  price decimal(10,2),
  notes text,
  created_at timestamptz default now(),

  -- Evita sobreposição de horário para o mesmo atendente na mesma organização (Opcional, mas recomendado)
  exclude using gist (
    organization_id with =,
    tstzrange(start_time, end_time) with &&
  )
);

-- 7. Histórico de Atendimentos (Ex-Medical Records)
-- Nome genérico para servir advogados, médicos, mecânicos...
create table public.service_notes (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references public.organizations(id) not null,
  customer_id uuid references public.customers(id) on delete cascade,
  profile_id uuid references public.profiles(id), -- Autor da nota
  
  title text, -- Ex: "Evolução do Tratamento" ou "Relatório de Visita"
  content text not null,
  tags text[], -- Array de tags para filtrar depois
  
  created_at timestamptz default now()
);

-- 8. Instâncias do WhatsApp (Status da conexão)
create table public.whatsapp_instances (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade unique, -- 1 instância por organização
  name text not null,
  status text default 'disconnected',
  qr_code text,
  updated_at timestamptz default now()
);

-- INDEXES para performance
create index idx_customers_org_phone on public.customers(organization_id, phone);
create index idx_appointments_org_date on public.appointments(organization_id, start_time);

-- SEGURANÇA (RLS - Row Level Security)
-- Garante que um tenant nunca veja dados de outro.

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.customers enable row level security;
alter table public.appointments enable row level security;
alter table public.service_notes enable row level security;
alter table public.whatsapp_instances enable row level security;

-- Função Helper para pegar o ID da organização do usuário logado
create or replace function public.get_user_org_id()
returns uuid as $$
  select organization_id from public.profiles where id = auth.uid() limit 1;
$$ language sql security definer;

-- POLICIES (Políticas de Acesso)

-- Organizations: Usuários veem apenas a sua.
create policy "Users can view own organization" on public.organizations
  for select using (id = get_user_org_id());

-- Profiles: Usuários veem perfis da mesma organização.
create policy "Users can view org profiles" on public.profiles
  for select using (organization_id = get_user_org_id());

create policy "Users can update own profile" on public.profiles
  for update using (id = auth.uid());

-- Services, Customers, Appointments, Notes, Whatsapp:
-- A regra é simples: organization_id deve bater com o do usuário.

create policy "Access own org services" on public.services
  for all using (organization_id = get_user_org_id());

create policy "Access own org customers" on public.customers
  for all using (organization_id = get_user_org_id());

create policy "Access own org appointments" on public.appointments
  for all using (organization_id = get_user_org_id());

create policy "Access own org notes" on public.service_notes
  for all using (organization_id = get_user_org_id());

create policy "Access own org whatsapp" on public.whatsapp_instances
  for all using (organization_id = get_user_org_id());