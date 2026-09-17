-- ============================================================================
-- 10. FUSIÓN DE "ESTRATEGIA MAILING" (INTERNO) CON "MAILING PRUEBA"
-- ----------------------------------------------------------------------------
-- La pantalla /interno/mailing-prueba (datos simulados) pasó a ser la
-- Estrategia Mailing real de Interno, en /interno/mailing — y absorbió esa
-- ruta. El placeholder viejo de /interno/mailing (sin integración de datos)
-- se retiró del código junto con su clave de permiso, lt-tab:interno-mailing.
--
-- La clave que sobrevive es lt-tab:interno-mailing-prueba (no se renombra,
-- para no invalidar los permisos ya concedidos ahí — ver src/lib/auth/rbac.ts).
--
-- Este script evita que alguien que solo tenía la clave vieja
-- (lt-tab:interno-mailing) pierda acceso a Interno → Mailing: le otorga
-- también la clave que sobrevive. Idempotente, se puede correr las veces
-- que haga falta.
-- ============================================================================

INSERT INTO centro_mando.user_screen_access (user_id, screen_key)
SELECT user_id, 'lt-tab:interno-mailing-prueba'
FROM centro_mando.user_screen_access
WHERE screen_key = 'lt-tab:interno-mailing'
ON CONFLICT (user_id, screen_key) DO NOTHING;

-- Las filas con la clave vieja quedan huérfanas (ya no corresponden a ninguna
-- pantalla del catálogo) pero inertes — no hace falta borrarlas para que todo
-- funcione bien. Si querés limpiarlas de una vez:
-- DELETE FROM centro_mando.user_screen_access WHERE screen_key = 'lt-tab:interno-mailing';


-- ============================================================================
-- VERIFICACIÓN — todo usuario que tenía la clave vieja debe tener también la nueva.
-- ============================================================================

SELECT
  viejo.user_id,
  (nuevo.user_id IS NOT NULL) AS tiene_clave_nueva
FROM centro_mando.user_screen_access viejo
LEFT JOIN centro_mando.user_screen_access nuevo
  ON nuevo.user_id = viejo.user_id AND nuevo.screen_key = 'lt-tab:interno-mailing-prueba'
WHERE viejo.screen_key = 'lt-tab:interno-mailing';
