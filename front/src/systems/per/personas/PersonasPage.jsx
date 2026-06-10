import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Input, Select, EmptyDash, Chip, Icon } from '../../../components/primitives'
import {
  getPersonas,
  getMedios,
  getStakeholders,
  getFuentes,
  getTiposPr,
} from '../lib/perQueries'

const FRECUENCIA_OPTS = ['alta', 'media', 'baja', 'ocasional']
const FRECUENCIA_TONE = { alta: 'green', media: 'blue', baja: 'yellow', ocasional: 'slate' }
const LIMIT = 50

export default function PersonasPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const q          = searchParams.get('q')          || ''
  const frecuencia = searchParams.get('frecuencia') || ''
  const medioFiltro      = searchParams.get('medios')       || ''
  const stakeholderFiltro = searchParams.get('stakeholders') || ''
  const fuenteFiltro     = searchParams.get('fuentes')      || ''
  const tipoPrFiltro     = searchParams.get('tipos_pr')     || ''
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))

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
    getPersonas({ buscar: q, frecuencia, page, limit: LIMIT })
      .then(({ data, total }) => { setData(data); setTotal(total) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [q, frecuencia, page])

  useEffect(() => { cargar() }, [cargar])

  // Client-side filter on medios (returned in list query)
  const filtrados = useMemo(() => {
    if (!medioFiltro) return data
    return data.filter((p) =>
      p.persona_medios?.some((pm) => pm.medios?.nombre === medioFiltro)
    )
  }, [data, medioFiltro])

  const setParam = (key, val) => {
    const params = new URLSearchParams(searchParams)
    if (val) params.set(key, val)
    else params.delete(key)
    params.delete('page')
    setSearchParams(params, { replace: true })
  }

  const removeFilter = (key) => {
    const params = new URLSearchParams(searchParams)
    params.delete(key)
    params.delete('page')
    setSearchParams(params, { replace: true })
  }

  const copiarCorreos = () => {
    const correos = filtrados
      .flatMap((p) => p.correos?.map((c) => c.direccion) ?? [])
      .filter(Boolean)
    if (!correos.length) return
    navigator.clipboard.writeText(correos.join('; '))
  }

  const totalPages = Math.ceil(total / LIMIT)

  const activeFilters = [
    ...(frecuencia    ? [{ key: 'frecuencia',   label: frecuencia }]      : []),
    ...(medioFiltro   ? [{ key: 'medios',        label: medioFiltro }]     : []),
    ...(stakeholderFiltro ? [{ key: 'stakeholders', label: stakeholderFiltro }] : []),
    ...(fuenteFiltro  ? [{ key: 'fuentes',       label: fuenteFiltro }]    : []),
    ...(tipoPrFiltro  ? [{ key: 'tipos_pr',      label: tipoPrFiltro }]    : []),
  ]

  const mediosNombres    = catalogos.medios.map((m) => m.nombre)
  const stakeholdersNom  = catalogos.stakeholders.map((s) => s.nombre)
  const fuentesNom       = catalogos.fuentes.map((f) => f.nombre)
  const tiposPrNom       = catalogos.tiposPr.map((t) => t.nombre)

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
            placeholder="Buscar por nombre…"
            leadingIcon="search"
          />
          <Select
            value={medioFiltro}
            onChange={(v) => setParam('medios', v)}
            options={mediosNombres}
            placeholder="Medio"
          />
          <Select
            value={stakeholderFiltro}
            onChange={(v) => setParam('stakeholders', v)}
            options={stakeholdersNom}
            placeholder="Stakeholder"
          />
          <Select
            value={fuenteFiltro}
            onChange={(v) => setParam('fuentes', v)}
            options={fuentesNom}
            placeholder="Fuente"
          />
          <Select
            value={tipoPrFiltro}
            onChange={(v) => setParam('tipos_pr', v)}
            options={tiposPrNom}
            placeholder="Tipo PR"
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
              <Chip key={f.key} tone="slate" removable onRemove={() => removeFilter(f.key)}>
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
                <b>{medioFiltro ? filtrados.length : total}</b>{' '}
                {(medioFiltro ? filtrados.length : total) === 1 ? 'periodista' : 'periodistas'}
                {totalPages > 1 && !medioFiltro && (
                  <span style={{ color: 'var(--slate-400)', marginLeft: 'var(--space-2)' }}>
                    · Página {page} de {totalPages}
                  </span>
                )}
              </span>
              {totalPages > 1 && !medioFiltro && (
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
                  <th className="per-col-fuentes">Fuentes</th>
                  <th>Correos</th>
                  <th className="per-col-telefonos">Teléfonos</th>
                  <th>Frecuencia</th>
                  <th className="per-col-tendencia">Tendencia</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="per-empty">Sin resultados</div>
                    </td>
                  </tr>
                ) : (
                  filtrados.map((p) => (
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
                        <div className="per-contact-chips">
                          {p.persona_medios?.length
                            ? p.persona_medios.slice(0, 2).map((pm) => (
                                <Chip key={pm.medios?.id} tone="blue">
                                  {pm.medios?.nombre}
                                </Chip>
                              ))
                            : <EmptyDash />}
                          {p.persona_medios?.length > 2 && (
                            <Chip tone="slate">+{p.persona_medios.length - 2}</Chip>
                          )}
                        </div>
                      </td>
                      <td className="per-col-fuentes"><EmptyDash /></td>
                      <td>
                        {p.correos?.length
                          ? p.correos[0].direccion
                          : <EmptyDash />}
                        {p.correos?.length > 1 && (
                          <span style={{ color: 'var(--slate-400)', fontSize: 'var(--fs-body-xs)', marginLeft: 4 }}>
                            +{p.correos.length - 1}
                          </span>
                        )}
                      </td>
                      <td className="per-col-telefonos"><EmptyDash /></td>
                      <td>
                        {p.frecuencia
                          ? <Chip tone={FRECUENCIA_TONE[p.frecuencia] ?? 'slate'}>{p.frecuencia}</Chip>
                          : <EmptyDash />}
                      </td>
                      <td className="per-col-tendencia">
                        {p.tendencia ?? <EmptyDash />}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </>
        )}
      </div>
    </>
  )
}
