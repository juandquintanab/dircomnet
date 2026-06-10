import { useState, useEffect, useCallback } from 'react'
import { productoService } from '../services/productoService'

export function useProductos(filtros = {}) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const filtrosKey = JSON.stringify(filtros)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data: rows, error: err } = await productoService.getAll(JSON.parse(filtrosKey))
    if (err) setError(err.message ?? 'Error al cargar productos')
    else setData(rows ?? [])
    setLoading(false)
  }, [filtrosKey])

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, refetch: fetch }
}
