create table public.medical_records (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid references public.tenants(id) not null,
  customer_id uuid references public.customers(id) not null,
  content text not null,
  created_at timestamptz default now()
);

alter table public.medical_records enable row level security;

create policy "Users can view own tenant medical records"
on public.medical_records for select
using (
  tenant_id in (select tenant_id from public.profiles where id = auth.uid())
);

create policy "Users can insert own tenant medical records"
on public.medical_records for insert
with check (
  tenant_id in (select tenant_id from public.profiles where id = auth.uid())
);