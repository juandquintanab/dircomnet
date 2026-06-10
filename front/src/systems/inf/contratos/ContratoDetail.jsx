import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, EmptyDash, Chip, Icon } from '../../../components/primitives'
import { getContratoById, deleteEntregable, deletePago } from '../lib/infQueries'

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

const ESTATUS_ENT_TONE = { pendiente: 'yellow', entregado: 'green' }

function Field({ label, children }) {
  return (
    <div className="inf-field">
      <span className="label-field">{label}</span>
      <span className="inf-field__val">{children ?? <EmptyDash />}</span>
    </div>
  )
}

export default function ContratoDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [contrato, setContrato] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const cargar = useCallback(() => {
    setLoading(true)
    setError(null)
    getContratoById(id)
      .then(setContrato)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { cargar() }, [cargar])

  const eliminarEntregable = async (eid) => {
    if (!window.confirm('¿Eliminar este entregable?')) return
    await deleteEntregable(eid)
    cargar()
  }

  const eliminarPago = async (pid) => {
    if (!window.confirm('¿Eliminar este pago?')) return
    await deletePago(pid)
    cargar()
  }

  if (loading) return <div className="inf-loading">Cargando…</div>
  if (error) return <div className="inf-error">Error al cargar los datos.</div>
  if (!contrato) return null

  const c = contrato
  const est = calcularEstatus(c.fecha_fin)
  const totalPagado = (c.pagos || []).reduce((s, p) => s + Number(p.monto), 0)
  const saldo = Number(c.monto_total) - totalPagado

  return (
    <div className="inf-page-stack">
      {/* ── Encabezado ── */}
      <div className="pl-page__head">
        <div className="pl-page__title">
          <h1>{c.influencers?.nombre || 'Contrato'}</h1>
          <span className="meta"><b>INF</b> · Medios Pagos</span>
        </div>
        <div className="pl-page__actions">
          <Button variant="secondary" onClick={() => navigate(-1)}>Volver</Button>
          <Button variant="accent" icon="edit" onClick={() => navigate(`/inf/contratos/${id}/editar`)}>
            Editar
          </Button>
        </div>
      </div>

      {/* ── Datos del contrato ── */}
      <div className="pl-card" style={{ padding: 'var(--space-6)' }}>
        <div className="pl-section__head">
          <div className="pl-section__title">
            <Icon name="file" size={14} />
            <span className="label-section">Datos del contrato</span>
          </div>
          {est && <Chip tone={est.tone}>{est.label}</Chip>}
        </div>
        <div className="pl-section__body">
          <Field label="Influencer">{c.influencers?.nombre}</Field>
          <Field label="Fecha inicio">{formatFecha(c.fecha_inicio)}</Field>
          <Field label="Fecha fin">{formatFecha(c.fecha_fin)}</Field>
          <Field label="Monto total">{formatMonto(c.monto_total)}</Field>
          <Field label="Monto mensual">{formatMonto(c.monto_mensual)}</Field>
          <Field label="Frecuencia">{c.frecuencia_publicaciones}</Field>
        </div>
      </div>

      {/* ── Resumen financiero ── */}
      <div className="pl-card" style={{ padding: 'var(--space-6)' }}>
        <div className="pl-section__head">
          <div className="pl-section__title">
            <Icon name="bar" size={14} />
            <span className="label-section">Resumen financiero</span>
          </div>
        </div>
        <div className="pl-kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="pl-kpi pl-card">
            <span className="lbl">Monto total</span>
            <span className="val" style={{ fontSize: 'var(--fs-h6)' }}>{formatMonto(c.monto_total)}</span>
          </div>
          <div className="pl-kpi pl-card">
            <span className="lbl">Total pagado</span>
            <span className="val" style={{ fontSize: 'var(--fs-h6)', color: 'var(--status-success)' }}>
              {formatMonto(totalPagado)}
            </span>
          </div>
          <div className="pl-kpi pl-card">
            <span className="lbl">Saldo pendiente</span>
            <span className="val" style={{ fontSize: 'var(--fs-h6)', color: saldo > 0 ? 'var(--status-warning)' : 'var(--status-success)' }}>
              {formatMonto(saldo)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Entregables ── */}
      <div className="pl-card pl-table-wrap">
        <div className="inf-table-head">
          <div className="pl-section__title">
            <Icon name="check" size={14} />
            <span className="label-section">Entregables</span>
          </div>
          <Button variant="accent" size="s" icon="plus"
            onClick={() => navigate(`/inf/contratos/${id}/entregables/nuevo`)}>
            Agregar
          </Button>
        </div>
        {(c.entregables || []).length === 0 ? (
          <div className="inf-empty">Sin entregables registrados</div>
        ) : (
          <table className="pl-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Fecha publicación</th>
                <th>Estatus</th>
                <th>Link</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {c.entregables.map((e) => (
                <tr key={e.id}>
                  <td>{e.tipo || <EmptyDash />}</td>
                  <td>{formatFecha(e.fecha_publicacion) || <EmptyDash />}</td>
                  <td>
                    {e.estatus ? (
                      <Chip tone={ESTATUS_ENT_TONE[e.estatus] ?? 'slate'}>{e.estatus}</Chip>
                    ) : <EmptyDash />}
                  </td>
                  <td>
                    {e.link_publicacion
                      ? <a href={e.link_publicacion} target="_blank" rel="noreferrer" style={{ color: 'var(--blue-500)' }}>Ver</a>
                      : <EmptyDash />}
                  </td>
                  <td>
                    <div className="inf-row-actions">
                      <Button variant="ghost" size="s" icon="edit"
                        onClick={() => navigate(`/inf/contratos/${id}/entregables/${e.id}/editar`)} />
                      <Button variant="ghost" size="s" icon="trash"
                        onClick={() => eliminarEntregable(e.id)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagos ── */}
      <div className="pl-card pl-table-wrap">
        <div className="inf-table-head">
          <div className="pl-section__title">
            <Icon name="bar" size={14} />
            <span className="label-section">Pagos</span>
          </div>
          <Button variant="accent" size="s" icon="plus"
            onClick={() => navigate(`/inf/contratos/${id}/pagos/nuevo`)}>
            Registrar
          </Button>
        </div>
        {(c.pagos || []).length === 0 ? (
          <div className="inf-empty">Sin pagos registrados</div>
        ) : (
          <table className="pl-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Monto</th>
                <th>Período cubierto</th>
                <th>Notas</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {c.pagos.map((p) => (
                <tr key={p.id}>
                  <td>{formatFecha(p.fecha_pago) || <EmptyDash />}</td>
                  <td>{formatMonto(p.monto) || <EmptyDash />}</td>
                  <td>{p.periodo_cubierto || <EmptyDash />}</td>
                  <td>{p.notas || <EmptyDash />}</td>
                  <td>
                    <div className="inf-row-actions">
                      <Button variant="ghost" size="s" icon="edit"
                        onClick={() => navigate(`/inf/contratos/${id}/pagos/${p.id}/editar`)} />
                      <Button variant="ghost" size="s" icon="trash"
                        onClick={() => eliminarPago(p.id)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Notas ── */}
      {c.notas && (
        <div className="pl-card" style={{ padding: 'var(--space-6)' }}>
          <div className="pl-section__head">
            <div className="pl-section__title">
              <Icon name="file" size={14} />
              <span className="label-section">Notas</span>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 'var(--fs-body-s)', color: 'var(--fg-2)', lineHeight: 1.6 }}>
            {c.notas}
          </p>
        </div>
      )}
    </div>
  )
}
