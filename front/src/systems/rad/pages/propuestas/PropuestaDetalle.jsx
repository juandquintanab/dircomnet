import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '../../../../components/primitives'
import PropuestaEstado from '../../components/propuesta/PropuestaEstado'
import PropuestaProductoFila from '../../components/propuesta/PropuestaProductoFila'
import PropuestaTotales from '../../components/propuesta/PropuestaTotales'
import { propuestaService } from '../../services/propuestaService'
import { calcProductoMetricas } from '../../utils/metricas'
import { downloadCSV } from '../../utils/csv'
import './propuestas.css'

const TRANSICIONES_LABEL = {
  borrador: [{ value: 'enviada', label: 'Marcar como enviada' }],
  enviada: [
    { value: 'aprobada', label: 'Marcar como aprobada' },
    { value: 'rechazada', label: 'Marcar como rechazada' },
  ],
  aprobada: [],
  rechazada: [],
}

export default function PropuestaDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [propuesta, setPropuesta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cambiandoEstado, setCambiandoEstado] = useState(false)
  const [exportando, setExportando] = useState(false)

  const cargar = () => {
    setLoading(true)
    propuestaService.getById(id).then(({ data, error: err }) => {
      if (err) setError(err.message)
      else setPropuesta(data)
      setLoading(false)
    })
  }

  useEffect(() => { cargar() }, [id])

  if (loading) {
    return <p className="body-m" style={{ padding: 'var(--space-8)', color: 'var(--fg-3)' }}>Cargando…</p>
  }
  if (error || !propuesta) {
    return <p className="pl-field__hint is-error" style={{ padding: 'var(--space-4)' }}>{error ?? 'Propuesta no encontrada'}</p>
  }

  const productos = (propuesta.rad_propuesta_detalle ?? [])
    .map((d) => d.rad_producto)
    .filter(Boolean)

  const totalCalc = productos.reduce((acc, p) => {
    const { precioTotal, precioMercado } = calcProductoMetricas(p)
    return { total: acc.total + precioTotal, totalMercado: acc.totalMercado + precioMercado }
  }, { total: 0, totalMercado: 0 })
  const ahorroTotal = totalCalc.totalMercado - totalCalc.total

  const transiciones = TRANSICIONES_LABEL[propuesta.estado] ?? []

  async function handleCambiarEstado(nuevoEstado) {
    setCambiandoEstado(true)
    const { data, error: err } = await propuestaService.cambiarEstado(id, nuevoEstado)
    if (err) {
      window.alert(err.message)
    } else {
      setPropuesta((prev) => ({ ...prev, estado: data.estado }))
    }
    setCambiandoEstado(false)
  }

  async function handleExportarCSV() {
    setExportando(true)
    const { data } = await propuestaService.exportarCSV(id)
    if (data) {
      const fecha = new Date().toISOString().slice(0, 10)
      const nombre = propuesta.nombre.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]/g, '')
      downloadCSV(data, `propuesta_${nombre}_${fecha}.csv`)
    }
    setExportando(false)
  }

  return (
    <>
      <div className="pl-page__head">
        <div className="pl-page__title">
          <h1>{propuesta.nombre}</h1>
          <div className="pl-row" style={{ marginTop: 'var(--space-2)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <PropuestaEstado estado={propuesta.estado} />

            {transiciones.length > 0 && (
              <div className="rad-estado-select">
                <select
                  onChange={(e) => e.target.value && handleCambiarEstado(e.target.value)}
                  value=""
                  disabled={cambiandoEstado}
                >
                  <option value="">Cambiar estado…</option>
                  {transiciones.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
        <div className="pl-row">
          <Button variant="secondary" size="m" onClick={() => navigate('/rad/propuestas')}>
            Volver
          </Button>
          <Button
            variant="secondary"
            size="m"
            icon="file"
            onClick={handleExportarCSV}
            disabled={exportando || !productos.length}
          >
            {exportando ? 'Exportando…' : 'Exportar CSV'}
          </Button>
        </div>
      </div>

      <div className="pl-card" style={{ padding: 'var(--space-6)' }}>
        {productos.length === 0 ? (
          <p className="body-m" style={{ color: 'var(--fg-3)' }}>Esta propuesta no tiene productos.</p>
        ) : (
          <>
            <div className="pl-table-wrap">
              <table className="pl-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Tipo</th>
                    <th>Emisora</th>
                    <th>Locutores</th>
                    <th className="rad-col-num">Precio</th>
                    <th className="rad-col-num">Desc.</th>
                    <th className="rad-col-num">Mercado</th>
                    <th className="rad-col-num">Ahorro</th>
                    <th className="rad-col-num">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((p) => (
                    <PropuestaProductoFila key={p.id} producto={p} />
                  ))}
                </tbody>
              </table>
            </div>

            <PropuestaTotales
              total={totalCalc.total}
              totalMercado={totalCalc.totalMercado}
              ahorroTotal={ahorroTotal}
            />
          </>
        )}
      </div>
    </>
  )
}
