import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Select, EmptyDash, Chip } from '../../../components/primitives'
import { getCampanas } from '../lib/infQueries'

function calcularEstatus(fechaFin) {
  if (!fechaFin) return null
  const hoy = new Date().toISOString().split('T')[0]
  const en30 = new Date()
  en30.setDate(en30.getDate() + 30)
  const en30Str = en30.toISOString().split('T')[0]
  if (fechaFin < hoy) return { label: 'Vencida', tone: 'slate' }
  if (fechaFin <= en30Str) return { label: 'Por vencer', tone: 'yellow' }
  return { label: 'Activa', tone: 'green' }
}

function formatFecha(d) {
  if (!d) return null
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

const ESTATUS_OPTS = ['activa', 'vencida', 'por_vencer']

export default function CampanasList() {
  const navigate = useNavigate()
  const [todas, setTodas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filtroEstatus, setFiltroEstatus] = useState('')
  const [filtroMarca, setFiltroMarca] = useState('')

  useEffect(() => {
    setLoading(true)
    setError(null)
    getCampanas()
      .then(setTodas)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const marcas = useMemo(
    () => [...new Set(todas.map((c) => c.marcas?.nombre).filter(Boolean))].sort(),
    [todas],
  )

  const filtradas = useMemo(() => {
    return todas.filter((c) => {
      const est = calcularEstatus(c.fecha_fin)
      const matchEst = !filtroEstatus || est?.label.toLowerCase().replace(' ', '_') === filtroEstatus
      const matchMarca = !filtroMarca || c.marcas?.nombre === filtroMarca
      return matchEst && matchMarca
    })
  }, [todas, filtroEstatus, filtroMarca])

  return (
    <>
      <div className="pl-page__head">
        <div className="pl-page__title">
          <h1>Campañas</h1>
          <span className="meta"><b>INF</b> · Medios Pagos</span>
        </div>
        <div className="pl-page__actions">
          <Button variant="accent" icon="plus" onClick={() => navigate('/inf/campanas/nueva')}>
            Nueva campaña
          </Button>
        </div>
      </div>

      <div className="pl-card pl-table-wrap">
        <div className="inf-filterbar" style={{ gridTemplateColumns: '1fr 180px 180px' }}>
          <Select
            value={filtroMarca}
            onChange={setFiltroMarca}
            options={marcas}
            placeholder="Marca"
          />
          <Select
            value={filtroEstatus}
            onChange={setFiltroEstatus}
            options={ESTATUS_OPTS}
            placeholder="Estatus"
          />
        </div>

        {loading && <div className="inf-loading">Cargando campañas…</div>}
        {error && <div className="inf-error">Error al cargar los datos.</div>}

        {!loading && !error && (
          <>
            <div className="pl-table-meta">
              <span className="left">
                <b>{filtradas.length}</b>{' '}
                {filtradas.length === 1 ? 'campaña' : 'campañas'}
              </span>
            </div>
            <table className="pl-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Marca</th>
                  <th>Inicio</th>
                  <th>Fin</th>
                  <th>Influencers</th>
                  <th>Estatus</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="inf-empty">Sin resultados</div>
                    </td>
                  </tr>
                ) : (
                  filtradas.map((c) => {
                    const est = calcularEstatus(c.fecha_fin)
                    const numInf = (c.campanas_influencers || []).length
                    return (
                      <tr key={c.id} onClick={() => navigate(`/inf/campanas/${c.id}`)}>
                        <td className="name">{c.nombre}</td>
                        <td>{c.marcas?.nombre || <EmptyDash />}</td>
                        <td>{formatFecha(c.fecha_inicio) || <EmptyDash />}</td>
                        <td>{formatFecha(c.fecha_fin) || <EmptyDash />}</td>
                        <td>{numInf}</td>
                        <td>
                          {est ? <Chip tone={est.tone}>{est.label}</Chip> : <EmptyDash />}
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
