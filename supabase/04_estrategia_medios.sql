-- ============================================================================
-- ESTRATEGIA PUBLICITARIA: separa RRSS vs. Medios
-- ============================================================================
-- Añade una columna "category" a campaign_dash para poder tener más de una
-- campaña activa a la vez (una para RRSS, otra para Medios), cada una con su
-- propio set de canales/plan diario/métricas — las tablas hijas ya usan
-- campaign_id como FK, así que no hace falta duplicar ninguna tabla.
--
-- La campaña que ya existe hoy queda marcada como 'rrss' (vía el DEFAULT),
-- que es justo lo que se pidió: "la que está actual la puedes dejar como
-- rrss". La pestaña "Medios" arranca vacía (mismo estado que ya maneja la
-- UI cuando no hay campaña: EmptyCampaign → "Importa un plan de pauta").
--
-- Ejecuta esto UNA VEZ en el SQL Editor de Supabase.
-- ============================================================================

ALTER TABLE centro_mando.campaign_dash
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'rrss';

ALTER TABLE centro_mando.campaign_dash
  DROP CONSTRAINT IF EXISTS campaign_dash_category_check;

ALTER TABLE centro_mando.campaign_dash
  ADD CONSTRAINT campaign_dash_category_check CHECK (category IN ('rrss', 'medios'));
