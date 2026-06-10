import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, EmptyDash, Chip, Icon } from '../../../components/primitives'
import {
  getCampanaById,
  getInfluencers,
  addInfluencerACampana,
  removeInfluencerDeCampana,
} from '../lib/infQueries'

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

function Field({ label, children }) {
  return (
    <div className="inf-field">
      <span className="label-field">{label}</span>
      <span className="inf-field__val">{children ?? <EmptyDash />}</span>
    </div>
  )
}

export default function CampanaDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [campana, setCampana] = useState(null)
  const [todosInfluencers, setTodosInfluencers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [infSeleccionado, setInfSeleccionado] = useState('')
  const [agregando, setAgregando] = useState(false)

  const cargar = useCallback(() => {
    setLoading(true)
    setError(null)
    Promise.all([getCampanaById(id), getInfluencers()])
      .then(([c, infs]) => {
        setCampana(c)
        setTodosInfluencers(infs)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { cargar() }, [cargar])

  const participantesIds = useMemo(
    () => new Set((campana?.campanas_influencers || []).map((ci) => ci.influencer_id)),
    [campana],
  )

  const disponibles = useMemo(
    () => todosInfluencers.filter((inf) => !participantesIds.has(inf.id)),
    [todosInfluencers, participantesIds],
  )

  const agregar = async () => {
    if (!infSeleccionado) return
    setAgregando(true)
    try {
      await addInfluencerACampana(id, infSeleccionado)
      setInfSeleccionado('')
      cargar()
    } catch (e) {
      alert(e.message)
    } finally {
      setAgregando(false)
    }
  }

  const quitar = async (infId) => {
    if (!window.confirm('¿Quitar este influencer de la campaña?')) return
    await removeInfluencerDeCampana(id, infId)
    cargar()
  }

  if (loading) return <div className="inf-loading">Cargando…</div>
  if (error) return <div className="inf-error">Error al cargar los datos.</div>
  if (!campana) return null

  const c = campana
  const est = calcularEstatus(c.fecha_fin)
  const participantes = (c.campanas_influencers || []).map((ci) => ci.influencers).filter(Boolean)

  return (
    <div className="inf-page-stack">
      {/* ── Encabezado ── */}
      <div className="pl-page__head">
        <div className="pl-page__title">
          <h1>{c.nombre}</h1>
          <span className="meta"><b>INF</b> · Medios Pagos</span>
        </div>
        <div className="pl-page__actions">
          <Button variant="secondary" onClick={() => navigate(-1)}>Volver</Button>
          <Button variant="accent" icon="edit" onClick={() => navigate(`/inf/campanas/${id}/editar`)}>
            Editar
          </Button>
        </div>
      </div>

      {/* ── Datos generales ── */}
      <div className="pl-card" style={{ padding: 'var(--space-6)' }}>
        <div className="pl-section__head">
          <div className="pl-section__title">
            <Icon name="file" size={14} />
            <span className="label-section">Datos generales</span>
          </div>
          {est && <Chip tone={est.tone}>{est.label}</Chip>}
        </div>
        <div className="pl-section__body">
          <Field label="Marca">{c.marcas?.nombre}</Field>
          <Field label="Fecha inicio">{formatFecha(c.fecha_inicio)}</Field>
          <Field label="Fecha fin">{formatFecha(c.fecha_fin)}</Field>
          <Field label="Influencers">{participantes.length}</Field>
        </div>
      </div>

      {/* ── Influencers participantes ── */}
      <div className="pl-card pl-table-wrap">
        <div className="inf-table-head">
          <div className="pl-section__title">
            <Icon name="person" size={14} />
            <span className="label-section">Influencers participantes</span>
          </div>
        </div>

        {participantes.length === 0 ? (
          <div className="inf-empty">Sin influencers en esta campaña</div>
        ) : (
          <table className="pl-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Categoría</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {participantes.map((inf) => (
                <tr key={inf.id}>
                  <td
                    className="name"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/inf/influencers/${inf.id}`)}
                  >
                    {inf.nombre}
                  </td>
                  <td>{inf.tipo || <EmptyDash />}</td>
                  <td>{inf.categoria || <EmptyDash />}</td>
                  <td>
                    <div className="inf-row-actions">
                      <Button variant="ghost" size="s" icon="trash" onClick={() => quitar(inf.id)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* ── Agregar influencer ── */}
        {disponibles.length > 0 && (
          <div className="inf-add-participant">
            <select
              className="inf-select-native"
              value={infSeleccionado}
              onChange={(e) => setInfSeleccionado(e.target.value)}
            >
              <option value="">Agregar influencer…</option>
              {disponibles.map((inf) => (
                <option key={inf.id} value={inf.id}>{inf.nombre}</option>
              ))}
            </select>
            <Button
              variant="secondary"
              size="s"
              disabled={!infSeleccionado || agregando}
              onClick={agregar}
            >
              {agregando ? 'Agregando…' : 'Agregar'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
