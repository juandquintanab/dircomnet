import { useNavigate } from 'react-router-dom'
import { Button, EmptyDash } from '../../../../components/primitives'
import RadBadge from '../shared/RadBadge'
import { useMetricas } from '../../hooks/useMetricas'
import { usePropuestaActiva } from '../../hooks/usePropuestaActiva'

function fmt(n) {
  return Number(n).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function FilaProducto({ producto, onEliminar }) {
  const navigate = useNavigate()
  const { agregarProducto, productosSeleccionados, setListaAbierta } = usePropuestaActiva()
  const enLista = productosSeleccionados.some((p) => p.id === producto.id)

  const det = producto.rad_detalle_producto
  const sp = producto.rad_producto_spot
  const precioGuardado = det?.precio_guardado ?? sp?.precio_guardado ?? 0
  const descuento = det?.descuento_aplicado ?? sp?.descuento_aplicado ?? 0
  const { precioMercado, ahorro } = useMetricas(precioGuardado, descuento)

  const precioLocutores = (producto.rad_producto_x_locutor ?? []).reduce(
    (acc, r) => acc + Number(r.precio_locutor ?? 0), 0
  )

  const emisora = producto.rad_emisora
  const lugar = emisora?.rad_lugar
  const coms = (emisora?.rad_emisora_x_comercializadora ?? [])
    .map((r) => r.rad_comercializadora?.nombre_comercializadora)
    .filter(Boolean)
  const locutores = (producto.rad_producto_x_locutor ?? [])
    .map((r) => r.rad_locutor?.nombre_locutor)
    .filter(Boolean)

  return (
    <tr>
      <td className="name">{producto.nombre_producto}</td>
      <td><RadBadge tipo={producto.tipo_producto} /></td>
      <td>{emisora?.nombre_emisora ?? <EmptyDash />}</td>
      <td>
        {coms.length ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {coms.map((c) => (
              <span key={c} className="pl-chip pl-chip--slate">{c}</span>
            ))}
          </div>
        ) : <EmptyDash />}
      </td>
      <td>{lugar ? `${lugar.nombre_ciudad}` : <EmptyDash />}</td>
      <td>
        {locutores.length ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {locutores.map((l) => (
              <span key={l} className="pl-chip pl-chip--slate">{l}</span>
            ))}
          </div>
        ) : <EmptyDash />}
      </td>
      <td className="rad-col-num">Bs. {fmt(precioGuardado)}</td>
      <td className="rad-col-num">{descuento ? `${descuento}%` : <EmptyDash />}</td>
      <td className="rad-col-num">Bs. {fmt(precioMercado)}</td>
      <td className="rad-col-num" style={{ color: 'var(--status-success)' }}>Bs. {fmt(ahorro)}</td>
      <td>
        <div className="pl-row" style={{ justifyContent: 'flex-end' }}>
          <Button
            variant={enLista ? 'accent' : 'ghost'}
            size="s"
            icon="plus"
            onClick={() => { agregarProducto(producto); setListaAbierta(true) }}
            disabled={enLista}
          />
          <Button variant="ghost" size="s" icon="external" onClick={() => navigate(`/rad/productos/${producto.id}`)} />
          <Button variant="ghost" size="s" icon="edit" onClick={() => navigate(`/rad/productos/${producto.id}/editar`)} />
          <Button variant="ghost" size="s" icon="trash" onClick={() => onEliminar(producto)} />
        </div>
      </td>
    </tr>
  )
}

export default function ProductoTabla({ productos, onEliminar }) {
  return (
    <div className="pl-table-wrap">
      <table className="pl-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Tipo</th>
            <th>Emisora</th>
            <th>Comercializadoras</th>
            <th>Lugar</th>
            <th>Locutores</th>
            <th className="rad-col-num">Precio</th>
            <th className="rad-col-num">Desc.</th>
            <th className="rad-col-num">Mercado</th>
            <th className="rad-col-num">Ahorro</th>
            <th style={{ width: 120 }}></th>
          </tr>
        </thead>
        <tbody>
          {productos.map((p) => (
            <FilaProducto key={p.id} producto={p} onEliminar={onEliminar} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
