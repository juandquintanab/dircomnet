import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Select, EmptyDash, Chip } from '../../../components/primitives'
import { getContratos } from '../lib/infQueries'

const ESTATUS_OPTS = ['activo', 'vencido', 'por_vencer']

function calcularEstatus(fechaFin) {
  if (!fechaFin) return null
  const hoy = new Date().toISOString().split('T')[0]
  const en30 = new Date()
  en30.setDate(en30.getDate() + 30)
  const en30Str = en30.toISOString().split('T')[0]
  if (fechaFin < hoy) return { label: 'Vencido', tone: 'slate' }
  if (fechaFin <= en30Str) return { label: 'Por vencer', tone: 'yellow' }
  return { label: 'Activo', tone: 'green' }
}

function formatFecha(d) {
  if (!d) return null
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function formatMonto(n) {
  if (n == null) return null
  return Number(n).toLocaleString('es-VE', { minimumFractionDigits: 2 })
}

export default function ContratosList() {
  const navigate = useNavigate()
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filtroEstatus, setFiltroEstatus] = useState('')
  const [filtroInfluencer, setFiltroInfluencer] = useState('')

  useEffect(() => {
    setLoading(true)
    setError(null)
    getContratos()
      .then(setTodos)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const nombresInfluencer = useMemo(
    () => [...new Set(todos.map((c) => c.influencers?.nombre).filter(Boolean))].sort(),
    [todos],
  )

  const filtrados = useMemo(() => {
    return todos.filter((c) => {
      const est = calcularEstatus(c.fecha_fin)
      const matchEst = !filtroEstatus || (est && est.label.toLowerCase().replace(' ', '_') === filtroEstatus) ||
        (filtroEstatus === 'activo' && est?.label === 'Activo') ||
        (filtroEstatus === 'vencido' && est?.label === 'Vencido') ||
        (filtroEstatus === 'por_vencer' && est?.label === 'Por vencer')
      const matchInf = !filtroInfluencer || c.influencers?.nombre === filtroInfluencer
      return matchEst && matchInf
    })
  }, [todos, filtroEstatus, filtroInfluencer])

  return (
    <>
      <div className="pl-page__head">
        <div className="pl-page__title">
          <h1>Contratos</h1>
          <span className="meta"><b>INF</b> · Medios Pagos</span>
        </div>
        <div className="pl-page__actions">
          <Button variant="accent" icon="plus" onClick={() => navigate('/inf/contratos/nuevo')}>
            Nuevo contrato
          </Button>
        </div>
      </div>

      <div className="pl-card pl-table-wrap">
        <div className="inf-filterbar" style={{ gridTemplateColumns: '1fr 180px 200px' }}>
          <Select
            value={filtroInfluencer}
            onChange={setFiltroInfluencer}
            options={nombresInfluencer}
            placeholder="Influencer"
          />
          <Select
            value={filtroEstatus}
            onChange={setFiltroEstatus}
            options={ESTATUS_OPTS}
            placeholder="Estatus"
          />
        </div>

        {loading && <div className="inf-loading">Cargando contratos…</div>}
        {error && <div className="inf-error">Error al cargar los datos.</div>}

        {!loading && !error && (
          <>
            <div className="pl-table-meta">
              <span className="left">
                <b>{filtrados.length}</b>{' '}
                {filtrados.length === 1 ? 'contrato' : 'contratos'}
              </span>
            </div>
            <table className="pl-table">
              <thead>
                <tr>
                  <th>Influencer</th>
                  <th>Inicio</th>
                  <th>Fin</th>
                  <th>Monto total</th>
                  <th>Estatus</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="inf-empty">Sin resultados</div>
                    </td>
                  </tr>
                ) : (
                  filtrados.map((c) => {
                    const est = calcularEstatus(c.fecha_fin)
                    return (
                      <tr key={c.id} onClick={() => navigate(`/inf/contratos/${c.id}`)}>
                        <td className="name">{c.influencers?.nombre || <EmptyDash />}</td>
                        <td>{formatFecha(c.fecha_inicio) || <EmptyDash />}</td>
                        <td>{formatFecha(c.fecha_fin) || <EmptyDash />}</td>
                        <td>{formatMonto(c.monto_total) || <EmptyDash />}</td>
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
