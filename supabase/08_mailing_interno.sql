-- ============================================================================
-- 08. MAILING INTERNO — MÉTRICAS REALES DE CAMPAÑAS DE CORREO
-- ----------------------------------------------------------------------------
-- Instancia: https://klecvgchqqbkasedxtxj.supabase.co
-- Schema destino: centro_mando
-- Idempotente: se puede volver a ejecutar sin efectos secundarios.
--
-- Da respaldo real a /interno/mailing-prueba, que hoy corre con un generador
-- pseudoaleatorio (src/lib/mailing-prueba/data.ts). Las tres tablas y la vista
-- de este script cubren exactamente los tipos que esa pantalla ya define:
--
--     CampanaResumen / CampanaDetalle  ->  centro_mando.mailing_campanas
--     DestinatarioRow                  ->  centro_mando.mailing_destinatarios
--     EventoRow                        ->  centro_mando.mailing_eventos
--     MesResumen / MesDetalle          ->  centro_mando.mailing_meses (vista)
--
-- Origen de los datos: exports de eventos de SendGrid (28 columnas), leídos y
-- consolidados por un script propio en Python (dashboard.py) que ya alimenta el
-- tablero estático "correos-dashboard-puce". Ese script sigue siendo el único
-- intérprete del export; aquí solo aterriza lo que él ya calculó.
--
-- QUIÉN ESCRIBE
-- Ninguna fila de estas tablas se escribe desde la aplicación web. El único
-- escritor es el script en Python, autenticado como un usuario normal de este
-- tablero con rol 'admin' —dado de alta desde la pantalla de Usuarios como
-- cualquier persona—. No usa la llave de servicio, así que queda sujeto a las
-- mismas políticas RLS que todo el mundo y se le revoca el acceso cambiándole
-- el rol, sin rotar credenciales ni tocar código.
--
-- PRIVACIDAD — IMPORTANTE
-- La columna `correo` de mailing_destinatarios y mailing_eventos guarda un
-- SEUDÓNIMO, nunca la dirección real: u<sha256(parte local)[:6]>@<dominio>
-- (p. ej. u4f1a9c@linktic.com). Es estable —la misma persona produce siempre el
-- mismo seudónimo, así que se puede seguir su comportamiento entre campañas— y
-- no es reversible. El dominio sí es real, porque es información de negocio.
-- Las direcciones reales no salen de la máquina donde corre el script.
--
-- Por eso, y a diferencia de las migraciones 01 a 07, aquí NO se le concede
-- SELECT al rol `anon`: saber quién abrió y quién hizo clic no debe ser legible
-- sin sesión, ni siquiera por seudónimo. Ver sección 6.
-- ============================================================================


-- ============================================================================
-- 1. RESUMEN POR CAMPAÑA
-- ----------------------------------------------------------------------------
-- Una fila por envío. Es la tabla que SIEMPRE se guarda, sin importar el tamaño
-- del envío: alimenta el índice de meses, los KPIs, la curva por día, la tabla
-- de campañas, la dona y el embudo. El detalle por destinatario (secciones 2 y
-- 3) es lo único opcional — ver la columna `detalle_guardado`.
--
-- Sobre los dos campos de fecha: `fecha` es el dato (se ordena, se agrupa y se
-- filtra por él) y `envio` es solo la etiqueta que se muestra, tal como la
-- calcula el script. No se deriva una de otra para no introducir corrimientos
-- de zona horaria entre el script (America/Bogota) y el navegador del usuario.
-- ============================================================================

CREATE TABLE IF NOT EXISTS centro_mando.mailing_campanas (
    -- identificador estable y legible: "2026-08-03-iniciamos-la-celebracion"
    id TEXT PRIMARY KEY,

    fecha DATE NOT NULL,
    -- "2026-08": derivado, para agrupar por mes sin recalcularlo en cada consulta.
    --
    -- OJO: aquí NO se puede usar to_char(fecha, 'YYYY-MM'). Una columna generada
    -- exige una expresión IMMUTABLE y to_char() sobre fechas está declarada
    -- STABLE (depende de lc_time para los nombres de mes), así que Postgres la
    -- rechaza con "generation expression is not immutable". EXTRACT sobre un
    -- DATE sí es inmutable, y como aquí solo se arman números no hace falta
    -- ningún nombre de mes.
    mes_id TEXT GENERATED ALWAYS AS (
        lpad(EXTRACT(YEAR  FROM fecha)::int::text, 4, '0') || '-' ||
        lpad(EXTRACT(MONTH FROM fecha)::int::text, 2, '0')
    ) STORED,
    -- etiqueta de envío para mostrar, p. ej. "2026-08-03 13:00"
    envio TEXT,

    asunto TEXT NOT NULL,
    remitente TEXT,
    template TEXT,

    -- Conteos. Todos son PERSONAS ÚNICAS, no eventos: a un destinatario le
    -- pueden llegar veinte aperturas y aquí cuenta una sola vez. Es la regla
    -- que aplica el script al consolidar y la razón de que estas cifras no
    -- coincidan con un conteo crudo de filas del export.
    base INTEGER NOT NULL DEFAULT 0,              -- destinatarios únicos del export
    filas_descartadas INTEGER NOT NULL DEFAULT 0, -- filas de prueba y ruido descartadas
    procesados INTEGER NOT NULL DEFAULT 0,
    entregados INTEGER NOT NULL DEFAULT 0,
    no_entregados INTEGER NOT NULL DEFAULT 0,     -- rebotes + descartados
    rebotes INTEGER NOT NULL DEFAULT 0,
    descartados INTEGER NOT NULL DEFAULT 0,
    diferidos INTEGER NOT NULL DEFAULT 0,
    aperturas_unicas INTEGER NOT NULL DEFAULT 0,
    clics_unicos INTEGER NOT NULL DEFAULT 0,

    -- Reparto de la dona: cada destinatario cae en UNA sola porción, por
    -- prioridad clic > abierto > entregado > no entregado. Se guarda y no se
    -- deriva de las cifras de arriba porque la derivación NO es correcta:
    -- en 13 de las 77 campañas medidas hay gente que hizo clic sin que se
    -- registrara su apertura (imágenes bloqueadas pero enlace pulsado), así que
    -- bucket_abierto != aperturas_unicas - clics_unicos. Guardar las cuatro
    -- cifras es además lo que permite dibujar la dona de un envío masivo, para
    -- el que no habrá filas de detalle.
    bucket_clic INTEGER NOT NULL DEFAULT 0,
    bucket_abierto INTEGER NOT NULL DEFAULT 0,
    bucket_entregado INTEGER NOT NULL DEFAULT 0,
    bucket_no_entregado INTEGER NOT NULL DEFAULT 0,

    -- Tasas en porcentaje con un decimal, ya calculadas por el script. Se
    -- guardan en vez de derivarse para que el tablero web y el estático
    -- muestren exactamente el mismo número redondeado.
    apertura NUMERIC(5,1) NOT NULL DEFAULT 0,     -- aperturas únicas / entregados
    ctr      NUMERIC(5,1) NOT NULL DEFAULT 0,     -- clics únicos / entregados
    ctor     NUMERIC(5,1) NOT NULL DEFAULT 0,     -- clics únicos / aperturas únicas

    -- false = el correo no llevaba enlaces, así que un CTR de 0% es correcto y
    -- no una campaña que fracasó. Sin esto no se distingue un caso del otro.
    enlaces BOOLEAN NOT NULL DEFAULT true,

    -- false = envío por encima del umbral (5.000 destinatarios) cuyo detalle
    -- individual no se conservó. TODO lo demás de esta fila sigue siendo exacto:
    -- la pantalla de campaña puede dibujar KPIs, dona y embudo igual que
    -- siempre, y solo debe ocultar las dos tablas paginadas.
    detalle_guardado BOOLEAN NOT NULL DEFAULT true,

    -- trazabilidad hacia el archivo de origen, p. ej. "3 Agosto/1"
    origen TEXT,
    -- miniatura del correo, si algún día se publica en un CDN accesible
    miniatura_url TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS mailing_campanas_mes_idx
    ON centro_mando.mailing_campanas (mes_id, fecha);


-- ============================================================================
-- 2. DESTINATARIOS POR CAMPAÑA
-- ----------------------------------------------------------------------------
-- Una fila por persona y campaña, con su estado final. Los nombres de columna
-- reproducen literalmente el tipo DestinatarioRow de data.ts (incluidos `abrio`
-- y `reboto`) para que la consulta se pueda mapear sin traducir campo por campo.
-- Tabla OPCIONAL: no se llena para envíos por encima del umbral.
-- ============================================================================

CREATE TABLE IF NOT EXISTS centro_mando.mailing_destinatarios (
    campana_id TEXT NOT NULL
        REFERENCES centro_mando.mailing_campanas(id) ON DELETE CASCADE,
    -- SEUDÓNIMO, nunca la dirección real (ver nota de privacidad arriba)
    correo TEXT NOT NULL,

    procesado  BOOLEAN NOT NULL DEFAULT false,
    entregado  BOOLEAN NOT NULL DEFAULT false,
    abrio      BOOLEAN NOT NULL DEFAULT false,
    clic       BOOLEAN NOT NULL DEFAULT false,
    diferido   BOOLEAN NOT NULL DEFAULT false,
    reboto     BOOLEAN NOT NULL DEFAULT false,
    descartado BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (campana_id, correo)
);

CREATE INDEX IF NOT EXISTS mailing_destinatarios_campana_idx
    ON centro_mando.mailing_destinatarios (campana_id);


-- ============================================================================
-- 3. EVENTOS POR CAMPAÑA
-- ----------------------------------------------------------------------------
-- La tabla que crece: un envío a 23.000 registros produciría del orden de
-- 60.000 filas aquí, y por eso existe el umbral. `bucket` es el estado FINAL
-- del destinatario dueño del evento —no del evento mismo— y es lo que permite
-- que al hacer clic en una porción de la dona se filtren todos los eventos de
-- esa gente, no solo los que llevan ese nombre. Se guarda en vez de derivarse
-- en cada consulta.
-- Tabla OPCIONAL: no se llena para envíos por encima del umbral.
-- ============================================================================

CREATE TABLE IF NOT EXISTS centro_mando.mailing_eventos (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    campana_id TEXT NOT NULL
        REFERENCES centro_mando.mailing_campanas(id) ON DELETE CASCADE,

    ocurrido_en TIMESTAMP NOT NULL,   -- hora local del envío (America/Bogota)
    -- SEUDÓNIMO, nunca la dirección real
    correo TEXT NOT NULL,

    evento TEXT NOT NULL,
    bucket TEXT NOT NULL
);

-- Los CHECK se aplican por separado para que el script sea idempotente: si ya
-- existen se borran y se vuelven a crear, en vez de fallar el CREATE TABLE.
ALTER TABLE centro_mando.mailing_eventos
    DROP CONSTRAINT IF EXISTS mailing_eventos_evento_check;
ALTER TABLE centro_mando.mailing_eventos
    ADD CONSTRAINT mailing_eventos_evento_check
    CHECK (evento IN ('Procesado','Entregado','Abierto','Clic',
                      'Rebotado','Descartado','Diferido'));

ALTER TABLE centro_mando.mailing_eventos
    DROP CONSTRAINT IF EXISTS mailing_eventos_bucket_check;
ALTER TABLE centro_mando.mailing_eventos
    ADD CONSTRAINT mailing_eventos_bucket_check
    CHECK (bucket IN ('clic','abierto','entregado','no_entregado'));

CREATE INDEX IF NOT EXISTS mailing_eventos_campana_idx
    ON centro_mando.mailing_eventos (campana_id, ocurrido_en);


-- ============================================================================
-- 4. VISTA DE MESES
-- ----------------------------------------------------------------------------
-- Resuelve listMeses() y la cabecera de getMes() en una sola consulta, sin
-- traerse todas las campañas al navegador para sumarlas allí.
--
-- Las tasas del mes NO son el promedio de las tasas de sus campañas: se
-- recalculan sobre los totales, porque promediar porcentajes le da el mismo
-- peso a un envío de 20 personas que a uno de 23.000.
--
-- Como se alimenta solo de mailing_campanas —que siempre está completa—, los
-- meses que contengan envíos masivos sin detalle salen exactos igual.
--
-- security_invoker hace que la vista se evalúe con los permisos de quien
-- consulta, de modo que hereda las políticas RLS de mailing_campanas en vez de
-- saltárselas (requiere PostgreSQL 15+; Supabase ya va por encima).
-- ============================================================================

DROP VIEW IF EXISTS centro_mando.mailing_meses;
CREATE VIEW centro_mando.mailing_meses
WITH (security_invoker = on) AS
SELECT
    mes_id AS id,
    CASE to_char(MIN(fecha), 'MM')
        WHEN '01' THEN 'Enero'   WHEN '02' THEN 'Febrero'  WHEN '03' THEN 'Marzo'
        WHEN '04' THEN 'Abril'   WHEN '05' THEN 'Mayo'     WHEN '06' THEN 'Junio'
        WHEN '07' THEN 'Julio'   WHEN '08' THEN 'Agosto'   WHEN '09' THEN 'Septiembre'
        WHEN '10' THEN 'Octubre' WHEN '11' THEN 'Noviembre' ELSE 'Diciembre'
    END || ' ' || to_char(MIN(fecha), 'YYYY')            AS label,
    MIN(fecha)                                            AS desde,
    MAX(fecha)                                            AS hasta,
    COUNT(*)::INTEGER                                     AS campanas,
    SUM(procesados)::INTEGER                              AS procesados,
    SUM(entregados)::INTEGER                              AS entregados,
    SUM(no_entregados)::INTEGER                           AS no_entregados,
    SUM(aperturas_unicas)::INTEGER                        AS aperturas_unicas,
    SUM(clics_unicos)::INTEGER                            AS clics_unicos,
    ROUND(100.0 * SUM(aperturas_unicas) / NULLIF(SUM(entregados), 0), 1) AS apertura,
    ROUND(100.0 * SUM(clics_unicos)     / NULLIF(SUM(entregados), 0), 1) AS ctr,
    ROUND(100.0 * SUM(clics_unicos)     / NULLIF(SUM(aperturas_unicas), 0), 1) AS ctor,
    ROUND(100.0 * SUM(no_entregados)    / NULLIF(SUM(procesados), 0), 1) AS no_entregados_pct
FROM centro_mando.mailing_campanas
GROUP BY mes_id;


-- ============================================================================
-- 5. SEGURIDAD (ROW LEVEL SECURITY)
-- ----------------------------------------------------------------------------
-- Mismo patrón que 01_schema.sql y 02_modulos_linktic.sql, sin desviaciones:
-- lectura para cualquier autenticado, escritura para admin/superadmin según
-- centro_mando.is_admin().
--
-- Se evaluó un rol acotado solo para mailing y se descartó a favor de la
-- simplicidad. Consecuencia asumida y conocida: la cuenta con la que escribe el
-- script puede escribir por API en cualquier tabla protegida por is_admin(), no
-- solo en las de mailing, si su credencial se filtra.
-- ============================================================================

DO $$
DECLARE
    table_name TEXT;
    tables_list TEXT[] := ARRAY[
        'mailing_campanas', 'mailing_destinatarios', 'mailing_eventos'
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
-- 6. GRANTS DE API (POSTGREST)
-- ----------------------------------------------------------------------------
-- Única desviación respecto a las migraciones anteriores: aquí NO se usa
-- "ON ALL TABLES" ni se incluye a `anon`. Los GRANT van tabla por tabla, a
-- propósito, para que un "ON ALL" futuro no le abra lectura pública a estas
-- tres sin que nadie lo note. El REVOKE final lo deja explícito.
-- ============================================================================

GRANT USAGE ON SCHEMA centro_mando TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON
    centro_mando.mailing_campanas,
    centro_mando.mailing_destinatarios,
    centro_mando.mailing_eventos
    TO authenticated;

GRANT SELECT ON centro_mando.mailing_meses TO authenticated;

GRANT USAGE, SELECT ON SEQUENCE centro_mando.mailing_eventos_id_seq TO authenticated;

GRANT ALL ON
    centro_mando.mailing_campanas,
    centro_mando.mailing_destinatarios,
    centro_mando.mailing_eventos
    TO service_role;

REVOKE ALL ON
    centro_mando.mailing_campanas,
    centro_mando.mailing_destinatarios,
    centro_mando.mailing_eventos
    FROM anon;

REVOKE ALL ON centro_mando.mailing_meses FROM anon;


-- ============================================================================
-- 7. VERIFICACIÓN
-- ----------------------------------------------------------------------------
-- Ejecutar después de correr el script. Debe devolver las 3 tablas con
-- rowsecurity = true y 2 políticas cada una.
-- ============================================================================

SELECT c.relname AS tabla,
       c.relrowsecurity AS rls,
       COUNT(p.polname) AS politicas
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_policy p ON p.polrelid = c.oid
WHERE n.nspname = 'centro_mando' AND c.relname LIKE 'mailing_%'
GROUP BY c.relname, c.relrowsecurity
ORDER BY c.relname;
