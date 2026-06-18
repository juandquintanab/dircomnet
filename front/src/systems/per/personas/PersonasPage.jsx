import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Input, Select, EmptyDash, Chip } from '../../../components/primitives'
import MultiSelectDropdown from './MultiSelectDropdown'
import {
  getPersonas,
  getMedios,
  getStakeholders,
  getFuentes,
  getTiposPr,
} from '../lib/perQueries'

// Filtros multivalor en la URL: coma-separados (?medios=1,2). String ↔ arreglo.
const toArr = (s) => (s ? s.split(',') : [])

const FRECUENCIA_OPTS = ['alta', 'media', 'baja', 'ocasional']
const LIMIT = 50

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
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

  const [catalogos, setCatalogos] = useState({
    medios: [], stakeholders: [], fuentes: [], tiposPr: [],
  })

  useEffect(() => {
    Promise.all([getMedios(), getStakeholders(), getFuentes(), getTiposPr()])
      .then(([medios, stakeholders, fuentes, tiposPr]) =>
        setCatalogos({ medios, stakeholders, fuentes, tiposPr })
      )
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

  const copiarCorreos = () => {
    const correos = data
      .flatMap((p) => p.correos?.map((c) => c.direccion) ?? [])
      .filter(Boolean)
    if (!correos.length) return
    navigator.clipboard.writeText(correos.join('; '))
  }

  const totalPages = Math.ceil(total / LIMIT)

  // Mapa id → nombre por catálogo, para etiquetar los chips de filtros activos.
  const nombrePorId = (items) => Object.fromEntries(items.map((i) => [String(i.id), i.nombre]))
  const mapaMedios       = nombrePorId(catalogos.medios)
  const mapaFuentes      = nombrePorId(catalogos.fuentes)
  const mapaStakeholders = nombrePorId(catalogos.stakeholders)
  const mapaTiposPr      = nombrePorId(catalogos.tiposPr)

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
          <Button variant="secondary" icon="external" onClick={copiarCorreos}>
            Copiar correos
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
            placeholder="Buscar por nombre, medio o fuente…"
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
            <div className="pl-table-meta">
              <span className="left">
                <b>{total}</b>{' '}
                {total === 1 ? 'periodista' : 'periodistas'}
                {totalPages > 1 && (
                  <span style={{ color: 'var(--slate-400)', marginLeft: 'var(--space-2)' }}>
                    · Página {page} de {totalPages}
                  </span>
                )}
              </span>
              {totalPages > 1 && (
                <div className="pl-row">
                  <Button
                    variant="secondary"
                    size="s"
                    disabled={page <= 1}
                    onClick={() => setParam('page', String(page - 1))}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="secondary"
                    size="s"
                    disabled={page >= totalPages}
                    onClick={() => setParam('page', String(page + 1))}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </div>

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
                          {!p.activo && (
                            <Chip tone="slate" style={{ marginLeft: 'var(--space-2)' }}>
                              Inactivo
                            </Chip>
                          )}
                        </td>
                        <td>
                          {p.persona_medios?.length ? (
                            <div className="per-contact-chips">
                              {p.persona_medios.map((pm) => (
                                <Chip key={pm.medios?.id} tone="blue">{pm.medios?.nombre}</Chip>
                              ))}
                            </div>
                          ) : <EmptyDash />}
                        </td>
                        <td>
                          {p.persona_fuentes?.length ? (
                            <div className="per-contact-chips">
                              {p.persona_fuentes.map((pf) => (
                                <Chip key={pf.fuentes?.id} tone="slate">{pf.fuentes?.nombre}</Chip>
                              ))}
                            </div>
                          ) : <EmptyDash />}
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
          </>
        )}
      </div>
    </>
  )
}
