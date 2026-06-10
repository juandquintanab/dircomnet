const ESC = (v) => {
  const s = String(v ?? '')
  return /[,"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function downloadCSV(rows, filename) {
  const headers = [
    'Nombre', 'Tipo', 'Emisora', 'Locutores',
    'Precio', 'Desc. %', 'Mercado', 'Ahorro',
    'P. Locutores', 'Total',
  ]
  const lines = [
    headers.map(ESC).join(','),
    ...rows.map((r) => [
      r.nombre_producto, r.tipo, r.emisora, r.locutores,
      r.precio_guardado, r.descuento, r.precio_mercado, r.ahorro,
      r.precio_locutores, r.precio_total,
    ].map(ESC).join(',')),
  ]

  // BOM para que Excel abra UTF-8 correctamente
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
