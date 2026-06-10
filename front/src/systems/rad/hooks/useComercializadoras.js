import { useState, useEffect, useCallback } from 'react'
import { comercializadoraService } from '../services/comercializadoraService'

export function useComercializadoras() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data: rows, error: err } = await comercializadoraService.getAll()
    if (err) setError(err.message ?? 'Error al cargar comercializadoras')
    else setData(rows ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, refetch: fetch }
}
