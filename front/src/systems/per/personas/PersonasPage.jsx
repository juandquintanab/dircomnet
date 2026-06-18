import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Input, Select, EmptyDash, Chip } from '../../../components/primitives'
import MultiSelectDropdown from './MultiSelectDropdown'
import {
  getPersonas,
  getCorreosFiltrados,
  getMedios,
  getStakeholders,
  getFuentes,
  getTiposPr,
} from '../lib/perQueries'

// Filtros multivalor en la URL: coma-separados (?medios=1,2). String ↔ arreglo.
const toArr = (s) => (s ? s.split(',') : [])

// Valores reales almacenados en personas.frecuencia (incluye 'Nula' como valor literal).
const FRECUENCIA_OPTS = ['Baja', 'Media', 'Alta', 'Nula']
const LIMIT = 50

// Lista de chips truncada: muestra hasta `max` y, si hay más, un "+N" con el resto
// en un tooltip nativo (title). Mantiene las celdas compactas sin romper el layout.
function ChipsTruncados({ items, tone, max = 2 }) {
  if (!items?.length) return <EmptyDash />
  const visibles = items.slice(0, max)
  const resto    = items.slice(max)
  return (
    <div className="per-contact-chips">
      {visibles.map((it) => (
        <Chip key={it.id} tone={tone}>{it.nombre}</Chip>
      ))}
      {resto.length > 0 && (
        <span className="per-chip-more" title={resto.map((r) => r.nombre).join(', ')}>
          +{resto.length}
        </span>
      )}
    </div>
  )
}

// Lista de páginas a mostrar con elipsis: siempre 1 y la última, ±1 alrededor de
// la actual, y '…' en los huecos. Hasta 7 páginas se listan todas sin elipsis.
function pageItems(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const items = [1]
  const start = Math.max(2, current - 1)
  const end   = Math.min(total - 1, current + 1)
  if (start > 2) items.push('…')
  for (let p = start; p <= end; p++) items.push(p)
  if (end < total - 1) items.push('…')
  items.push(total)
  return items
}

// Control de paginación reutilizable: contador + rango + botones Anterior/Siguiente
// y números de página navegables. Se renderiza arriba y abajo de la tabla.
function Paginacion({
  visible, total, totalGeneral, hayFiltros, page, totalPages, rangeStart, rangeEnd, onPage,
}) {
  return (
    <div className="pl-table-meta">
      <span className="left">
        Viendo <b>{visible}</b> de <b>{total}</b>{' '}
        {total === 1 ? 'periodista' : 'periodistas'}
        {hayFiltros && totalGeneral !== null && (
          <span style={{ color: 'var(--slate-400)' }}>
            {' '}filtrados de {totalGeneral} en total
          </span>
        )}
        {total > 0 && (
          <span style={{ color: 'var(--slate-400)', marginLeft: 'var(--space-2)' }}>
            · Página {page} de {totalPages} · del {rangeStart} al {rangeEnd}
          </span>
        )}
      </span>
      {totalPages > 1 && (
        <div className="per-pagination">
          <Button variant="secondary" size="s" disabled={page <= 1} onClick={() => onPage(page - 1)}>
            Anterior
          </Button>
          <div className="per-pagination__nums">
            {pageItems(page, totalPages).map((it, i) =>
              it === '…' ? (
                <span key={`e${i}`} className="per-page-ellipsis">…</span>
              ) : (
                <button
                  key={it}
                  type="button"
                  className={`per-page-num${it === page ? ' is-active' : ''}`}
                  aria-current={it === page ? 'page' : undefined}
                  onClick={() => onPage(it)}
                >
                  {it}
                </button>
              )
            )}
          </div>
          <Button variant="secondary" size="s" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
            Siguiente
          </Button>
        </div>
      )}
    </div>
  )
}

export default function PersonasPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const q          = searchParams.get('q')          || ''
  const frecuencia = searchParams.get('frecuencia') || ''
  // Params crudos (string) — se usan como deps por valor; se parsean a arreglo al usar.
  const mediosParam       = searchParams.get('medios')       || ''
  const fuentesParam      = searchParams.get('fuentes')      || ''
  const stakeholdersParam = searchParams.get('stakeholders') || ''
  const tiposPrParam      = searchParams.get('tipos_pr')     || ''
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))

  const mediosSel       = toArr(mediosParam)
  const fuentesSel      = toArr(fuentesParam)
  const stakeholdersSel = toArr(stakeholdersParam)
  const tiposPrSel      = toArr(tiposPrParam)

  const [data, setData]     = useState([])
  const [total, setTotal]   = useState(0)
  // Total del universo completo (sin filtros) — para "X de Y filtrados de Z total".
  const [totalGeneral, setTotalGeneral] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

  const [catalogos, setCatalogos] = useState({
    medios: [], stakeholders: [], fuentes: [], tiposPr: [],
  })

  // Feedback efímero del botón "Copiar correos" (toast).
  const [copiando, setCopiando] = useState(false)
  const [toast, setToast]       = useState(null)

  useEffect(() => {
    Promise.all([getMedios(), getStakeholders(), getFuentes(), getTiposPr()])
      .then(([medios, stakeholders, fuentes, tiposPr]) =>
        setCatalogos({ medios, stakeholders, fuentes, tiposPr })
      )
      .catch(() => {})
  }, [])

  // Total del universo completo (sin ningún filtro) — se consulta una sola vez.
  useEffect(() => {
    getPersonas({ page: 1, limit: 1 })
      .then(({ total }) => setTotalGeneral(total))
      .catch(() => {})
  }, [])

  const cargar = useCallback(() => {
    setLoading(true)
    setError(null)
    getPersonas({
      buscar: q,
      frecuencia,
      medio:       toArr(mediosParam),
      fuente:      toArr(fuentesParam),
      stakeholder: toArr(stakeholdersParam),
      tipo_pr:     toArr(tiposPrParam),
      page,
      limit: LIMIT,
    })
      .then(({ data, total }) => { setData(data); setTotal(total) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
    // Deps por valor (strings de la URL), no por referencia de arreglo → sin refetch infinito.
  }, [q, frecuencia, mediosParam, fuentesParam, stakeholdersParam, tiposPrParam, page])

  useEffect(() => { cargar() }, [cargar])

  // Filtro single (q, frecuencia): set/borra un valor escalar.
  const setParam = (key, val) => {
    const params = new URLSearchParams(searchParams)
    if (val) params.set(key, val)
    else params.delete(key)
    params.delete('page')
    setSearchParams(params, { replace: true })
  }

  // Filtro multivalor: persiste el arreglo como coma-separado (o borra el param).
  const setFilterArray = (key, arr) => {
    const params = new URLSearchParams(searchParams)
    if (arr.length) params.set(key, arr.join(','))
    else params.delete(key)
    params.delete('page')
    setSearchParams(params, { replace: true })
  }

  // Quita un único valor de un filtro multivalor (chip removible).
  const removeFilterValue = (key, val) => {
    setFilterArray(key, toArr(searchParams.get(key) || '').filter((x) => x !== val))
  }

  // Cambio de página: a diferencia de setParam (filtros), NO borra 'page' —
  // sólo lo escribe (o lo quita en la página 1) para no perder filtros activos.
  const setPage = (n) => {
    const params = new URLSearchParams(searchParams)
    if (n > 1) params.set('page', String(n))
    else params.delete('page')
    setSearchParams(params, { replace: true })
  }

  // Muestra un toast que se descarta solo tras unos segundos.
  const mostrarToast = (mensaje, tono = 'ok') => {
    setToast({ mensaje, tono })
    setTimeout(() => setToast(null), 3000)
  }

  // Copia los correos de TODO el universo filtrado (no solo la página visible),
  // únicos y sin vacíos, separados por '; '. Da feedback vía toast.
  const copiarCorreos = async () => {
    if (copiando) return
    setCopiando(true)
    try {
      const correos = await getCorreosFiltrados({
        buscar:      q,
        frecuencia,
        medio:       toArr(mediosParam),
        fuente:      toArr(fuentesParam),
        stakeholder: toArr(stakeholdersParam),
        tipo_pr:     toArr(tiposPrParam),
      })
      if (!correos.length) {
        mostrarToast('No hay correos para copiar', 'error')
        return
      }
      await navigator.clipboard.writeText(correos.join('; '))
      mostrarToast(`${correos.length} ${correos.length === 1 ? 'correo copiado' : 'correos copiados'}`)
    } catch {
      mostrarToast('No se pudieron copiar los correos', 'error')
    } finally {
      setCopiando(false)
    }
  }

  const totalPages = Math.ceil(total / LIMIT)

  // Rango de la página actual sobre el universo filtrado (no el total absoluto).
  // rangeStart/End se basan en el offset de la página y en los registros realmente
  // devueltos (la última página puede traer menos de LIMIT).
  const rangeStart = total === 0 ? 0 : (page - 1) * LIMIT + 1
  const rangeEnd   = (page - 1) * LIMIT + data.length

  // Mapa id → nombre por catálogo, para etiquetar los chips de filtros activos.
  const nombrePorId = (items) => Object.fromEntries(items.map((i) => [String(i.id), i.nombre]))
  const mapaMedios       = nombrePorId(catalogos.medios)
  const mapaFuentes      = nombrePorId(catalogos.fuentes)
  const mapaStakeholders = nombrePorId(catalogos.stakeholders)
  const mapaTiposPr      = nombrePorId(catalogos.tiposPr)

  // ¿Hay algún filtro/búsqueda activo? (para mostrar "filtrados de Z total")
  const hayFiltros = Boolean(
    q || frecuencia ||
    mediosSel.length || fuentesSel.length || stakeholdersSel.length || tiposPrSel.length
  )

  const activeFilters = [
    ...(frecuencia ? [{ id: 'frecuencia', label: frecuencia, onRemove: () => setParam('frecuencia', '') }] : []),
    ...mediosSel.map((v)       => ({ id: `medios:${v}`,       label: mapaMedios[v] ?? v,       onRemove: () => removeFilterValue('medios', v) })),
    ...fuentesSel.map((v)      => ({ id: `fuentes:${v}`,      label: mapaFuentes[v] ?? v,      onRemove: () => removeFilterValue('fuentes', v) })),
    ...stakeholdersSel.map((v) => ({ id: `stakeholders:${v}`, label: mapaStakeholders[v] ?? v, onRemove: () => removeFilterValue('stakeholders', v) })),
    ...tiposPrSel.map((v)      => ({ id: `tipos_pr:${v}`,     label: mapaTiposPr[v] ?? v,      onRemove: () => removeFilterValue('tipos_pr', v) })),
  ]

  return (
    <>
      <div className="pl-page__head">
        <div className="pl-page__title">
          <h1>Periodistas</h1>
          <span className="meta"><b>PER</b> · Difusión y PR</span>
        </div>
        <div className="pl-page__actions">
          <Button variant="secondary" icon="external" onClick={copiarCorreos} disabled={copiando}>
            {copiando ? 'Copiando…' : 'Copiar correos'}
          </Button>
          <Button variant="accent" icon="plus" onClick={() => navigate('/per/personas/nuevo')}>
            Nuevo periodista
          </Button>
        </div>
      </div>

      <div className="pl-card pl-table-wrap">
        <div className="per-filterbar">
          <Input
            value={q}
            onChange={(v) => setParam('q', v)}
            placeholder="Buscar por nombre…"
            leadingIcon="search"
          />
          <MultiSelectDropdown
            label="Medio"
            options={catalogos.medios}
            selected={mediosSel}
            onChange={(arr) => setFilterArray('medios', arr)}
          />
          <MultiSelectDropdown
            label="Stakeholder"
            options={catalogos.stakeholders}
            selected={stakeholdersSel}
            onChange={(arr) => setFilterArray('stakeholders', arr)}
          />
          <MultiSelectDropdown
            label="Fuente"
            options={catalogos.fuentes}
            selected={fuentesSel}
            onChange={(arr) => setFilterArray('fuentes', arr)}
          />
          <MultiSelectDropdown
            label="Tipo PR"
            options={catalogos.tiposPr}
            selected={tiposPrSel}
            onChange={(arr) => setFilterArray('tipos_pr', arr)}
          />
          <Select
            value={frecuencia}
            onChange={(v) => setParam('frecuencia', v)}
            options={FRECUENCIA_OPTS}
            placeholder="Frecuencia"
          />
        </div>

        {activeFilters.length > 0 && (
          <div className="pl-active-filters">
            <span className="lbl">Filtros</span>
            {activeFilters.map((f) => (
              <Chip key={f.id} tone="slate" removable onRemove={f.onRemove}>
                {f.label}
              </Chip>
            ))}
          </div>
        )}

        {loading && <div className="per-loading">Cargando periodistas…</div>}
        {error   && <div className="per-error">Error al cargar los datos.</div>}

        {!loading && !error && (
          <>
            <Paginacion
              visible={data.length}
              total={total}
              totalGeneral={totalGeneral}
              hayFiltros={hayFiltros}
              page={page}
              totalPages={totalPages}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              onPage={setPage}
            />

            <table className="pl-table">
              <thead>
                <tr>
                  <th className="per-col-nombre">Nombre</th>
                  <th>Medios</th>
                  <th>Fuentes</th>
                  <th>Correos</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      <div className="per-empty">Sin resultados</div>
                    </td>
                  </tr>
                ) : (
                  data.map((p) => {
                    // Opción A: la celda muestra solo el correo principal (o el primero);
                    // todos los correos siguen en la respuesta (para "Copiar correos" y el detalle).
                    const correoPrincipal = p.correos?.find((c) => c.es_principal) ?? p.correos?.[0]
                    return (
                      <tr
                        key={p.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/per/personas/${p.id}`)}
                      >
                        <td className="name per-col-nombre">
                          {p.nombre}
                        </td>
                        <td>
                          <ChipsTruncados
                            tone="blue"
                            items={(p.persona_medios ?? []).map((pm) => pm.medios).filter(Boolean)}
                          />
                        </td>
                        <td>
                          <ChipsTruncados
                            tone="slate"
                            items={(p.persona_fuentes ?? []).map((pf) => pf.fuentes).filter(Boolean)}
                          />
                        </td>
                        <td>
                          {correoPrincipal ? correoPrincipal.direccion : <EmptyDash />}
                          {p.correos?.length > 1 && (
                            <span style={{ color: 'var(--slate-400)', fontSize: 'var(--fs-body-xs)', marginLeft: 4 }}>
                              +{p.correos.length - 1}
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>

            <Paginacion
              visible={data.length}
              total={total}
              totalGeneral={totalGeneral}
              hayFiltros={hayFiltros}
              page={page}
              totalPages={totalPages}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              onPage={setPage}
            />
          </>
        )}
      </div>

      {toast && (
        <div className={`per-toast per-toast--${toast.tono}`} role="status">
          {toast.mensaje}
        </div>
      )}
    </>
  )
}
