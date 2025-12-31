create table public.medical_records (
  id uuid primary key default uuid_generate_v4(),
  organizations_id uuid references public.organizations(id) not null,
  customer_id uuid references public.customers(id) not null,
  content text not null,
  created_at timestamptz default now()
);

alter table public.medical_records enable row level security;

create policy "Users can view own organization medical records"
on public.medical_records for select
using (
  organizations_id in (select organizations_id from public.profiles where id = auth.uid())
);

create policy "Users can insert own organization medical records"
on public.medical_records for insert
with check (
  organizations_id in (select organizations_id from public.profiles where id = auth.uid())
);