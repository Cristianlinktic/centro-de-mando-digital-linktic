-- ============================================================================
-- 09. MAILING INTERNO — `enlaces` pasa a admitir NULL
-- ----------------------------------------------------------------------------
-- Instancia: https://klecvgchqqbkasedxtxj.supabase.co
-- Schema destino: centro_mando
-- Idempotente. Corregir antes de la primera carga de datos.
--
-- POR QUÉ
-- En 08_mailing_interno.sql la columna quedó como BOOLEAN NOT NULL DEFAULT true,
-- dando por hecho que "lleva enlaces" es un sí o un no. No lo es: son TRES
-- estados, y así lo trata el script que produce los datos.
--
--   true   hubo clics, así que seguro llevaba enlaces
--   false  marcada a mano en marcas.json como correo sin enlaces
--   NULL   no se sabe
--
-- El tercer caso no es raro: es el MAYORITARIO. De las 77 campañas medidas,
-- 41 caen ahí. La razón es que la columna "url" del export de SendGrid solo
-- aparece en eventos de clic, así que con cero clics no hay forma de distinguir
-- "no tenía botón", "tenía pero nadie lo pulsó" y "el seguimiento de clics
-- estaba apagado".
--
-- Forzar esos 41 a `true` los presentaría como campañas con enlaces y 0% de
-- CTR, es decir como fracasos — exactamente el error que esta columna existe
-- para evitar. Forzarlos a `false` afirmaría algo que nadie comprobó.
--
-- Sin este cambio la carga falla en la primera campaña con:
--   23502: null value in column "enlaces" of relation "mailing_campanas"
--          violates not-null constraint
--
-- QUÉ IMPLICA DEL LADO DE LA APLICACIÓN
-- `enlaces` deja de ser un booleano y pasa a ser un booleano que puede faltar.
-- Al reescribir src/lib/mailing-prueba/data.ts hay que tratar NULL como
-- "desconocido" y dejar esas campañas FUERA del promedio de CTR, no contarlas
-- como 0%. Es lo que ya hace el tablero estático.
-- ============================================================================

ALTER TABLE centro_mando.mailing_campanas
    ALTER COLUMN enlaces DROP NOT NULL;

ALTER TABLE centro_mando.mailing_campanas
    ALTER COLUMN enlaces DROP DEFAULT;


-- ============================================================================
-- VERIFICACIÓN — debe devolver is_nullable = YES y column_default vacío.
-- ============================================================================

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'centro_mando'
  AND table_name = 'mailing_campanas'
  AND column_name = 'enlaces';
