import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Field, Select } from '../../../components/primitives'
import { getEntregableById, createEntregable, updateEntregable } from '../lib/infQueries'

const TIPOS = ['reel', 'historia', 'post']
const ESTATUS_OPTS = ['pendiente', 'entregado']

const FORM_VACÍO = {
  tipo: '',
  fecha_publicacion: '',
  estatus: 'pendiente',
  link_publicacion: '',
}

export default function EntregableForm() {
  const { contratoId, id } = useParams()
  const navigate = useNavigate()
  const esEdicion = Boolean(id)

  const [form, setForm] = useState(FORM_VACÍO)
  const [errores, setErrores] = useState({})
  const [cargando, setCargando] = useState(esEdicion)
  const [guardando, setGuardando] = useState(false)
  const [errorApi, setErrorApi] = useState(null)

  useEffect(() => {
    if (!esEdicion) return
    setCargando(true)
    getEntregableById(id)
      .then((e) => {
        setForm({
          tipo: e.tipo ?? '',
          fecha_publicacion: e.fecha_publicacion ?? '',
          estatus: e.estatus ?? 'pendiente',
          link_publicacion: e.link_publicacion ?? '',
        })
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
    if (!form.tipo) e.tipo = 'El tipo es obligatorio'
    return e
  }

  const guardar = async (ev) => {
    ev.preventDefault()
    const e = validar()
    if (Object.keys(e).length) { setErrores(e); return }

    const payload = {
      contrato_id: contratoId,
      tipo: form.tipo,
      fecha_publicacion: form.fecha_publicacion || null,
      estatus: form.estatus || 'pendiente',
      link_publicacion: form.link_publicacion.trim() || null,
    }

    setGuardando(true)
    setErrorApi(null)
    try {
      if (esEdicion) {
        await updateEntregable(id, payload)
      } else {
        await createEntregable(payload)
      }
      navigate(`/inf/contratos/${contratoId}`)
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
          <h1>{esEdicion ? 'Editar entregable' : 'Nuevo entregable'}</h1>
          <span className="meta"><b>INF</b> · Medios Pagos</span>
        </div>
      </div>

      <form onSubmit={guardar} noValidate>
        <div className="pl-card inf-form-card" style={{ padding: 'var(--space-6)', maxWidth: '560px' }}>
          <div className="pl-stack">
            <Field label="Tipo" error={errores.tipo}>
              <Select
                value={form.tipo}
                onChange={(v) => set('tipo', v)}
                options={TIPOS}
                placeholder="Seleccionar tipo"
              />
            </Field>

            <Field label="Estatus">
              <Select
                value={form.estatus}
                onChange={(v) => set('estatus', v || 'pendiente')}
                options={ESTATUS_OPTS}
                placeholder="Seleccionar estatus"
              />
            </Field>

            <Field label="Fecha de publicación">
              <div className="pl-input">
                <input
                  type="date"
                  value={form.fecha_publicacion}
                  onChange={(e) => set('fecha_publicacion', e.target.value)}
                />
              </div>
            </Field>

            <Field label="Link de publicación">
              <div className="pl-input">
                <input
                  type="url"
                  value={form.link_publicacion}
                  onChange={(e) => set('link_publicacion', e.target.value)}
                  placeholder="https://…"
                />
              </div>
            </Field>

            {errorApi && <div className="inf-error">{errorApi}</div>}

            <div className="pl-row" style={{ justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => navigate(`/inf/contratos/${contratoId}`)} disabled={guardando}>
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
