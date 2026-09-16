-- ============================================================================
-- 06. CARGO DEL USUARIO
-- ----------------------------------------------------------------------------
-- Agrega la columna donde se guarda el cargo (puesto/rol dentro de la
-- organización, ej. "Analista de Contenido") de cada usuario, mostrado en el
-- header y en las pantallas de saludo/bienvenida. No confundir con
-- `user_role` (rol de acceso al tablero: superadmin/admin/viewer). Ejecutar
-- manualmente en el SQL Editor de Supabase (las ALTER TABLE no son posibles
-- vía REST).
-- ============================================================================

ALTER TABLE centro_mando.profiles
  ADD COLUMN IF NOT EXISTS job_title TEXT;
