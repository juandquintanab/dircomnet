import { useState, useEffect, useCallback } from 'react'
import { propuestaService } from '../services/propuestaService'

export function usePropuestas() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data: rows, error: err } = await propuestaService.getAll()
    if (err) setError(err.message ?? 'Error al cargar propuestas')
    else setData(rows ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, refetch: fetch }
}
