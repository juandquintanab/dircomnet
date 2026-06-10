export function calcMetricas(precioGuardado, descuentoAplicado) {
  const pg = Number(precioGuardado) || 0
  const desc = Number(descuentoAplicado) || 0
  if (desc === 0) return { precioMercado: pg, ahorro: 0 }
  const precioMercado = pg / (1 - desc / 100)
  return { precioMercado, ahorro: precioMercado - pg }
}

export function calcProductoMetricas(producto) {
  const det = producto.rad_detalle_producto
  const sp = producto.rad_producto_spot
  const precioGuardado = Number(det?.precio_guardado ?? sp?.precio_guardado ?? 0)
  const descuento = Number(det?.descuento_aplicado ?? sp?.descuento_aplicado ?? 0)
  const precioLocutores = (producto.rad_producto_x_locutor ?? []).reduce(
    (acc, r) => acc + Number(r.precio_locutor ?? 0), 0
  )
  const { precioMercado, ahorro } = calcMetricas(precioGuardado, descuento)
  const precioTotal = precioGuardado + precioLocutores
  return { precioGuardado, descuento, precioLocutores, precioMercado, ahorro, precioTotal }
}
