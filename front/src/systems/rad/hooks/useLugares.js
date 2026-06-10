import { useState, useEffect, useCallback } from 'react'
import { lugarService } from '../services/lugarService'

export function useLugares() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data: rows, error: err } = await lugarService.getAll()
    if (err) setError(err.message ?? 'Error al cargar lugares')
    else setData(rows ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, refetch: fetch }
}
