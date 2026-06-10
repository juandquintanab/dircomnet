import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, EmptyDash } from '../../../components/primitives'
import { getMarcas } from '../lib/infQueries'

function formatFecha(d) {
  if (!d) return null
  const [y, m, day] = d.split('T')[0].split('-')
  return `${day}/${m}/${y}`
}

export default function MarcasList() {
  const navigate = useNavigate()
  const [marcas, setMarcas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getMarcas()
      .then(setMarcas)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <div className="pl-page__head">
        <div className="pl-page__title">
          <h1>Marcas</h1>
          <span className="meta"><b>INF</b> · Medios Pagos</span>
        </div>
        <div className="pl-page__actions">
          <Button variant="accent" icon="plus" onClick={() => navigate('/inf/marcas/nueva')}>
            Nueva marca
          </Button>
        </div>
      </div>

      <div className="pl-card pl-table-wrap">
        {loading && <div className="inf-loading">Cargando marcas…</div>}
        {error && <div className="inf-error">Error al cargar los datos.</div>}

        {!loading && !error && (
          <>
            <div className="pl-table-meta">
              <span className="left">
                <b>{marcas.length}</b>{' '}
                {marcas.length === 1 ? 'marca' : 'marcas'}
              </span>
            </div>
            <table className="pl-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Fecha de creación</th>
                </tr>
              </thead>
              <tbody>
                {marcas.length === 0 ? (
                  <tr>
                    <td colSpan={2}>
                      <div className="inf-empty">Sin marcas registradas</div>
                    </td>
                  </tr>
                ) : (
                  marcas.map((m) => (
                    <tr key={m.id} onClick={() => navigate(`/inf/marcas/${m.id}/editar`)}>
                      <td className="name">{m.nombre}</td>
                      <td>{formatFecha(m.created_at) || <EmptyDash />}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </>
        )}
      </div>
    </>
  )
}
