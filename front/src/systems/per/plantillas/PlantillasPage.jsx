import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, EmptyDash, Chip, Icon } from '../../../components/primitives'
import { getPlantillas, getListasCountByPlantilla } from '../lib/perQueries'

const TIPO_TONE = { convocatoria: 'blue', gifting: 'green', gira: 'yellow', otra: 'slate' }

export default function PlantillasPage() {
  const navigate = useNavigate()
  const [plantillas, setPlantillas] = useState([])
  const [countMap, setCountMap]     = useState({})
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    Promise.all([getPlantillas(), getListasCountByPlantilla()])
      .then(([data, map]) => { setPlantillas(data); setCountMap(map) })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <div className="pl-page__head">
        <div className="pl-page__title">
          <h1>Plantillas</h1>
          <span className="meta"><b>PER</b> · Difusión y PR</span>
        </div>
        <div className="pl-page__actions">
          <Button variant="accent" icon="plus" onClick={() => navigate('/per/plantillas/nuevo')}>
            Nueva plantilla
          </Button>
        </div>
      </div>

      <div className="pl-card pl-table-wrap">
        {loading && <div className="per-loading">Cargando plantillas…</div>}
        {error   && <div className="per-error">Error al cargar los datos.</div>}

        {!loading && !error && (
          <>
            <div className="pl-table-meta">
              <span className="left">
                <b>{plantillas.length}</b>{' '}
                {plantillas.length === 1 ? 'plantilla' : 'plantillas'}
              </span>
            </div>
            <table className="pl-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th style={{ textAlign: 'center' }}>Campos</th>
                  <th style={{ textAlign: 'center' }}>Listas</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {plantillas.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="per-empty">Sin plantillas registradas</div>
                    </td>
                  </tr>
                ) : (
                  plantillas.map((p) => (
                    <tr key={p.id}>
                      <td className="name">{p.nombre}</td>
                      <td>
                        {p.tipo_lista
                          ? <Chip tone={TIPO_TONE[p.tipo_lista] ?? 'slate'}>{p.tipo_lista}</Chip>
                          : <EmptyDash />}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {p.campos_plantilla?.length ?? 0}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {countMap[p.id] ?? 0}
                      </td>
                      <td>
                        <div className="per-row-actions">
                          <Button
                            variant="secondary"
                            size="s"
                            icon="edit"
                            onClick={() => navigate(`/per/plantillas/${p.id}/editar`)}
                          >
                            Editar
                          </Button>
                        </div>
                      </td>
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
