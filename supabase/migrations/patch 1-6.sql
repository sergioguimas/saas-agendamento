-- 1. Primeiro, removemos a regra antiga "burra" que bloqueia tudo
ALTER TABLE appointments
DROP CONSTRAINT IF EXISTS appointments_organization_id_tstzrange_excl;

-- 2. Garantimos que a extensão necessária existe
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 3. Criamos a regra nova "inteligente"
-- Ela diz: "Proibido horário duplicado, EXCETO se o status for 'canceled'"
ALTER TABLE appointments
ADD CONSTRAINT appointments_organization_id_tstzrange_excl
EXCLUDE USING gist (
  organization_id WITH =,
  tstzrange(start_time, end_time) WITH &&
)
WHERE (status != 'canceled');