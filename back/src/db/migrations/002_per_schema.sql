-- =============================================================================
-- 002_per_schema.sql
-- Módulo PER — Gestión de Periodistas
-- DircomNET · Empresas Polar · Dirección de Comunicaciones
-- =============================================================================
--
-- REGLAS CRÍTICAS DE NEGOCIO
--
--   - Un periodista nunca se elimina físicamente: se marca activo = false.
--     La inactivación no elimina su participación histórica en listas o giras.
--   - El historial de medios se conserva en per_periodista_medio_historial.
--     Al cambiar el medio principal se registra la salida con fecha_fin.
--   - Las listas cerradas no se pueden modificar sin permisos especiales (Fase 3).
--   - Cada participante en una lista tiene su propio estado dentro de
--     per_valor_participante; no existe un estado único por lista.
--   - Al agregar un participante a una lista debe especificarse el medio
--     con el que participa (puede diferir del medio principal del periodista).
--   - Todos los campos de métricas (tendencia, sentimiento_ep, influencia,
--     contacto, respuesta, compromiso, engagement) han sido excluidos del
--     módulo. Las métricas operativas se calculan en runtime desde las listas.
--   - Todas las FK de tablas de participación usan ON DELETE RESTRICT para
--     proteger la trazabilidad histórica. Las FK de hijos directos usan
--     ON DELETE CASCADE.
--   - RLS habilitado en todas las tablas — políticas permisivas hasta Fase 3.
--
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. per_medio
-- Catálogo de medios de comunicación (prensa, radio, TV, digital…).
-- ---------------------------------------------------------------------------
CREATE TABLE per_medio (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     text        NOT NULL,
  tipo_medio text        NOT NULL CHECK (tipo_medio IN ('prensa', 'radio', 'television', 'digital', 'agencia', 'otro')),
  activo     boolean     NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE per_medio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "per_medio_all" ON per_medio FOR ALL USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- 2. per_stakeholder
-- Catálogo de stakeholders que pueden estar asociados a un periodista.
-- ---------------------------------------------------------------------------
CREATE TABLE per_stakeholder (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE per_stakeholder ENABLE ROW LEVEL SECURITY;
CREATE POLICY "per_stakeholder_all" ON per_stakeholder FOR ALL USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- 3. per_fuente
-- Catálogo de fuentes periodísticas (ej. corresponsal, agencia, freelance).
-- ---------------------------------------------------------------------------
CREATE TABLE per_fuente (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE per_fuente ENABLE ROW LEVEL SECURITY;
CREATE POLICY "per_fuente_all" ON per_fuente FOR ALL USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- 4. per_tipo_pr
-- Catálogo de tipos de relación PR (ej. aliado estratégico, seguimiento).
-- ---------------------------------------------------------------------------
CREATE TABLE per_tipo_pr (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE per_tipo_pr ENABLE ROW LEVEL SECURITY;
CREATE POLICY "per_tipo_pr_all" ON per_tipo_pr FOR ALL USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- 5. per_periodista
-- Contacto principal. Nunca se elimina: activo = false lo inactiva.
-- Campos de métricas de scoring excluidos por diseño de este módulo.
-- ---------------------------------------------------------------------------
CREATE TABLE per_periodista (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     text        NOT NULL,
  cedula     text,
  direccion  text,
  nota       text,
  frecuencia text        CHECK (frecuencia IN ('nula', 'baja', 'media', 'alta')),
  activo     boolean     NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE per_periodista ENABLE ROW LEVEL SECURITY;
CREATE POLICY "per_periodista_all" ON per_periodista FOR ALL USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- 6. per_correo
-- Correos electrónicos del periodista. Uno puede marcarse como principal.
-- ---------------------------------------------------------------------------
CREATE TABLE per_correo (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  periodista_id  uuid        NOT NULL REFERENCES per_periodista (id) ON DELETE CASCADE,
  direccion      text        NOT NULL,
  es_principal   boolean     NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE per_correo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "per_correo_all" ON per_correo FOR ALL USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- 7. per_telefono
-- Teléfonos del periodista. Uno puede marcarse como principal.
-- ---------------------------------------------------------------------------
CREATE TABLE per_telefono (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  periodista_id  uuid        NOT NULL REFERENCES per_periodista (id) ON DELETE CASCADE,
  numero         text        NOT NULL,
  es_principal   boolean     NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE per_telefono ENABLE ROW LEVEL SECURITY;
CREATE POLICY "per_telefono_all" ON per_telefono FOR ALL USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- 8. per_red_social
-- Cuentas en redes sociales del periodista (plataforma + usuario).
-- ---------------------------------------------------------------------------
CREATE TABLE per_red_social (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  periodista_id  uuid        NOT NULL REFERENCES per_periodista (id) ON DELETE CASCADE,
  plataforma     text        NOT NULL,
  usuario        text        NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE per_red_social ENABLE ROW LEVEL SECURITY;
CREATE POLICY "per_red_social_all" ON per_red_social FOR ALL USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- 9. per_periodista_medio
-- PIVOTE: medios actuales del periodista. es_principal designa el medio
-- activo principal. Un periodista puede pertenecer a varios medios a la vez.
-- ---------------------------------------------------------------------------
CREATE TABLE per_periodista_medio (
  periodista_id  uuid    NOT NULL REFERENCES per_periodista (id) ON DELETE CASCADE,
  medio_id       uuid    NOT NULL REFERENCES per_medio (id) ON DELETE RESTRICT,
  es_principal   boolean NOT NULL DEFAULT false,
  PRIMARY KEY (periodista_id, medio_id)
);

ALTER TABLE per_periodista_medio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "per_periodista_medio_all" ON per_periodista_medio FOR ALL USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- 10. per_periodista_medio_historial
-- Historial de medios anteriores. Al cambiar de medio se registra la salida
-- con fecha_fin. Se conserva aunque el periodista sea inactivado.
-- ---------------------------------------------------------------------------
CREATE TABLE per_periodista_medio_historial (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  periodista_id  uuid        NOT NULL REFERENCES per_periodista (id) ON DELETE CASCADE,
  medio_id       uuid        NOT NULL REFERENCES per_medio (id) ON DELETE RESTRICT,
  fecha_inicio   date,
  fecha_fin      date,
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE per_periodista_medio_historial ENABLE ROW LEVEL SECURITY;
CREATE POLICY "per_periodista_medio_historial_all" ON per_periodista_medio_historial FOR ALL USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- 11. per_periodista_stakeholder
-- PIVOTE: relación N:M entre periodistas y stakeholders.
-- ---------------------------------------------------------------------------
CREATE TABLE per_periodista_stakeholder (
  periodista_id  uuid NOT NULL REFERENCES per_periodista (id) ON DELETE CASCADE,
  stakeholder_id uuid NOT NULL REFERENCES per_stakeholder (id) ON DELETE CASCADE,
  PRIMARY KEY (periodista_id, stakeholder_id)
);

ALTER TABLE per_periodista_stakeholder ENABLE ROW LEVEL SECURITY;
CREATE POLICY "per_periodista_stakeholder_all" ON per_periodista_stakeholder FOR ALL USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- 12. per_periodista_fuente
-- PIVOTE: relación N:M entre periodistas y fuentes periodísticas.
-- ---------------------------------------------------------------------------
CREATE TABLE per_periodista_fuente (
  periodista_id  uuid NOT NULL REFERENCES per_periodista (id) ON DELETE CASCADE,
  fuente_id      uuid NOT NULL REFERENCES per_fuente (id) ON DELETE CASCADE,
  PRIMARY KEY (periodista_id, fuente_id)
);

ALTER TABLE per_periodista_fuente ENABLE ROW LEVEL SECURITY;
CREATE POLICY "per_periodista_fuente_all" ON per_periodista_fuente FOR ALL USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- 13. per_periodista_tipo_pr
-- PIVOTE: relación N:M entre periodistas y tipos de PR.
-- ---------------------------------------------------------------------------
CREATE TABLE per_periodista_tipo_pr (
  periodista_id  uuid NOT NULL REFERENCES per_periodista (id) ON DELETE CASCADE,
  tipo_pr_id     uuid NOT NULL REFERENCES per_tipo_pr (id) ON DELETE CASCADE,
  PRIMARY KEY (periodista_id, tipo_pr_id)
);

ALTER TABLE per_periodista_tipo_pr ENABLE ROW LEVEL SECURITY;
CREATE POLICY "per_periodista_tipo_pr_all" ON per_periodista_tipo_pr FOR ALL USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- 14. per_plantilla_lista
-- Plantillas configurables que definen los campos obligatorios y opcionales
-- de una lista. El tipo_lista determina el flujo de estados de participantes.
-- ---------------------------------------------------------------------------
CREATE TABLE per_plantilla_lista (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      text        NOT NULL,
  tipo_lista  text        NOT NULL CHECK (tipo_lista IN ('convocatoria', 'gifting', 'gira', 'otra')),
  descripcion text,
  activo      boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE per_plantilla_lista ENABLE ROW LEVEL SECURITY;
CREATE POLICY "per_plantilla_lista_all" ON per_plantilla_lista FOR ALL USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- 15. per_campo_plantilla
-- Campos definidos en una plantilla. origen = 'persona' referencia un campo
-- existente del periodista; 'personalizado' define un campo nuevo con tipo.
-- ---------------------------------------------------------------------------
CREATE TABLE per_campo_plantilla (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  plantilla_id   uuid        NOT NULL REFERENCES per_plantilla_lista (id) ON DELETE CASCADE,
  nombre         text        NOT NULL,
  origen         text        NOT NULL CHECK (origen IN ('persona', 'personalizado')),
  campo_persona  text,
  tipo_campo     text        CHECK (tipo_campo IN ('texto', 'numero', 'fecha', 'booleano', 'select')),
  obligatorio    boolean     NOT NULL DEFAULT false,
  orden          integer     NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE per_campo_plantilla ENABLE ROW LEVEL SECURITY;
CREATE POLICY "per_campo_plantilla_all" ON per_campo_plantilla FOR ALL USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- 16. per_opcion_campo_plantilla
-- Opciones disponibles para campos de tipo 'select' en plantillas.
-- ---------------------------------------------------------------------------
CREATE TABLE per_opcion_campo_plantilla (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campo_id  uuid NOT NULL REFERENCES per_campo_plantilla (id) ON DELETE CASCADE,
  valor     text NOT NULL
);

ALTER TABLE per_opcion_campo_plantilla ENABLE ROW LEVEL SECURITY;
CREATE POLICY "per_opcion_campo_plantilla_all" ON per_opcion_campo_plantilla FOR ALL USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- 17. per_lista
-- Lista operativa creada a partir de una plantilla. Al crearla se copian
-- los campos de la plantilla a per_campo_lista. Las listas cerradas no
-- pueden modificarse sin permisos especiales.
-- ---------------------------------------------------------------------------
CREATE TABLE per_lista (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre       text        NOT NULL,
  plantilla_id uuid        NOT NULL REFERENCES per_plantilla_lista (id) ON DELETE RESTRICT,
  estado       text        NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'activa', 'cerrada', 'cancelada')),
  descripcion  text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE per_lista ENABLE ROW LEVEL SECURITY;
CREATE POLICY "per_lista_all" ON per_lista FOR ALL USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- 18. per_campo_lista
-- Copia de los campos de la plantilla al momento de crear la lista.
-- Desvinculado de la plantilla: cambios posteriores en la plantilla no
-- afectan a listas ya creadas.
-- ---------------------------------------------------------------------------
CREATE TABLE per_campo_lista (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  lista_id       uuid        NOT NULL REFERENCES per_lista (id) ON DELETE CASCADE,
  nombre         text        NOT NULL,
  origen         text        NOT NULL CHECK (origen IN ('persona', 'personalizado')),
  campo_persona  text,
  tipo_campo     text        CHECK (tipo_campo IN ('texto', 'numero', 'fecha', 'booleano', 'select')),
  obligatorio    boolean     NOT NULL DEFAULT false,
  orden          integer     NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE per_campo_lista ENABLE ROW LEVEL SECURITY;
CREATE POLICY "per_campo_lista_all" ON per_campo_lista FOR ALL USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- 19. per_opcion_campo_lista
-- Opciones disponibles para campos de tipo 'select' en listas instanciadas.
-- Copia independiente de per_opcion_campo_plantilla.
-- ---------------------------------------------------------------------------
CREATE TABLE per_opcion_campo_lista (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campo_lista_id  uuid NOT NULL REFERENCES per_campo_lista (id) ON DELETE CASCADE,
  valor           text NOT NULL
);

ALTER TABLE per_opcion_campo_lista ENABLE ROW LEVEL SECURITY;
CREATE POLICY "per_opcion_campo_lista_all" ON per_opcion_campo_lista FOR ALL USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- 20. per_participante_lista
-- PIVOTE: periodistas incluidos en una lista. medio_id es el medio con el
-- que participa en esta acción concreta (puede diferir del medio principal).
-- La combinación (lista_id, periodista_id) es única.
-- ---------------------------------------------------------------------------
CREATE TABLE per_participante_lista (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  lista_id       uuid        NOT NULL REFERENCES per_lista (id) ON DELETE CASCADE,
  periodista_id  uuid        NOT NULL REFERENCES per_periodista (id) ON DELETE RESTRICT,
  medio_id       uuid        REFERENCES per_medio (id) ON DELETE SET NULL,
  comentario     text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lista_id, periodista_id)
);

ALTER TABLE per_participante_lista ENABLE ROW LEVEL SECURITY;
CREATE POLICY "per_participante_lista_all" ON per_participante_lista FOR ALL USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- 21. per_valor_participante
-- Valores de los campos personalizados de la lista para cada participante.
-- La combinación (participante_id, campo_lista_id) es única.
-- Aquí se almacenan los estados operativos (ej. 'invitado', 'asistio').
-- ---------------------------------------------------------------------------
CREATE TABLE per_valor_participante (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  participante_id  uuid        NOT NULL REFERENCES per_participante_lista (id) ON DELETE CASCADE,
  campo_lista_id   uuid        NOT NULL REFERENCES per_campo_lista (id) ON DELETE CASCADE,
  valor            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (participante_id, campo_lista_id)
);

ALTER TABLE per_valor_participante ENABLE ROW LEVEL SECURITY;
CREATE POLICY "per_valor_participante_all" ON per_valor_participante FOR ALL USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- 22. per_gira
-- Propuesta de gira de medios asociada a una marca o campaña.
-- Sigue un ciclo de vida desde borrador hasta cerrada.
-- ---------------------------------------------------------------------------
CREATE TABLE per_gira (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      text        NOT NULL,
  marca       text,
  campana     text,
  estado      text        NOT NULL DEFAULT 'borrador'
              CHECK (estado IN ('borrador', 'enviada', 'aprobada', 'rechazada', 'en_planificacion', 'ejecutada', 'cerrada')),
  descripcion text,
  fecha_inicio date,
  fecha_fin    date,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE per_gira ENABLE ROW LEVEL SECURITY;
CREATE POLICY "per_gira_all" ON per_gira FOR ALL USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- 23. per_gira_contacto
-- PIVOTE: periodistas sugeridos para una gira con su justificación.
-- La combinación (gira_id, periodista_id) es única.
-- ON DELETE RESTRICT en periodista_id preserva la trazabilidad histórica.
-- ---------------------------------------------------------------------------
CREATE TABLE per_gira_contacto (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  gira_id        uuid        NOT NULL REFERENCES per_gira (id) ON DELETE CASCADE,
  periodista_id  uuid        NOT NULL REFERENCES per_periodista (id) ON DELETE RESTRICT,
  justificacion  text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (gira_id, periodista_id)
);

ALTER TABLE per_gira_contacto ENABLE ROW LEVEL SECURITY;
CREATE POLICY "per_gira_contacto_all" ON per_gira_contacto FOR ALL USING (true) WITH CHECK (true);


-- ---------------------------------------------------------------------------
-- Índices en foreign keys
-- Postgres no crea índices automáticos sobre FK; estos aceleran JOINs y
-- la resolución de restricciones de integridad referencial.
-- ---------------------------------------------------------------------------

-- Hijos directos de per_periodista
CREATE INDEX IF NOT EXISTS idx_per_correo_periodista_id              ON per_correo (periodista_id);
CREATE INDEX IF NOT EXISTS idx_per_telefono_periodista_id            ON per_telefono (periodista_id);
CREATE INDEX IF NOT EXISTS idx_per_red_social_periodista_id          ON per_red_social (periodista_id);
CREATE INDEX IF NOT EXISTS idx_per_periodista_medio_hist_periodista  ON per_periodista_medio_historial (periodista_id);
CREATE INDEX IF NOT EXISTS idx_per_periodista_medio_hist_medio       ON per_periodista_medio_historial (medio_id);

-- Pivotes de catálogos
CREATE INDEX IF NOT EXISTS idx_per_periodista_medio_medio_id         ON per_periodista_medio (medio_id);
CREATE INDEX IF NOT EXISTS idx_per_periodista_stkh_stakeholder_id    ON per_periodista_stakeholder (stakeholder_id);
CREATE INDEX IF NOT EXISTS idx_per_periodista_fuente_fuente_id       ON per_periodista_fuente (fuente_id);
CREATE INDEX IF NOT EXISTS idx_per_periodista_tipo_pr_tipo_pr_id     ON per_periodista_tipo_pr (tipo_pr_id);

-- Listas
CREATE INDEX IF NOT EXISTS idx_per_campo_plantilla_plantilla_id      ON per_campo_plantilla (plantilla_id);
CREATE INDEX IF NOT EXISTS idx_per_opcion_campo_plantilla_campo_id   ON per_opcion_campo_plantilla (campo_id);
CREATE INDEX IF NOT EXISTS idx_per_lista_plantilla_id                ON per_lista (plantilla_id);
CREATE INDEX IF NOT EXISTS idx_per_campo_lista_lista_id              ON per_campo_lista (lista_id);
CREATE INDEX IF NOT EXISTS idx_per_opcion_campo_lista_campo_lista_id ON per_opcion_campo_lista (campo_lista_id);
CREATE INDEX IF NOT EXISTS idx_per_participante_lista_lista_id       ON per_participante_lista (lista_id);
CREATE INDEX IF NOT EXISTS idx_per_participante_lista_periodista_id  ON per_participante_lista (periodista_id);
CREATE INDEX IF NOT EXISTS idx_per_participante_lista_medio_id       ON per_participante_lista (medio_id);
CREATE INDEX IF NOT EXISTS idx_per_valor_participante_participante   ON per_valor_participante (participante_id);
CREATE INDEX IF NOT EXISTS idx_per_valor_participante_campo          ON per_valor_participante (campo_lista_id);

-- Giras
CREATE INDEX IF NOT EXISTS idx_per_gira_contacto_gira_id             ON per_gira_contacto (gira_id);
CREATE INDEX IF NOT EXISTS idx_per_gira_contacto_periodista_id       ON per_gira_contacto (periodista_id);


-- =============================================================================
-- RESUMEN
-- =============================================================================
--
-- TABLAS (23)
--
--   CATÁLOGOS
--   per_medio                       Medios de comunicación (con tipo_medio y activo)
--   per_stakeholder                 Stakeholders asociables a periodistas
--   per_fuente                      Fuentes periodísticas (freelance, agencia…)
--   per_tipo_pr                     Tipos de relación PR del periodista
--
--   PERIODISTAS
--   per_periodista                  Contacto principal — nunca se elimina (activo)
--   per_correo                      Correos del periodista (1:N, con es_principal)
--   per_telefono                    Teléfonos del periodista (1:N, con es_principal)
--   per_red_social                  Cuentas en redes sociales (1:N)
--
--   RELACIONES PERIODISTA ↔ CATÁLOGOS
--   per_periodista_medio            PIVOTE medios actuales (N:M, con es_principal)
--   per_periodista_medio_historial  Historial de medios anteriores (con fechas)
--   per_periodista_stakeholder      PIVOTE periodista ↔ stakeholder (N:M)
--   per_periodista_fuente           PIVOTE periodista ↔ fuente (N:M)
--   per_periodista_tipo_pr          PIVOTE periodista ↔ tipo_pr (N:M)
--
--   LISTAS OPERATIVAS
--   per_plantilla_lista             Plantillas reutilizables con tipo y campos
--   per_campo_plantilla             Campos definidos en la plantilla
--   per_opcion_campo_plantilla      Opciones de campos select en plantillas
--   per_lista                       Lista instanciada desde una plantilla
--   per_campo_lista                 Copia de campos al crear la lista (inmutable)
--   per_opcion_campo_lista          Opciones de campos select en listas
--   per_participante_lista          PIVOTE periodista ↔ lista (con medio específico)
--   per_valor_participante          Valores de campos por participante (estados, etc.)
--
--   GIRAS DE MEDIOS
--   per_gira                        Propuesta de gira (ciclo de vida completo)
--   per_gira_contacto               PIVOTE periodista sugerido ↔ gira (con justificación)
--
-- =============================================================================
