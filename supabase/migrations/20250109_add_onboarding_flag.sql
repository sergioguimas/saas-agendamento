-- Adiciona a flag de controle de onboarding
alter table public.organizations 
add column if not exists onboarding_completed boolean default false;