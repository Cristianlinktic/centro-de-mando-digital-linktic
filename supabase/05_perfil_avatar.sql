-- ============================================================================
-- 05. FOTO DE PERFIL POR USUARIO
-- ----------------------------------------------------------------------------
-- Agrega la columna donde se guarda la URL pública (bucket de Storage ya
-- existente "centro-mando-images", provisionado en 02_modulos_linktic.sql)
-- de la foto de perfil de cada usuario. Ejecutar manualmente en el SQL
-- Editor de Supabase (las ALTER TABLE no son posibles vía REST).
-- ============================================================================

ALTER TABLE centro_mando.profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;
