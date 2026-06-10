import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Field, Input } from '../../../components/primitives'
import { getContratoById, createContrato, updateContrato, getInfluencers } from '../lib/infQueries'

const FORM_VACÍO = {
  influencer_id: '',
  fecha_inicio: '',
  fecha_fin: '',
  monto_total: '',
  monto_mensual: '',
  frecuencia_publicaciones: '',
  notas: '',
  documento_url: '',
}

export default function ContratoForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const esEdicion = Boolean(id)

  const [form, setForm] = useState(FORM_VACÍO)
  const [influencers, setInfluencers] = useState([])
  const [errores, setErrores] = useState({})
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [errorApi, setErrorApi] = useState(null)

  useEffect(() => {
    const fetchs = [getInfluencers()]
    if (esEdicion) fetchs.push(getContratoById(id))
    setCargando(true)
    Promise.all(fetchs)
      .then(([infs, contrato]) => {
        setInfluencers(infs)
        if (contrato) {
          setForm({
            influencer_id: contrato.influencer_id ?? '',
            fecha_inicio: contrato.fecha_inicio ?? '',
            fecha_fin: contrato.fecha_fin ?? '',
            monto_total: contrato.monto_total != null ? String(contrato.monto_total) : '',
            monto_mensual: contrato.monto_mensual != null ? String(contrato.monto_mensual) : '',
            frecuencia_publicaciones: contrato.frecuencia_publicaciones ?? '',
            notas: contrato.notas ?? '',
            documento_url: contrato.documento_url ?? '',
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
    if (!form.influencer_id) e.influencer_id = 'Selecciona un influencer'
    if (!form.fecha_inicio) e.fecha_inicio = 'Obligatorio'
    if (!form.fecha_fin) e.fecha_fin = 'Obligatorio'
    if (!form.monto_total) e.monto_total = 'Obligatorio'
    return e
  }

  const guardar = async (ev) => {
    ev.preventDefault()
    const e = validar()
    if (Object.keys(e).length) { setErrores(e); return }

    const payload = {
      influencer_id: form.influencer_id,
      fecha_inicio: form.fecha_inicio,
      fecha_fin: form.fecha_fin,
      monto_total: parseFloat(form.monto_total),
      monto_mensual: form.monto_mensual ? parseFloat(form.monto_mensual) : null,
      frecuencia_publicaciones: form.frecuencia_publicaciones.trim() || null,
      notas: form.notas.trim() || null,
      documento_url: form.documento_url.trim() || null,
    }

    setGuardando(true)
    setErrorApi(null)
    try {
      if (esEdicion) {
        await updateContrato(id, payload)
        navigate(`/inf/contratos/${id}`)
      } else {
        const nuevo = await createContrato(payload)
        navigate(`/inf/contratos/${nuevo.id}`)
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
          <h1>{esEdicion ? 'Editar contrato' : 'Nuevo contrato'}</h1>
          <span className="meta"><b>INF</b> · Medios Pagos</span>
        </div>
      </div>

      <form onSubmit={guardar} noValidate>
        <div className="pl-card inf-form-card" style={{ padding: 'var(--space-6)' }}>

          <div className="inf-form-section">
            <span className="inf-form-section-title">Datos del contrato</span>
            <Field label="Influencer" error={errores.influencer_id}>
              <select
                className="inf-select-native"
                value={form.influencer_id}
                onChange={(e) => set('influencer_id', e.target.value)}
              >
                <option value="">Seleccionar influencer</option>
                {influencers.map((inf) => (
                  <option key={inf.id} value={inf.id}>{inf.nombre}</option>
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
          </div>

          <div className="inf-form-section">
            <span className="inf-form-section-title">Condiciones económicas</span>
            <div className="pl-grid-2">
              <Field label="Monto total" error={errores.monto_total}>
                <div className={`pl-input${errores.monto_total ? ' is-error' : ''}`}>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.monto_total}
                    onChange={(e) => set('monto_total', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </Field>
              <Field label="Monto mensual">
                <div className="pl-input">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.monto_mensual}
                    onChange={(e) => set('monto_mensual', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </Field>
            </div>
            <Field label="Frecuencia de publicaciones">
              <Input
                value={form.frecuencia_publicaciones}
                onChange={(v) => set('frecuencia_publicaciones', v)}
                placeholder="Ej. 2 posts semanales"
              />
            </Field>
          </div>

          <div className="inf-form-section">
            <span className="inf-form-section-title">Adicional</span>
            <Field label="URL del documento">
              <Input
                value={form.documento_url}
                onChange={(v) => set('documento_url', v)}
                placeholder="https://…"
              />
            </Field>
            <Field label="Notas">
              <textarea
                className="pl-textarea"
                value={form.notas}
                onChange={(e) => set('notas', e.target.value)}
                placeholder="Observaciones adicionales…"
                rows={3}
              />
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
      </form>
    </>
  )
}
