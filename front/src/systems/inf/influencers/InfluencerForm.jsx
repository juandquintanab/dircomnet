import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Field, Input, Select } from '../../../components/primitives'
import { getInfluencerById, createInfluencer, updateInfluencer } from '../lib/infQueries'

const TIPOS = ['nano', 'micro', 'macro', 'celebrity']

const FORM_VACÍO = {
  nombre: '',
  usuario_instagram: '',
  usuario_tiktok: '',
  usuario_youtube: '',
  telefono: '',
  correo: '',
  ciudad: '',
  seguidores: '',
  categoria: '',
  tipo: '',
}

export default function InfluencerForm() {
  const { id } = useParams()
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
    getInfluencerById(id)
      .then((inf) => {
        setForm({
          nombre: inf.nombre ?? '',
          usuario_instagram: inf.usuario_instagram ?? '',
          usuario_tiktok: inf.usuario_tiktok ?? '',
          usuario_youtube: inf.usuario_youtube ?? '',
          telefono: inf.telefono ?? '',
          correo: inf.correo ?? '',
          ciudad: inf.ciudad ?? '',
          seguidores: inf.seguidores != null ? String(inf.seguidores) : '',
          categoria: inf.categoria ?? '',
          tipo: inf.tipo ?? '',
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
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio'
    return e
  }

  const guardar = async (ev) => {
    ev.preventDefault()
    const e = validar()
    if (Object.keys(e).length) { setErrores(e); return }

    const payload = {
      nombre: form.nombre.trim(),
      usuario_instagram: form.usuario_instagram.trim() || null,
      usuario_tiktok: form.usuario_tiktok.trim() || null,
      usuario_youtube: form.usuario_youtube.trim() || null,
      telefono: form.telefono.trim() || null,
      correo: form.correo.trim() || null,
      ciudad: form.ciudad.trim() || null,
      seguidores: form.seguidores ? parseInt(form.seguidores, 10) : null,
      categoria: form.categoria.trim() || null,
      tipo: form.tipo || null,
    }

    setGuardando(true)
    setErrorApi(null)
    try {
      if (esEdicion) {
        await updateInfluencer(id, payload)
        navigate(`/inf/influencers/${id}`)
      } else {
        const nuevo = await createInfluencer(payload)
        navigate(`/inf/influencers/${nuevo.id}`)
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
          <h1>{esEdicion ? 'Editar influencer' : 'Nuevo influencer'}</h1>
          <span className="meta"><b>INF</b> · Medios Pagos</span>
        </div>
      </div>

      <form onSubmit={guardar} noValidate>
        <div className="pl-card inf-form-card" style={{ padding: 'var(--space-6)' }}>

          {/* ── Datos principales ── */}
          <div className="inf-form-section">
            <span className="inf-form-section-title">Datos principales</span>
            <Field label="Nombre" error={errores.nombre}>
              <Input
                value={form.nombre}
                onChange={(v) => set('nombre', v)}
                placeholder="Nombre completo"
                error={!!errores.nombre}
              />
            </Field>
            <div className="pl-grid-2">
              <Field label="Teléfono">
                <Input
                  value={form.telefono}
                  onChange={(v) => set('telefono', v)}
                  placeholder="Ej. 0414-1234567"
                />
              </Field>
              <Field label="Correo">
                <Input
                  value={form.correo}
                  onChange={(v) => set('correo', v)}
                  placeholder="correo@ejemplo.com"
                />
              </Field>
            </div>
          </div>

          {/* ── Redes sociales ── */}
          <div className="inf-form-section">
            <span className="inf-form-section-title">Redes sociales</span>
            <div className="pl-grid-3">
              <Field label="Usuario Instagram">
                <Input
                  value={form.usuario_instagram}
                  onChange={(v) => set('usuario_instagram', v)}
                  placeholder="@usuario"
                />
              </Field>
              <Field label="Usuario TikTok">
                <Input
                  value={form.usuario_tiktok}
                  onChange={(v) => set('usuario_tiktok', v)}
                  placeholder="@usuario"
                />
              </Field>
              <Field label="Usuario YouTube">
                <Input
                  value={form.usuario_youtube}
                  onChange={(v) => set('usuario_youtube', v)}
                  placeholder="@canal"
                />
              </Field>
            </div>
          </div>

          {/* ── Clasificación ── */}
          <div className="inf-form-section">
            <span className="inf-form-section-title">Clasificación</span>
            <div className="pl-grid-2">
              <Field label="Ciudad">
                <Input
                  value={form.ciudad}
                  onChange={(v) => set('ciudad', v)}
                  placeholder="Ej. Caracas"
                />
              </Field>
              <Field label="Seguidores">
                <Input
                  value={form.seguidores}
                  onChange={(v) => set('seguidores', v.replace(/\D/g, ''))}
                  placeholder="Ej. 150000"
                />
              </Field>
              <Field label="Categoría">
                <Input
                  value={form.categoria}
                  onChange={(v) => set('categoria', v)}
                  placeholder="Ej. Lifestyle, Fitness"
                />
              </Field>
              <Field label="Tipo">
                <Select
                  value={form.tipo}
                  onChange={(v) => set('tipo', v)}
                  options={TIPOS}
                  placeholder="Seleccionar tipo"
                />
              </Field>
            </div>
          </div>

          {errorApi && <div className="inf-error">{errorApi}</div>}

          {/* ── Acciones ── */}
          <div className="pl-row" style={{ justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => navigate(-1)} disabled={guardando}>
              Cancelar
            </Button>
            <Button variant="accent" type="submit" disabled={guardando}>
              {guardando ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
        </div>
      </form>
    </>
  )
}
