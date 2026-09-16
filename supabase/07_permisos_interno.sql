-- ============================================================================
-- 07. PERMISOS DE PANTALLAS DE INTERNO
-- ----------------------------------------------------------------------------
-- Hasta ahora /interno/* no tenía pantallas dadas de alta en el catálogo de
-- permisos (ver src/lib/auth/rbac.ts): estaban abiertas a cualquier usuario
-- logueado, sin aparecer en el selector de "Usuarios". Al darlas de alta
-- (lt-tab:interno-instagram, lt-tab:interno-canales, lt-tab:interno-mailing,
-- lt-tab:interno-mailing-prueba) pasan a requerir permiso explícito, igual
-- que las de Externo.
--
-- Este backfill evita que los usuarios que ya venían usando Interno pierdan
-- esas pestañas de golpe: les otorga las 4 pantallas nuevas a todo usuario
-- que ya tenga algún acceso lt-tab: (es decir, que ya es usuario activo de
-- este tablero). Los superadmin no lo necesitan (ven todo siempre). Ejecutar
-- manualmente en el SQL Editor de Supabase una sola vez.
-- ============================================================================

INSERT INTO centro_mando.user_screen_access (user_id, screen_key)
SELECT DISTINCT usuarios.user_id, pantallas.screen_key
FROM (
  SELECT DISTINCT user_id FROM centro_mando.user_screen_access WHERE screen_key LIKE 'lt-tab:%'
) AS usuarios
CROSS JOIN (
  VALUES
    ('lt-tab:interno-instagram'),
    ('lt-tab:interno-canales'),
    ('lt-tab:interno-mailing'),
    ('lt-tab:interno-mailing-prueba')
) AS pantallas(screen_key)
ON CONFLICT (user_id, screen_key) DO NOTHING;
