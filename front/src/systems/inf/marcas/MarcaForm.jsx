import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Field, Input } from '../../../components/primitives'
import { getMarcas, createMarca, updateMarca } from '../lib/infQueries'

export default function MarcaForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const esEdicion = Boolean(id)

  const [nombre, setNombre] = useState('')
  const [errorNombre, setErrorNombre] = useState(null)
  const [cargando, setCargando] = useState(esEdicion)
  const [guardando, setGuardando] = useState(false)
  const [errorApi, setErrorApi] = useState(null)

  useEffect(() => {
    if (!esEdicion) return
    setCargando(true)
    getMarcas()
      .then((marcas) => {
        const marca = marcas.find((m) => m.id === id)
        if (marca) setNombre(marca.nombre)
      })
      .catch((e) => setErrorApi(e.message))
      .finally(() => setCargando(false))
  }, [id, esEdicion])

  const guardar = async (ev) => {
    ev.preventDefault()
    if (!nombre.trim()) { setErrorNombre('El nombre es obligatorio'); return }

    setGuardando(true)
    setErrorApi(null)
    try {
      if (esEdicion) {
        await updateMarca(id, { nombre: nombre.trim() })
      } else {
        await createMarca({ nombre: nombre.trim() })
      }
      navigate('/inf/marcas')
    } catch (e) {
      setErrorApi(e.message)
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) return <div className="inf-loading">Cargando…</div>

  return (
    <>
      <div className="pl-page__head">
        <div className="pl-page__title">
          <h1>{esEdicion ? 'Editar marca' : 'Nueva marca'}</h1>
          <span className="meta"><b>INF</b> · Medios Pagos</span>
        </div>
      </div>

      <form onSubmit={guardar} noValidate>
        <div className="pl-card" style={{ padding: 'var(--space-6)', maxWidth: '480px' }}>
          <div className="pl-stack">
            <Field label="Nombre" error={errorNombre}>
              <Input
                value={nombre}
                onChange={(v) => { setNombre(v); setErrorNombre(null) }}
                placeholder="Nombre de la marca"
                error={!!errorNombre}
              />
            </Field>

            {errorApi && <div className="inf-error">{errorApi}</div>}

            <div className="pl-row" style={{ justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => navigate(-1)} disabled={guardando}>
                Cancelar
              </Button>
              <Button variant="accent" type="submit" disabled={guardando}>
                {guardando ? 'Guardando…' : 'Guardar'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </>
  )
}
