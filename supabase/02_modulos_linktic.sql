-- ============================================================================
-- SQL SCRIPT - MÓDULOS NUEVOS (redes sociales, prensa, parrilla, estrategia
-- digital) PARA CENTRO DE MANDO DIGITAL LINKTIC
-- ============================================================================
-- Instancia: https://klecvgchqqbkasedxtxj.supabase.co
-- Schema destino: centro_mando
-- Complementa supabase_centro_mando.sql (ya ejecutado). Idempotente.
--
-- Origen: otro dashboard local usado como referencia de estructura.
--   - "Estrategia digital" (campaign_*, content_tracking_summary) y
--     "Parrilla genérica" (dashboard_content) YA EXISTEN en el schema public
--     de ESTA MISMA instancia — se copian estructura + datos reales con
--     `LIKE ... INCLUDING ALL` para garantizar fidelidad exacta.
--   - "Redes sociales" (renombradas aquí con prefijo rrss_ para no chocar con
--     social_perfiles/social_feed ya existentes) y "Análisis de prensa"
--     (prensa_monitoreo) vivían en otro proyecto Supabase: se crean vacías,
--     sin datos históricos (decisión: arrancar en blanco).
--   - "Parrilla por pestañas" (parrilla_custom_tabs + tablas dinámicas
--     parrilla_<slug>): se crea solo el registro de pestañas, vacío; las
--     parrillas viejas de una elección pasada no se migran.
-- ============================================================================

-- ============================================================================
-- 0. GRANTS A service_role QUE FALTABAN EN EL SCRIPT ORIGINAL (por si esta
--    instancia aún no los tiene — ver incidente de /admin/usuarios).
-- ============================================================================
GRANT USAGE ON SCHEMA centro_mando TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA centro_mando TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA centro_mando TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA centro_mando GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA centro_mando GRANT ALL ON SEQUENCES TO service_role;

-- ============================================================================
-- 1. ESTRATEGIA DIGITAL (copiadas desde public, estructura + datos reales)
-- ============================================================================

CREATE TABLE IF NOT EXISTS centro_mando.campaign_dash (LIKE public.campaign_dash INCLUDING ALL);
INSERT INTO centro_mando.campaign_dash SELECT * FROM public.campaign_dash
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS centro_mando.campaign_channels (LIKE public.campaign_channels INCLUDING ALL);
INSERT INTO centro_mando.campaign_channels SELECT * FROM public.campaign_channels
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS centro_mando.daily_plan (LIKE public.daily_plan INCLUDING ALL);
INSERT INTO centro_mando.daily_plan SELECT * FROM public.daily_plan
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS centro_mando.campaign_metrics (LIKE public.campaign_metrics INCLUDING ALL);
INSERT INTO centro_mando.campaign_metrics SELECT * FROM public.campaign_metrics
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS centro_mando.campaign_daily_actuals (LIKE public.campaign_daily_actuals INCLUDING ALL);
INSERT INTO centro_mando.campaign_daily_actuals SELECT * FROM public.campaign_daily_actuals
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS centro_mando.campaign_daily_impressions (LIKE public.campaign_daily_impressions INCLUDING ALL);
INSERT INTO centro_mando.campaign_daily_impressions SELECT * FROM public.campaign_daily_impressions
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS centro_mando.content_tracking_summary (LIKE public.content_tracking_summary INCLUDING ALL);
INSERT INTO centro_mando.content_tracking_summary SELECT * FROM public.content_tracking_summary
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 2. PARRILLA GENÉRICA (copiada desde public, estructura + datos reales)
-- ============================================================================

CREATE TABLE IF NOT EXISTS centro_mando.dashboard_content (LIKE public.dashboard_content INCLUDING ALL);
INSERT INTO centro_mando.dashboard_content SELECT * FROM public.dashboard_content
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 3. PARRILLA POR PESTAÑAS (registro de pestañas dinámicas, vacío)
-- ============================================================================

CREATE TABLE IF NOT EXISTS centro_mando.parrilla_custom_tabs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vertical TEXT NOT NULL DEFAULT 'linktic',
    key TEXT NOT NULL,
    label TEXT NOT NULL,
    table_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (vertical, key)
);

-- Key-value genérico, usado por parrilla y prensa en el proyecto de origen.
CREATE TABLE IF NOT EXISTS centro_mando.manual_metrics (
    key TEXT PRIMARY KEY,
    value JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 4. REDES SOCIALES (vacías, sin migrar histórico de dbEstrategia)
-- ============================================================================

CREATE TABLE IF NOT EXISTS centro_mando.rrss_estrategia_metricas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    categoria TEXT NOT NULL DEFAULT 'linktic',
    fecha DATE NOT NULL,
    seguidores NUMERIC DEFAULT 0,
    nuevos_seguidores NUMERIC DEFAULT 0,
    num_publicaciones NUMERIC DEFAULT 0,
    contenidos_entregados NUMERIC DEFAULT 0,
    contenidos_publicados NUMERIC DEFAULT 0,
    impresiones NUMERIC DEFAULT 0,
    reacciones_likes NUMERIC DEFAULT 0,
    comentarios_respuestas NUMERIC DEFAULT 0,
    social_performance_score NUMERIC DEFAULT 0,
    sentimiento_positivo NUMERIC DEFAULT 0,
    sentimiento_negativo NUMERIC DEFAULT 0,
    publicaciones_principales TEXT, -- URL de imagen (Storage: centro-mando-images)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (fecha, categoria)
);

CREATE TABLE IF NOT EXISTS centro_mando.rrss_listening_metricas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    categoria TEXT NOT NULL DEFAULT 'linktic',
    fecha DATE NOT NULL,
    resultados TEXT,
    interacciones TEXT,
    alcance_potencial TEXT,
    sentimiento_positivo NUMERIC DEFAULT 0,
    sentimiento_negativo NUMERIC DEFAULT 0,
    activity_peak TEXT, -- URL de imagen (Storage: centro-mando-images)
    hashtags TEXT,      -- URL de imagen (Storage: centro-mando-images)
    hashtags_para_usar JSONB DEFAULT '[]'::jsonb,
    palabras_claves_para_usar JSONB DEFAULT '[]'::jsonb,
    que_no_usar JSONB DEFAULT '[]'::jsonb,
    cuentas_impacto JSONB DEFAULT '[]'::jsonb,
    sitios_impacto JSONB DEFAULT '[]'::jsonb,
    cuota_emocion JSONB DEFAULT '{}'::jsonb,
    trend_resultados NUMERIC DEFAULT 0,
    trend_interacciones NUMERIC DEFAULT 0,
    trend_alcance_potencial NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (fecha, categoria)
);

-- ============================================================================
-- 5. ANÁLISIS DE PRENSA (vacía, sin migrar histórico de dbEstrategia)
-- ============================================================================

CREATE TABLE IF NOT EXISTS centro_mando.prensa_monitoreo (
    fecha DATE PRIMARY KEY,
    menciones_totales INTEGER DEFAULT 0,
    audiencia_estimada INTEGER DEFAULT 0,
    share_of_voice NUMERIC DEFAULT 0,
    sentimiento_positivo NUMERIC DEFAULT 0,
    sentimiento_negativo NUMERIC DEFAULT 0,
    cobertura_tv INTEGER DEFAULT 0,
    cobertura_digital INTEGER DEFAULT 0,
    cobertura_radio INTEGER DEFAULT 0,
    cobertura_impresos INTEGER DEFAULT 0,
    valor_publicitario NUMERIC DEFAULT 0,
    tier_1 INTEGER DEFAULT 0,
    tier_2 INTEGER DEFAULT 0,
    tier_3 INTEGER DEFAULT 0,
    ubicaciones JSONB DEFAULT '[]'::jsonb, -- [{city, lat, lng, weight}]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 6. STORAGE — bucket para imágenes de redes sociales (publicaciones
--    principales, activity peak, hashtags)
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('centro-mando-images', 'centro-mando-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "centro_mando_images lectura publica" ON storage.objects;
CREATE POLICY "centro_mando_images lectura publica" ON storage.objects
    FOR SELECT TO public USING (bucket_id = 'centro-mando-images');

DROP POLICY IF EXISTS "centro_mando_images escritura autenticados" ON storage.objects;
CREATE POLICY "centro_mando_images escritura autenticados" ON storage.objects
    FOR ALL TO authenticated
    USING (bucket_id = 'centro-mando-images')
    WITH CHECK (bucket_id = 'centro-mando-images');

-- ============================================================================
-- 7. SEGURIDAD (ROW LEVEL SECURITY) — mismo patrón que supabase_centro_mando.sql:
--    lectura para cualquier autenticado, escritura para admin/superadmin.
-- ============================================================================

DO $$
DECLARE
    table_name TEXT;
    tables_list TEXT[] := ARRAY[
        'campaign_dash', 'campaign_channels', 'daily_plan', 'campaign_metrics',
        'campaign_daily_actuals', 'campaign_daily_impressions', 'content_tracking_summary',
        'dashboard_content',
        'parrilla_custom_tabs', 'manual_metrics',
        'rrss_estrategia_metricas', 'rrss_listening_metricas',
        'prensa_monitoreo'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables_list
    LOOP
        EXECUTE format('ALTER TABLE centro_mando.%I ENABLE ROW LEVEL SECURITY', table_name);

        EXECUTE format('DROP POLICY IF EXISTS "Lectura autenticados" ON centro_mando.%I', table_name);
        EXECUTE format('CREATE POLICY "Lectura autenticados" ON centro_mando.%I FOR SELECT TO authenticated USING (true)', table_name);

        EXECUTE format('DROP POLICY IF EXISTS "Escritura administradores" ON centro_mando.%I', table_name);
        EXECUTE format('CREATE POLICY "Escritura administradores" ON centro_mando.%I FOR ALL TO authenticated USING (centro_mando.is_admin()) WITH CHECK (centro_mando.is_admin())', table_name);
    END LOOP;
END $$;

-- ============================================================================
-- 8. GRANTS Y PERMISOS DE ACCESO API (POSTGREST) — re-ejecuta los mismos GRANT
--    "ON ALL TABLES" del script original para que cubran también estas tablas
--    nuevas (idempotente, no depende de ALTER DEFAULT PRIVILEGES).
-- ============================================================================

GRANT USAGE ON SCHEMA centro_mando TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA centro_mando TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA centro_mando TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA centro_mando TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA centro_mando TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA centro_mando TO service_role;
