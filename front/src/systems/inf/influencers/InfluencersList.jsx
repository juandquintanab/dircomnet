import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Select, EmptyDash, Chip } from '../../../components/primitives'
import { getInfluencers } from '../lib/infQueries'

const TIPOS = ['nano', 'micro', 'macro', 'celebrity']

const TIPO_TONE = { nano: 'slate', micro: 'blue', macro: 'yellow', celebrity: 'green' }

function formatSeguidores(n) {
  if (!n && n !== 0) return null
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return n.toLocaleString('es-VE')
}

export default function InfluencersList() {
  const navigate = useNavigate()
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')

  useEffect(() => {
    setLoading(true)
    setError(null)
    getInfluencers()
      .then(setTodos)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const categorias = useMemo(
    () => [...new Set(todos.map((i) => i.categoria).filter(Boolean))].sort(),
    [todos],
  )

  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase()
    return todos.filter((i) => {
      const matchNombre = i.nombre.toLowerCase().includes(q)
      const matchTipo = !filtroTipo || i.tipo === filtroTipo
      const matchCat = !filtroCategoria || i.categoria === filtroCategoria
      return matchNombre && matchTipo && matchCat
    })
  }, [todos, busqueda, filtroTipo, filtroCategoria])

  return (
    <>
      <div className="pl-page__head">
        <div className="pl-page__title">
          <h1>Influencers</h1>
          <span className="meta"><b>INF</b> · Medios Pagos</span>
        </div>
        <div className="pl-page__actions">
          <Button variant="accent" icon="plus" onClick={() => navigate('/inf/influencers/nuevo')}>
            Nuevo influencer
          </Button>
        </div>
      </div>

      <div className="pl-card pl-table-wrap">
        <div className="inf-filterbar">
          <Input
            value={busqueda}
            onChange={setBusqueda}
            placeholder="Buscar por nombre…"
            leadingIcon="search"
          />
          <Select
            value={filtroTipo}
            onChange={setFiltroTipo}
            options={TIPOS}
            placeholder="Tipo"
          />
          <Select
            value={filtroCategoria}
            onChange={setFiltroCategoria}
            options={categorias}
            placeholder="Categoría"
          />
        </div>

        {loading && <div className="inf-loading">Cargando influencers…</div>}
        {error && <div className="inf-error">Error al cargar los datos.</div>}

        {!loading && !error && (
          <>
            <div className="pl-table-meta">
              <span className="left">
                <b>{filtrados.length}</b>{' '}
                {filtrados.length === 1 ? 'influencer' : 'influencers'}
              </span>
            </div>
            <table className="pl-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Instagram</th>
                  <th>TikTok</th>
                  <th>YouTube</th>
                  <th>Ciudad</th>
                  <th>Seguidores</th>
                  <th>Categoría</th>
                  <th>Tipo</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="inf-empty">Sin resultados</div>
                    </td>
                  </tr>
                ) : (
                  filtrados.map((i) => (
                    <tr key={i.id} onClick={() => navigate(`/inf/influencers/${i.id}`)}>
                      <td className="name">{i.nombre}</td>
                      <td>{i.usuario_instagram || <EmptyDash />}</td>
                      <td>{i.usuario_tiktok || <EmptyDash />}</td>
                      <td>{i.usuario_youtube || <EmptyDash />}</td>
                      <td>{i.ciudad || <EmptyDash />}</td>
                      <td>
                        {i.seguidores != null ? formatSeguidores(i.seguidores) : <EmptyDash />}
                      </td>
                      <td>{i.categoria || <EmptyDash />}</td>
                      <td>
                        {i.tipo ? (
                          <Chip tone={TIPO_TONE[i.tipo] ?? 'slate'}>{i.tipo}</Chip>
                        ) : (
                          <EmptyDash />
                        )}
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
