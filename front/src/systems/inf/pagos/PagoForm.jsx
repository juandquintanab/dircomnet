import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Field, Input } from '../../../components/primitives'
import { getPagoById, createPago, updatePago } from '../lib/infQueries'

const FORM_VACÍO = {
  fecha_pago: '',
  monto: '',
  periodo_cubierto: '',
  notas: '',
}

export default function PagoForm() {
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
    getPagoById(id)
      .then((p) => {
        setForm({
          fecha_pago: p.fecha_pago ?? '',
          monto: p.monto != null ? String(p.monto) : '',
          periodo_cubierto: p.periodo_cubierto ?? '',
          notas: p.notas ?? '',
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
    if (!form.fecha_pago) e.fecha_pago = 'Obligatorio'
    if (!form.monto) e.monto = 'Obligatorio'
    return e
  }

  const guardar = async (ev) => {
    ev.preventDefault()
    const e = validar()
    if (Object.keys(e).length) { setErrores(e); return }

    const payload = {
      contrato_id: contratoId,
      fecha_pago: form.fecha_pago,
      monto: parseFloat(form.monto),
      periodo_cubierto: form.periodo_cubierto.trim() || null,
      notas: form.notas.trim() || null,
    }

    setGuardando(true)
    setErrorApi(null)
    try {
      if (esEdicion) {
        await updatePago(id, payload)
      } else {
        await createPago(payload)
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
          <h1>{esEdicion ? 'Editar pago' : 'Registrar pago'}</h1>
          <span className="meta"><b>INF</b> · Medios Pagos</span>
        </div>
      </div>

      <form onSubmit={guardar} noValidate>
        <div className="pl-card inf-form-card" style={{ padding: 'var(--space-6)', maxWidth: '560px' }}>
          <div className="pl-stack">
            <div className="pl-grid-2">
              <Field label="Fecha de pago" error={errores.fecha_pago}>
                <div className={`pl-input${errores.fecha_pago ? ' is-error' : ''}`}>
                  <input
                    type="date"
                    value={form.fecha_pago}
                    onChange={(e) => set('fecha_pago', e.target.value)}
                  />
                </div>
              </Field>
              <Field label="Monto" error={errores.monto}>
                <div className={`pl-input${errores.monto ? ' is-error' : ''}`}>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.monto}
                    onChange={(e) => set('monto', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </Field>
            </div>

            <Field label="Período cubierto">
              <Input
                value={form.periodo_cubierto}
                onChange={(v) => set('periodo_cubierto', v)}
                placeholder="Ej. Enero 2026"
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
