-- ============================================================
-- 004_inf_rls_policies.sql
-- Módulo INF (Influencers) — Políticas RLS para el rol anon
--
-- PROBLEMA: las tablas relacionadas del módulo de influencers tienen
-- RLS habilitado pero SIN política de SELECT para el rol `anon` (el que
-- usa el frontend con la VITE_SUPABASE_ANON_KEY). Resultado: las consultas
-- devuelven [] SIN error, y la UI muestra todo vacío aunque la BD tiene datos.
-- Verificado: con service key `redes_sociales_influencer`=776, `influencer_marcas_ep`=1744,
-- etc.; con anon key todas devuelven 0.
--
-- Las tablas `influencers`, `marcas` y `campanas` ya tienen política anon
-- (por eso sí cargan) y NO se incluyen aquí.
--
-- NOTA DE SEGURIDAD (Fase 1/2 — RLS permisivo):
--   Estas políticas son permisivas (using true) para que el front-direct
--   con anon key funcione, igual que el resto del módulo INF. En la Fase 3
--   (Supabase Auth) deben endurecerse a políticas basadas en auth.uid()/rol.
--
-- BLOQUE A (SELECT): obligatorio para que la información se MUESTRE.
-- BLOQUE B (write):  obligatorio solo para que el FORMULARIO pueda GUARDAR
--                    redes/teléfonos/correos/temáticas/categorías/marcas
--                    desde el front. Si por ahora no quieres permitir escritura
--                    desde anon, comenta el BLOQUE B y deja solo SELECT.
-- ============================================================

do $$
declare
  t text;
  tbls text[] := array[
    'redes_sociales_influencer',
    'tipos_influencer',
    'telefonos_influencer',
    'correos_influencer',
    'influencer_tematicas',
    'tematicas',
    'influencer_categorias',
    'categorias_influencer',
    'influencer_marcas_ep',
    'influencer_marcas_comerciales',
    'marcas_comerciales',
    'influencer_marcas_competencia',
    'marcas_competencia',
    -- aún vacías, pero se incluyen para evitar el mismo bloqueo al cargarlas:
    'contratos',
    'entregables',
    'pagos',
    'campanas_influencers'
  ];
begin
  foreach t in array tbls loop
    execute format('alter table public.%I enable row level security', t);

    -- ── BLOQUE A — Lectura (SELECT) ──
    execute format('drop policy if exists inf_anon_select on public.%I', t);
    execute format(
      'create policy inf_anon_select on public.%I for select to anon, authenticated using (true)',
      t
    );

    -- ── BLOQUE B — Escritura (INSERT/UPDATE/DELETE) ──
    -- Comenta estas dos líneas si solo quieres habilitar lectura por ahora.
    execute format('drop policy if exists inf_anon_write on public.%I', t);
    execute format(
      'create policy inf_anon_write on public.%I for all to anon, authenticated using (true) with check (true)',
      t
    );
  end loop;
end $$;
