import { useState, useEffect, useCallback } from 'react'
import { emisoraService } from '../services/emisoraService'

export function useEmisoras() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data: rows, error: err } = await emisoraService.getAll()
    if (err) setError(err.message ?? 'Error al cargar emisoras')
    else setData(rows ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, refetch: fetch }
}
