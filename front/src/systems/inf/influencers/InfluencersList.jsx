import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Select, EmptyDash, Chip } from '../../../components/primitives'
import { getInfluencers } from '../lib/infQueries'

const TIPO_TONE = { nano: 'slate', micro: 'blue', macro: 'yellow', celebrity: 'green' }
const toneTipo = (t) => TIPO_TONE[String(t).toLowerCase()] ?? 'slate'

function formatSeguidores(n) {
  if (!n && n !== 0) return null
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return n.toLocaleString('es-VE')
}

// Muestra hasta 2 chips y un "+N" con tooltip para el resto.
function ChipsTruncados({ valores, tone = 'slate' }) {
  if (!valores || valores.length === 0) return <EmptyDash />
  const visibles = valores.slice(0, 2)
  const resto = valores.slice(2)
  return (
    <span className="inf-chips">
      {visibles.map((v) => (
        <Chip key={v} tone={tone}>{v}</Chip>
      ))}
      {resto.length > 0 && (
        <span className="inf-chip-more" title={resto.join(', ')}>+{resto.length}</span>
      )}
    </span>
  )
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

  const tipos = useMemo(
    () => [...new Set(todos.flatMap((i) => i.tipos))].sort(),
    [todos],
  )
  const categorias = useMemo(
    () => [...new Set(todos.flatMap((i) => i.categorias))].sort(),
    [todos],
  )

  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase()
    return todos.filter((i) => {
      const matchNombre = i.nombre.toLowerCase().includes(q)
      const matchTipo = !filtroTipo || i.tipos.includes(filtroTipo)
      const matchCat = !filtroCategoria || i.categorias.includes(filtroCategoria)
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
            options={tipos}
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
                {filtrados.length !== todos.length && ` de ${todos.length}`}
              </span>
            </div>
            <table className="pl-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Redes</th>
                  <th>Seguidores</th>
                  <th>Ciudad</th>
                  <th>Categorías</th>
                  <th>Tipo</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="inf-empty">Sin resultados</div>
                    </td>
                  </tr>
                ) : (
                  filtrados.map((i) => (
                    <tr key={i.id} onClick={() => navigate(`/inf/influencers/${i.id}`)}>
                      <td className="name">{i.nombre}</td>
                      <td>
                        <ChipsTruncados
                          valores={i.redes.map((r) => r.plataforma).filter(Boolean)}
                          tone="blue"
                        />
                      </td>
                      <td>
                        {i.seguidores ? formatSeguidores(i.seguidores) : <EmptyDash />}
                      </td>
                      <td>{i.ciudad || <EmptyDash />}</td>
                      <td><ChipsTruncados valores={i.categorias} /></td>
                      <td>
                        {i.tipos.length > 0 ? (
                          <span className="inf-chips">
                            {i.tipos.map((t) => (
                              <Chip key={t} tone={toneTipo(t)}>{t}</Chip>
                            ))}
                          </span>
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
