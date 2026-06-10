import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, EmptyDash, Chip, Icon } from '../../../components/primitives'
import {
  getInfluencerById,
  getInfluencerContratos,
  getInfluencerCampanas,
} from '../lib/infQueries'

const TIPO_TONE = { nano: 'slate', micro: 'blue', macro: 'yellow', celebrity: 'green' }

function formatFecha(d) {
  if (!d) return null
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function formatSeguidores(n) {
  if (n == null) return null
  return n.toLocaleString('es-VE')
}

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

function Field({ label, children }) {
  return (
    <div className="inf-field">
      <span className="label-field">{label}</span>
      <span className="inf-field__val">{children ?? <EmptyDash />}</span>
    </div>
  )
}

export default function InfluencerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [influencer, setInfluencer] = useState(null)
  const [contratos, setContratos] = useState([])
  const [campanas, setCampanas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      getInfluencerById(id),
      getInfluencerContratos(id),
      getInfluencerCampanas(id),
    ])
      .then(([inf, c, camp]) => {
        setInfluencer(inf)
        setContratos(c)
        setCampanas(camp)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="inf-loading">Cargando…</div>
  if (error) return <div className="inf-error">Error al cargar los datos.</div>
  if (!influencer) return null

  const inf = influencer

  return (
    <div className="inf-page-stack">
      {/* ── Encabezado ── */}
      <div className="pl-page__head">
        <div className="pl-page__title">
          <h1>{inf.nombre}</h1>
          <span className="meta">
            <b>INF</b> · Medios Pagos
          </span>
        </div>
        <div className="pl-page__actions">
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Volver
          </Button>
          <Button variant="accent" icon="edit" onClick={() => navigate(`/inf/influencers/${id}/editar`)}>
            Editar
          </Button>
        </div>
      </div>

      {/* ── Datos generales ── */}
      <div className="pl-card" style={{ padding: 'var(--space-6)' }}>
        <div className="pl-section__head">
          <div className="pl-section__title">
            <Icon name="user" size={14} />
            <span className="label-section">Datos generales</span>
          </div>
        </div>
        <div className="pl-section__body">
          <Field label="Tipo">
            {inf.tipo ? (
              <Chip tone={TIPO_TONE[inf.tipo] ?? 'slate'}>{inf.tipo}</Chip>
            ) : null}
          </Field>
          <Field label="Categoría">{inf.categoria}</Field>
          <Field label="Ciudad">{inf.ciudad}</Field>
          <Field label="Seguidores">
            {inf.seguidores != null ? formatSeguidores(inf.seguidores) : null}
          </Field>
          <Field label="Teléfono">{inf.telefono}</Field>
          <Field label="Correo">{inf.correo}</Field>
        </div>
      </div>

      {/* ── Redes sociales ── */}
      <div className="pl-card" style={{ padding: 'var(--space-6)' }}>
        <div className="pl-section__head">
          <div className="pl-section__title">
            <Icon name="sparkles" size={14} />
            <span className="label-section">Redes sociales</span>
          </div>
        </div>
        <div className="pl-section__body">
          <Field label="Instagram">
            {inf.usuario_instagram ? `@${inf.usuario_instagram}` : null}
          </Field>
          <Field label="TikTok">
            {inf.usuario_tiktok ? `@${inf.usuario_tiktok}` : null}
          </Field>
          <Field label="YouTube">
            {inf.usuario_youtube ? `@${inf.usuario_youtube}` : null}
          </Field>
        </div>
      </div>

      {/* ── Contratos ── */}
      <div className="pl-card pl-table-wrap">
        <div className="inf-table-head">
          <div className="pl-section__title">
            <Icon name="file" size={14} />
            <span className="label-section">Contratos</span>
          </div>
        </div>
        {contratos.length === 0 ? (
          <div className="inf-empty">Sin contratos registrados</div>
        ) : (
          <table className="pl-table">
            <thead>
              <tr>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Monto total</th>
                <th>Estatus</th>
              </tr>
            </thead>
            <tbody>
              {contratos.map((c) => {
                const est = calcularEstatus(c.fecha_fin)
                return (
                  <tr key={c.id}>
                    <td>{formatFecha(c.fecha_inicio)}</td>
                    <td>{formatFecha(c.fecha_fin)}</td>
                    <td>{Number(c.monto_total).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
                    <td>
                      {est ? <Chip tone={est.tone}>{est.label}</Chip> : <EmptyDash />}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Campañas ── */}
      <div className="pl-card pl-table-wrap">
        <div className="inf-table-head">
          <div className="pl-section__title">
            <Icon name="bar" size={14} />
            <span className="label-section">Campañas</span>
          </div>
        </div>
        {campanas.length === 0 ? (
          <div className="inf-empty">Sin campañas registradas</div>
        ) : (
          <table className="pl-table">
            <thead>
              <tr>
                <th>Campaña</th>
                <th>Marca</th>
                <th>Inicio</th>
                <th>Fin</th>
              </tr>
            </thead>
            <tbody>
              {campanas.map((camp) => (
                <tr key={camp.id}>
                  <td className="name">{camp.nombre}</td>
                  <td>{camp.marcas?.nombre || <EmptyDash />}</td>
                  <td>{formatFecha(camp.fecha_inicio)}</td>
                  <td>{formatFecha(camp.fecha_fin)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
