import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Field, Input } from '../../../components/primitives'
import { getCampanaById, createCampana, updateCampana, getMarcas } from '../lib/infQueries'

const FORM_VACÍO = {
  nombre: '',
  marca_id: '',
  fecha_inicio: '',
  fecha_fin: '',
}

export default function CampanaForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const esEdicion = Boolean(id)

  const [form, setForm] = useState(FORM_VACÍO)
  const [marcas, setMarcas] = useState([])
  const [errores, setErrores] = useState({})
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [errorApi, setErrorApi] = useState(null)

  useEffect(() => {
    const fetchs = [getMarcas()]
    if (esEdicion) fetchs.push(getCampanaById(id))
    setCargando(true)
    Promise.all(fetchs)
      .then(([ms, campana]) => {
        setMarcas(ms)
        if (campana) {
          setForm({
            nombre: campana.nombre ?? '',
            marca_id: campana.marca_id ?? '',
            fecha_inicio: campana.fecha_inicio ?? '',
            fecha_fin: campana.fecha_fin ?? '',
          })
        }
      })
      .catch((e) => setErrorApi(e.message))
      .finally(() => setCargando(false))
  }, [id, esEdicion])

  const set = (campo, valor) => {
    setForm((f) => ({ ...f, [campo]: valor }))
    if (errores[campo]) setErrores((e) => ({ ...e, [campo]: null }))
  }

  const validar = () => {
    const e = {}
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio'
    if (!form.marca_id) e.marca_id = 'Selecciona una marca'
    if (!form.fecha_inicio) e.fecha_inicio = 'Obligatorio'
    if (!form.fecha_fin) e.fecha_fin = 'Obligatorio'
    return e
  }

  const guardar = async (ev) => {
    ev.preventDefault()
    const e = validar()
    if (Object.keys(e).length) { setErrores(e); return }

    const payload = {
      nombre: form.nombre.trim(),
      marca_id: form.marca_id,
      fecha_inicio: form.fecha_inicio,
      fecha_fin: form.fecha_fin,
    }

    setGuardando(true)
    setErrorApi(null)
    try {
      if (esEdicion) {
        await updateCampana(id, payload)
        navigate(`/inf/campanas/${id}`)
      } else {
        const nueva = await createCampana(payload)
        navigate(`/inf/campanas/${nueva.id}`)
      }
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
          <h1>{esEdicion ? 'Editar campaña' : 'Nueva campaña'}</h1>
          <span className="meta"><b>INF</b> · Medios Pagos</span>
        </div>
      </div>

      <form onSubmit={guardar} noValidate>
        <div className="pl-card inf-form-card" style={{ padding: 'var(--space-6)', maxWidth: '560px' }}>
          <div className="pl-stack">
            <Field label="Nombre" error={errores.nombre}>
              <Input
                value={form.nombre}
                onChange={(v) => set('nombre', v)}
                placeholder="Nombre de la campaña"
                error={!!errores.nombre}
              />
            </Field>

            <Field label="Marca" error={errores.marca_id}>
              <select
                className="inf-select-native"
                value={form.marca_id}
                onChange={(e) => set('marca_id', e.target.value)}
              >
                <option value="">Seleccionar marca</option>
                {marcas.map((m) => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </select>
            </Field>

            <div className="pl-grid-2">
              <Field label="Fecha inicio" error={errores.fecha_inicio}>
                <div className={`pl-input${errores.fecha_inicio ? ' is-error' : ''}`}>
                  <input
                    type="date"
                    value={form.fecha_inicio}
                    onChange={(e) => set('fecha_inicio', e.target.value)}
                  />
                </div>
              </Field>
              <Field label="Fecha fin" error={errores.fecha_fin}>
                <div className={`pl-input${errores.fecha_fin ? ' is-error' : ''}`}>
                  <input
                    type="date"
                    value={form.fecha_fin}
                    onChange={(e) => set('fecha_fin', e.target.value)}
                  />
                </div>
              </Field>
            </div>

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
