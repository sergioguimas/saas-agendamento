create or replace function public.create_new_organization(
  org_name text,
  org_document text,
  org_phone text,
  org_email text,
  org_address text,
  org_evolution_url text,
  org_evolution_key text
) returns uuid as $$
declare
  new_org_id uuid;
  new_slug text;
begin
  -- 1. Gera um slug único (ex: clinica-vida-a1b2)
  new_slug := lower(regexp_replace(org_name, '[^a-zA-Z0-9]', '-', 'g')) || '-' || substring(md5(random()::text) from 1 for 5);

  -- 2. Cria a Organização
  insert into public.organizations (
    name, slug, document, phone, email, address, evolution_api_url, evolution_api_key
  )
  values (
    org_name, new_slug, org_document, org_phone, org_email, org_address, org_evolution_url, org_evolution_key
  )
  returning id into new_org_id;

  -- 3. Vincula IMEDIATAMENTE ao perfil de quem chamou a função
  update public.profiles
  set organization_id = new_org_id,
      role = 'owner'
  where id = auth.uid();

  -- Retorna o ID criado
  return new_org_id;
end;
$$ language plpgsql security definer; -- 'security definer' é o segredo: roda como admin