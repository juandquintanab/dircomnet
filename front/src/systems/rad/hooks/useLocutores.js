import { useState, useEffect, useCallback } from 'react'
import { locutorService } from '../services/locutorService'

export function useLocutores() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data: rows, error: err } = await locutorService.getAll()
    if (err) setError(err.message ?? 'Error al cargar locutores')
    else setData(rows ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, refetch: fetch }
}
