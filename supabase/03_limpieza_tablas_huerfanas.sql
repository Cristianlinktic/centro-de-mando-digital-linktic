-- ============================================================================
-- LIMPIEZA: TABLAS HUÉRFANAS CON DATOS DE EJEMPLO (CNE / TESTIGOS / MAPA GLOBAL)
-- ============================================================================
-- Estas 6 tablas pertenecían a módulos que ya se eliminaron del menú
-- ("Mapa Global" y "Testigos Electorales"). Ningún código del proyecto las
-- consulta hoy, pero seguían en el schema centro_mando con datos de ejemplo
-- que mencionaban "CNE" y "Elecciones2026".
--
-- Ejecuta esto UNA VEZ en el SQL Editor de Supabase (Project > SQL Editor).
-- ============================================================================

DROP TABLE IF EXISTS centro_mando.mapa_marcadores;
DROP TABLE IF EXISTS centro_mando.mapa_paises;
DROP TABLE IF EXISTS centro_mando.testigos_misiones;
DROP TABLE IF EXISTS centro_mando.testigos_departamentos;
DROP TABLE IF EXISTS centro_mando.testigos_kpis;
DROP TABLE IF EXISTS centro_mando.testigos_estrategia;
