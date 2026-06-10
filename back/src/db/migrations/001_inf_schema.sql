-- =============================================================================
-- 001_inf_schema.sql
-- Módulo INF — Administrador de Influencers
-- DircomNET · Empresas Polar · Dirección de Comunicaciones
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensión
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS influencers (
    id                   uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre               text        NOT NULL,
    usuario_instagram    text,
    usuario_tiktok       text,
    usuario_youtube      text,
    telefono             text,
    correo               text,
    ciudad               text,
    seguidores           integer,
    categoria            text,
    tipo                 text        CHECK (tipo IN ('nano', 'micro', 'macro', 'celebrity')),
    created_at           timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marcas (
    id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre      text        NOT NULL,
    created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contratos (
    id                       uuid         PRIMARY KEY DEFAULT uuid_generate_v4(),
    influencer_id            uuid         NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
    fecha_inicio             date         NOT NULL,
    fecha_fin                date         NOT NULL,
    monto_total              numeric(12,2) NOT NULL,
    monto_mensual            numeric(12,2),
    frecuencia_publicaciones text,
    notas                    text,
    documento_url            text,
    created_at               timestamptz  DEFAULT now()
);

CREATE TABLE IF NOT EXISTS entregables (
    id                uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
    contrato_id       uuid        NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
    tipo              text        NOT NULL CHECK (tipo IN ('reel', 'historia', 'post')),
    fecha_publicacion date,
    estatus           text        DEFAULT 'pendiente' CHECK (estatus IN ('pendiente', 'entregado')),
    link_publicacion  text,
    created_at        timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pagos (
    id               uuid         PRIMARY KEY DEFAULT uuid_generate_v4(),
    contrato_id      uuid         NOT NULL REFERENCES contratos(id) ON DELETE CASCADE,
    fecha_pago       date         NOT NULL,
    monto            numeric(12,2) NOT NULL,
    periodo_cubierto text,
    notas            text,
    created_at       timestamptz  DEFAULT now()
);

CREATE TABLE IF NOT EXISTS campanas (
    id           uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre       text        NOT NULL,
    marca_id     uuid        NOT NULL REFERENCES marcas(id) ON DELETE RESTRICT,
    fecha_inicio date        NOT NULL,
    fecha_fin    date        NOT NULL,
    created_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS campanas_influencers (
    campana_id    uuid NOT NULL REFERENCES campanas(id)    ON DELETE CASCADE,
    influencer_id uuid NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
    contrato_id   uuid          REFERENCES contratos(id)   ON DELETE SET NULL,
    PRIMARY KEY (campana_id, influencer_id)
);


-- ---------------------------------------------------------------------------
-- Índices en foreign keys
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_contratos_influencer_id       ON contratos(influencer_id);
CREATE INDEX IF NOT EXISTS idx_entregables_contrato_id       ON entregables(contrato_id);
CREATE INDEX IF NOT EXISTS idx_pagos_contrato_id             ON pagos(contrato_id);
CREATE INDEX IF NOT EXISTS idx_campanas_marca_id             ON campanas(marca_id);
CREATE INDEX IF NOT EXISTS idx_campanas_inf_campana_id       ON campanas_influencers(campana_id);
CREATE INDEX IF NOT EXISTS idx_campanas_inf_influencer_id    ON campanas_influencers(influencer_id);
CREATE INDEX IF NOT EXISTS idx_campanas_inf_contrato_id      ON campanas_influencers(contrato_id);


-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE influencers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE marcas               ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE entregables          ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos                ENABLE ROW LEVEL SECURITY;
ALTER TABLE campanas             ENABLE ROW LEVEL SECURITY;
ALTER TABLE campanas_influencers ENABLE ROW LEVEL SECURITY;


-- ---------------------------------------------------------------------------
-- Políticas RLS — permisivas (se refinan en Fase 3 con Supabase Auth)
-- ---------------------------------------------------------------------------

-- influencers
CREATE POLICY "anon_select_influencers"  ON influencers FOR SELECT USING (true);
CREATE POLICY "anon_insert_influencers"  ON influencers FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_influencers"  ON influencers FOR UPDATE USING (true);
CREATE POLICY "anon_delete_influencers"  ON influencers FOR DELETE USING (true);

-- marcas
CREATE POLICY "anon_select_marcas"       ON marcas FOR SELECT USING (true);
CREATE POLICY "anon_insert_marcas"       ON marcas FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_marcas"       ON marcas FOR UPDATE USING (true);
CREATE POLICY "anon_delete_marcas"       ON marcas FOR DELETE USING (true);

-- contratos
CREATE POLICY "anon_select_contratos"    ON contratos FOR SELECT USING (true);
CREATE POLICY "anon_insert_contratos"    ON contratos FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_contratos"    ON contratos FOR UPDATE USING (true);
CREATE POLICY "anon_delete_contratos"    ON contratos FOR DELETE USING (true);

-- entregables
CREATE POLICY "anon_select_entregables"  ON entregables FOR SELECT USING (true);
CREATE POLICY "anon_insert_entregables"  ON entregables FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_entregables"  ON entregables FOR UPDATE USING (true);
CREATE POLICY "anon_delete_entregables"  ON entregables FOR DELETE USING (true);

-- pagos
CREATE POLICY "anon_select_pagos"        ON pagos FOR SELECT USING (true);
CREATE POLICY "anon_insert_pagos"        ON pagos FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_pagos"        ON pagos FOR UPDATE USING (true);
CREATE POLICY "anon_delete_pagos"        ON pagos FOR DELETE USING (true);

-- campanas
CREATE POLICY "anon_select_campanas"     ON campanas FOR SELECT USING (true);
CREATE POLICY "anon_insert_campanas"     ON campanas FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_campanas"     ON campanas FOR UPDATE USING (true);
CREATE POLICY "anon_delete_campanas"     ON campanas FOR DELETE USING (true);

-- campanas_influencers
CREATE POLICY "anon_select_ci"           ON campanas_influencers FOR SELECT USING (true);
CREATE POLICY "anon_insert_ci"           ON campanas_influencers FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_ci"           ON campanas_influencers FOR UPDATE USING (true);
CREATE POLICY "anon_delete_ci"           ON campanas_influencers FOR DELETE USING (true);
