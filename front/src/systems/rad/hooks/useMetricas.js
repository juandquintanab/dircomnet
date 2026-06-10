import { useMemo } from 'react'

export function useMetricas(precioGuardado, descuentoAplicado) {
  return useMemo(() => {
    const pg = Number(precioGuardado) || 0
    const desc = Number(descuentoAplicado) || 0

    if (desc === 0) {
      return { precioMercado: pg, ahorro: 0 }
    }

    const precioMercado = pg / (1 - desc / 100)
    const ahorro = precioMercado - pg
    return { precioMercado, ahorro }
  }, [precioGuardado, descuentoAplicado])
}
