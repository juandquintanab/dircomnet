import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { calcProductoMetricas } from '../utils/metricas'
import { propuestaService } from '../services/propuestaService'

const PropuestaActivaContext = createContext(null)

export function PropuestaActivaProvider({ children }) {
  const [items, setItems] = useState([])       // { id, nombre_producto, tipo_producto, ...metricas }
  const [listaAbierta, setListaAbierta] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [guardadoError, setGuardadoError] = useState(null)

  const agregarProducto = useCallback((producto) => {
    setItems((prev) => {
      if (prev.some((p) => p.id === producto.id)) return prev
      const metricas = calcProductoMetricas(producto)
      return [...prev, {
        id: producto.id,
        nombre_producto: producto.nombre_producto,
        tipo_producto: producto.tipo_producto,
        ...metricas,
      }]
    })
  }, [])

  const quitarProducto = useCallback((id) => {
    setItems((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const limpiar = useCallback(() => setItems([]), [])

  const totales = useMemo(() => {
    const total = items.reduce((acc, p) => acc + p.precioTotal, 0)
    const totalMercado = items.reduce((acc, p) => acc + p.precioMercado, 0)
    return { total, totalMercado, ahorroTotal: totalMercado - total }
  }, [items])

  const guardarComoPropuesta = useCallback(async (nombre) => {
    if (!nombre?.trim()) return { ok: false, error: 'El nombre es obligatorio' }
    if (!items.length) return { ok: false, error: 'La lista está vacía' }
    setGuardando(true)
    setGuardadoError(null)
    const { data, error } = await propuestaService.create({
      nombre: nombre.trim(),
      productos: items.map((p) => p.id),
    })
    setGuardando(false)
    if (error) {
      setGuardadoError(error.message ?? 'Error al guardar')
      return { ok: false, error: error.message }
    }
    setItems([])
    return { ok: true, id: data.id }
  }, [items])

  const value = {
    productosSeleccionados: items,
    listaAbierta,
    setListaAbierta,
    agregarProducto,
    quitarProducto,
    limpiar,
    guardando,
    guardadoError,
    guardarComoPropuesta,
    ...totales,
  }

  return (
    <PropuestaActivaContext.Provider value={value}>
      {children}
    </PropuestaActivaContext.Provider>
  )
}

export function usePropuestaActivaContext() {
  const ctx = useContext(PropuestaActivaContext)
  if (!ctx) throw new Error('usePropuestaActivaContext debe usarse dentro de PropuestaActivaProvider')
  return ctx
}
