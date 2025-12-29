-- 1. LIMPEZA DE DADOS RUINS
-- Apaga os usuários que foram criados pela metade (ajuste os emails se precisar)
delete from auth.users where email in ('adm@saas.com', 'adm@adm.com');

-- 2. REMOÇÃO DO PASSADO
-- Apaga a tabela antiga que apareceu no seu print
drop table if exists public.tenants cascade;

-- Remove a função antiga com força total (CASCADE mata o trigger junto)
drop function if exists public.handle_new_user cascade;

-- 3. RECRIANDO A INTELIGÊNCIA (Versão Corrigida)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    'client' -- Insere como cliente, sem tentar preencher tenant_id ou organization_id agora
  );
  return new;
end;
$$ language plpgsql security definer;

-- Recria o Trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. LIMPEZA DE CACHE (Obrigatório)
NOTIFY pgrst, 'reload config';