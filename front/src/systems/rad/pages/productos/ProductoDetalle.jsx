import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, EmptyDash } from '../../../../components/primitives'
import RadBadge from '../../components/shared/RadBadge'
import ProductoMetricas from '../../components/producto/ProductoMetricas'
import { productoService } from '../../services/productoService'
import { usePropuestaActiva } from '../../hooks/usePropuestaActiva'
import './productos.css'

function Campo({ label, children }) {
  return (
    <div>
      <span className="label-field">{label}</span>
      <p className="body-m" style={{ marginTop: 'var(--space-1)', color: 'var(--fg-2)' }}>
        {children ?? <EmptyDash />}
      </p>
    </div>
  )
}

export default function ProductoDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { agregarProducto, productosSeleccionados, setListaAbierta } = usePropuestaActiva()
  const [producto, setProducto] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    productoService.getById(id).then(({ data, error: err }) => {
      if (err) setError(err.message)
      else setProducto(data)
      setLoading(false)
    })
  }, [id])

  if (loading) {
    return <p className="body-m" style={{ padding: 'var(--space-8)', color: 'var(--fg-3)' }}>Cargando…</p>
  }

  if (error || !producto) {
    return <p className="pl-field__hint is-error" style={{ padding: 'var(--space-4)' }}>{error ?? 'Producto no encontrado'}</p>
  }

  const esRotativa = producto.tipo_producto === 'rotativa'
  const det = producto.rad_detalle_producto
  const sp = producto.rad_producto_spot
  const precioGuardado = det?.precio_guardado ?? sp?.precio_guardado ?? 0
  const descuento = det?.descuento_aplicado ?? sp?.descuento_aplicado ?? 0
  const emisora = producto.rad_emisora
  const lugar = emisora?.rad_lugar

  const coms = (emisora?.rad_emisora_x_comercializadora ?? [])
    .map((r) => r.rad_comercializadora)
    .filter(Boolean)

  const locutores = (producto.rad_producto_x_locutor ?? [])

  const precioLocutores = locutores.reduce(
    (acc, r) => acc + Number(r.precio_locutor ?? 0), 0
  )

  const horarios = producto.rad_horario_dia ?? []
  const enLista = productosSeleccionados.some((p) => p.id === producto.id)

  return (
    <>
      <div className="pl-page__head">
        <div className="pl-page__title">
          <h1>{producto.nombre_producto}</h1>
          <div className="pl-row" style={{ marginTop: 'var(--space-2)' }}>
            <RadBadge tipo={producto.tipo_producto} />
          </div>
        </div>
        <div className="pl-row">
          <Button variant="secondary" size="m" onClick={() => navigate('/rad/productos')}>
            Volver
          </Button>
          <Button
            variant={enLista ? 'accent' : 'secondary'}
            size="m"
            icon="plus"
            onClick={() => { agregarProducto(producto); setListaAbierta(true) }}
            disabled={enLista}
          >
            {enLista ? 'En la lista' : 'Agregar a propuesta'}
          </Button>
          <Button variant="primary" size="m" icon="edit" onClick={() => navigate(`/rad/productos/${id}/editar`)}>
            Editar
          </Button>
        </div>
      </div>

      <div className="pl-stack" style={{ gap: 'var(--space-5)' }}>

        {/* Info básica */}
        <div className="pl-card" style={{ padding: 'var(--space-6)' }}>
          <span className="label-section">Información básica</span>
          <div className="rad-detalle-grid" style={{ marginTop: 'var(--space-5)' }}>
            <Campo label="Nombre">{producto.nombre_producto}</Campo>
            <Campo label="Tipo"><RadBadge tipo={producto.tipo_producto} /></Campo>
            {producto.nota && (
              <div className="rad-detalle-full">
                <Campo label="Nota">{producto.nota}</Campo>
              </div>
            )}
          </div>
        </div>

        {/* Emisora */}
        <div className="pl-card" style={{ padding: 'var(--space-6)' }}>
          <span className="label-section">Emisora</span>
          <div className="rad-detalle-grid" style={{ marginTop: 'var(--space-5)' }}>
            <Campo label="Emisora">{emisora?.nombre_emisora}</Campo>
            <Campo label="Lugar">
              {lugar ? `${lugar.nombre_ciudad}, ${lugar.nombre_estado}` : null}
            </Campo>
            <div className="rad-detalle-full">
              <span className="label-field">Comercializadoras</span>
              <div className="pl-row" style={{ marginTop: 'var(--space-2)', flexWrap: 'wrap' }}>
                {coms.length
                  ? coms.map((c) => (
                      <span key={c.id} className="pl-chip pl-chip--slate">{c.nombre_comercializadora}</span>
                    ))
                  : <EmptyDash />}
              </div>
            </div>
          </div>
        </div>

        {/* Locutores */}
        {locutores.length > 0 && (
          <div className="pl-card" style={{ padding: 'var(--space-6)' }}>
            <span className="label-section">Locutores</span>
            <div className="pl-table-wrap" style={{ marginTop: 'var(--space-5)' }}>
              <table className="pl-table">
                <thead>
                  <tr>
                    <th>Locutor</th>
                    <th className="rad-col-num">Precio</th>
                  </tr>
                </thead>
                <tbody>
                  {locutores.map((r) => (
                    <tr key={r.rad_locutor?.id}>
                      <td className="name">{r.rad_locutor?.nombre_locutor}</td>
                      <td className="rad-col-num">Bs. {Number(r.precio_locutor).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Horarios */}
        {horarios.length > 0 && (
          <div className="pl-card" style={{ padding: 'var(--space-6)' }}>
            <span className="label-section">Horarios</span>
            <div className="pl-table-wrap" style={{ marginTop: 'var(--space-5)' }}>
              <table className="pl-table">
                <thead>
                  <tr>
                    <th>Días</th>
                    <th>Desde</th>
                    <th>Hasta</th>
                  </tr>
                </thead>
                <tbody>
                  {horarios.map((h) => (
                    <tr key={h.id}>
                      <td>{h.dias}</td>
                      <td>{h.hora_inicio ?? <EmptyDash />}</td>
                      <td>{h.hora_fin ?? <EmptyDash />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Detalle / Spot */}
        {(det || sp) && (
          <div className="pl-card" style={{ padding: 'var(--space-6)' }}>
            <span className="label-section">
              {esRotativa ? 'Detalle del spot' : 'Detalle del producto'}
            </span>
            <div className="rad-detalle-grid" style={{ marginTop: 'var(--space-5)' }}>
              {!esRotativa && det?.sinopsis && (
                <div className="rad-detalle-full">
                  <Campo label="Sinopsis">{det.sinopsis}</Campo>
                </div>
              )}
              {esRotativa && sp?.duracion_segundos != null && (
                <Campo label="Duración">{sp.duracion_segundos}s</Campo>
              )}
              {!esRotativa && (
                <Campo label="Participación">{det?.participacion || null}</Campo>
              )}
              {!esRotativa && (
                <Campo label="Tono">{det?.tono || null}</Campo>
              )}
              {!esRotativa && (
                <Campo label="Edad">{det?.edad || null}</Campo>
              )}
              {!esRotativa && (
                <Campo label="Género">{det?.genero || null}</Campo>
              )}
              {!esRotativa && (
                <Campo label="Estrato">{det?.estrato || null}</Campo>
              )}
            </div>

            <div style={{ marginTop: 'var(--space-6)' }}>
              <ProductoMetricas
                precioGuardado={precioGuardado}
                descuentoAplicado={descuento}
                precioLocutores={precioLocutores}
              />
            </div>
          </div>
        )}

      </div>
    </>
  )
}
