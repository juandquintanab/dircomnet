import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Field, Input } from '../../../components/primitives'
import { getPlantillas, createLista } from '../lib/perQueries'

const TIPO_LABEL = { convocatoria: 'Convocatoria', gifting: 'Gifting', gira: 'Gira', otra: 'Otra' }

export default function ListaForm() {
  const navigate = useNavigate()

  const [nombre, setNombre]           = useState('')
  const [plantillaId, setPlantillaId] = useState('')
  const [plantillas, setPlantillas]   = useState([])
  const [errores, setErrores]         = useState({})
  const [guardando, setGuardando]     = useState(false)
  const [errorApi, setErrorApi]       = useState(null)

  useEffect(() => {
    getPlantillas()
      .then(setPlantillas)
      .catch(() => {})
  }, [])

  const validar = () => {
    const e = {}
    if (!nombre.trim())  e.nombre     = 'El nombre es obligatorio'
    if (!plantillaId)    e.plantilla  = 'Selecciona una plantilla'
    return e
  }

  const guardar = async (ev) => {
    ev.preventDefault()
    const e = validar()
    if (Object.keys(e).length) { setErrores(e); return }

    setGuardando(true)
    setErrorApi(null)
    try {
      const nueva = await createLista({ nombre: nombre.trim(), plantilla_id: plantillaId })
      navigate(`/per/listas/${nueva.id}`)
    } catch (err) {
      setErrorApi(err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <>
      <div className="pl-page__head">
        <div className="pl-page__title">
          <h1>Nueva lista</h1>
          <span className="meta"><b>PER</b> · Difusión y PR</span>
        </div>
      </div>

      <form onSubmit={guardar} noValidate>
        <div className="pl-card per-form-card" style={{ padding: 'var(--space-6)', maxWidth: 560 }}>
          <div className="per-form-section">
            <span className="per-form-section-title">Datos de la lista</span>

            <Field label="Nombre" error={errores.nombre}>
              <Input
                value={nombre}
                onChange={(v) => { setNombre(v); if (errores.nombre) setErrores((e) => ({ ...e, nombre: null })) }}
                placeholder="Ej. Convocatoria lanzamiento Q3"
                error={!!errores.nombre}
              />
            </Field>

            <Field label="Plantilla" error={errores.plantilla}>
              <select
                className={`per-select-native${errores.plantilla ? ' is-error' : ''}`}
                value={plantillaId}
                onChange={(e) => { setPlantillaId(e.target.value); if (errores.plantilla) setErrores((err) => ({ ...err, plantilla: null })) }}
              >
                <option value="">Seleccionar plantilla…</option>
                {plantillas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}{p.tipo_lista ? ` — ${TIPO_LABEL[p.tipo_lista] ?? p.tipo_lista}` : ''}
                  </option>
                ))}
              </select>
              {errores.plantilla && (
                <span className="pl-field__hint is-error">{errores.plantilla}</span>
              )}
            </Field>
          </div>

          {errorApi && <div className="per-error" style={{ padding: 0 }}>{errorApi}</div>}

          <div className="pl-row" style={{ justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => navigate(-1)} disabled={guardando}>
              Cancelar
            </Button>
            <Button variant="accent" type="submit" disabled={guardando}>
              {guardando ? 'Creando…' : 'Crear lista'}
            </Button>
          </div>
        </div>
      </form>
    </>
  )
}
