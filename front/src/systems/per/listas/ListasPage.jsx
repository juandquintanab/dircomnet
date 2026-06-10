import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Select, EmptyDash, Chip } from '../../../components/primitives'
import { getListas } from '../lib/perQueries'

const TIPOS_LISTA = ['convocatoria', 'gifting', 'gira', 'otra']
const ESTADOS_LISTA = ['borrador', 'activa', 'cerrada', 'cancelada']

const TIPO_TONE  = { convocatoria: 'blue', gifting: 'green', gira: 'yellow', otra: 'slate' }
const ESTADO_TONE = { borrador: 'slate', activa: 'green', cerrada: 'blue', cancelada: 'red' }

const LIMIT = 50

function formatFecha(d) {
  if (!d) return null
  const dt = new Date(d)
  return dt.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function ListasPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const tipo   = searchParams.get('tipo')   || ''
  const estado = searchParams.get('estado') || ''
  const page   = Math.max(1, parseInt(searchParams.get('page') || '1', 10))

  const [data, setData]     = useState([])
  const [total, setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

  const cargar = useCallback(() => {
    setLoading(true)
    setError(null)
    getListas({ tipo, estado, page, limit: LIMIT })
      .then(({ data, total }) => { setData(data); setTotal(total) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [tipo, estado, page])

  useEffect(() => { cargar() }, [cargar])

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

  const totalPages = Math.ceil(total / LIMIT)

  const activeFilters = [
    ...(tipo   ? [{ key: 'tipo',   label: tipo }]   : []),
    ...(estado ? [{ key: 'estado', label: estado }] : []),
  ]

  return (
    <>
      <div className="pl-page__head">
        <div className="pl-page__title">
          <h1>Listas</h1>
          <span className="meta"><b>PER</b> · Difusión y PR</span>
        </div>
        <div className="pl-page__actions">
          <Button variant="accent" icon="plus" onClick={() => navigate('/per/listas/nueva')}>
            Nueva lista
          </Button>
        </div>
      </div>

      <div className="pl-card pl-table-wrap">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px 180px', gap: 'var(--space-4)', padding: 'var(--space-5) var(--space-6) var(--space-6)' }}>
          <div />
          <Select
            value={tipo}
            onChange={(v) => setParam('tipo', v)}
            options={TIPOS_LISTA}
            placeholder="Tipo"
          />
          <Select
            value={estado}
            onChange={(v) => setParam('estado', v)}
            options={ESTADOS_LISTA}
            placeholder="Estado"
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

        {loading && <div className="per-loading">Cargando listas…</div>}
        {error   && <div className="per-error">Error al cargar los datos.</div>}

        {!loading && !error && (
          <>
            <div className="pl-table-meta">
              <span className="left">
                <b>{total}</b> {total === 1 ? 'lista' : 'listas'}
                {totalPages > 1 && (
                  <span style={{ color: 'var(--slate-400)', marginLeft: 'var(--space-2)' }}>
                    · Página {page} de {totalPages}
                  </span>
                )}
              </span>
              {totalPages > 1 && (
                <div className="pl-row">
                  <Button variant="secondary" size="s" disabled={page <= 1} onClick={() => setParam('page', String(page - 1))}>Anterior</Button>
                  <Button variant="secondary" size="s" disabled={page >= totalPages} onClick={() => setParam('page', String(page + 1))}>Siguiente</Button>
                </div>
              )}
            </div>
            <table className="pl-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'center' }}>Participantes</th>
                  <th>Creada</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr><td colSpan={5}><div className="per-empty">Sin listas registradas</div></td></tr>
                ) : (
                  data.map((l) => (
                    <tr key={l.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/per/listas/${l.id}`)}>
                      <td className="name">{l.nombre}</td>
                      <td>
                        {l.plantillas_lista?.tipo_lista
                          ? <Chip tone={TIPO_TONE[l.plantillas_lista.tipo_lista] ?? 'slate'}>{l.plantillas_lista.tipo_lista}</Chip>
                          : <EmptyDash />}
                      </td>
                      <td>
                        {l.estado
                          ? <Chip tone={ESTADO_TONE[l.estado] ?? 'slate'}>{l.estado}</Chip>
                          : <EmptyDash />}
                      </td>
                      <td style={{ textAlign: 'center' }}>{l.participantes_lista?.length ?? 0}</td>
                      <td>{formatFecha(l.created_at) ?? <EmptyDash />}</td>
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
