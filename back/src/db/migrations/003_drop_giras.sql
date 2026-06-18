-- =============================================================================
-- 003_drop_giras.sql
-- Módulo PER — Eliminación de la funcionalidad de Giras de Medios
-- DircomNET · Empresas Polar · Dirección de Comunicaciones
-- =============================================================================
--
-- Elimina las tablas de giras y gira_contactos definidas originalmente en
-- 002_per_schema.sql (per_gira / per_gira_contacto). La funcionalidad nunca se
-- usó en producción y se removió del código de la aplicación.
--
-- Se borra primero la tabla pivote (per_gira_contacto) y luego la tabla padre
-- (per_gira). CASCADE garantiza el borrado aunque existan objetos dependientes
-- (índices, políticas RLS, FKs).
--
-- NOTA: el valor 'gira' del catálogo tipo_lista (per_plantilla_lista) NO se toca:
-- pertenece a la funcionalidad de Listas/Plantillas, no a esta entidad.
-- =============================================================================

DROP TABLE IF EXISTS per_gira_contacto CASCADE;
DROP TABLE IF EXISTS per_gira CASCADE;
