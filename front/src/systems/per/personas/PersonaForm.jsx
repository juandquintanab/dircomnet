import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Field, Input, Select, Icon, EmptyDash } from '../../../components/primitives'
import { useBreadcrumbs } from '../../SystemLayout'
import {
  getPersonaById,
  createPersona,
  updatePersona,
  sincronizarRelacionesPersona,
  getMedios,
  getStakeholders,
  getFuentes,
  getTiposPr,
} from '../lib/perQueries'

const FRECUENCIA_OPTS = ['alta', 'media', 'baja', 'ocasional']
const PLATAFORMAS     = ['Instagram', 'X', 'Facebook', 'LinkedIn', 'YouTube', 'TikTok', 'Otra']

const FORM_VACÍO = {
  nombre: '', cedula: '', frecuencia: '',
  tendencia: '', sentimiento_ep: '',
  influencia: '', contacto: '', respuesta: '', compromiso: '', engagement: '',
}

/* ── Subcomponente: selector de catálogo con chips removibles ── */
function CatalogoPicker({ label, catalogoItems, seleccionados, onAdd, onRemove }) {
  const disponibles = catalogoItems.filter(
    (item) => !seleccionados.some((s) => s.id === item.id)
  )
  return (
    <div className="per-form-section">
      <span className="per-form-section-title">{label}</span>
      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <select
            className="per-select-native"
            value=""
            onChange={(e) => {
              if (!e.target.value) return
              const item = catalogoItems.find((i) => String(i.id) === e.target.value)
              if (item) { onAdd(item); e.target.value = '' }
            }}
          >
            <option value="">Agregar {label.toLowerCase()}…</option>
            {disponibles.map((item) => (
              <option key={item.id} value={item.id}>{item.nombre}</option>
            ))}
          </select>
        </div>
      </div>
      {seleccionados.length > 0 && (
        <div className="per-contact-chips" style={{ marginTop: 'var(--space-2)' }}>
          {seleccionados.map((s) => (
            <span key={s.id} className="pl-chip pl-chip--blue">
              {s.nombre}
              <button
                type="button"
                className="pl-chip__x"
                onClick={() => onRemove(s.id)}
                aria-label={`Quitar ${s.nombre}`}
              >
                <Icon name="x" size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Subcomponente: fila dinámica genérica ── */
function FilaDinamica({ children, onEliminar }) {
  return (
    <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end' }}>
      <div style={{ flex: 1 }}>{children}</div>
      <button
        type="button"
        className="pl-btn pl-btn--destructive pl-btn--s"
        onClick={onEliminar}
        style={{ minHeight: 40, padding: '0 var(--space-3)' }}
        aria-label="Eliminar"
      >
        <Icon name="trash" size={14} />
      </button>
    </div>
  )
}

export default function PersonaForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const esEdicion = Boolean(id)

  const [form, setForm]       = useState(FORM_VACÍO)
  const [errores, setErrores] = useState({})
  const [cargando, setCargando]   = useState(esEdicion)
  const [guardando, setGuardando] = useState(false)
  const [errorApi, setErrorApi]   = useState(null)

  useBreadcrumbs([
    { label: 'Directorio de personas', to: '/per/personas' },
    { label: esEdicion ? 'Editar persona' : 'Nueva persona' },
  ])

  // Listas dinámicas
  const [correos, setCorreos]     = useState([])   // { _key, direccion, es_principal }
  const [telefonos, setTelefonos] = useState([])   // { _key, numero, es_principal }
  const [redes, setRedes]         = useState([])   // { _key, tipo_cuenta, nombre_usuario }

  // Catálogos — seleccionados
  const [mediosSel, setMediosSel]             = useState([])   // { id, nombre }
  const [stakeholdersSel, setStakeholdersSel] = useState([])
  const [fuentesSel, setFuentesSel]           = useState([])
  const [tiposPrSel, setTiposPrSel]           = useState([])

  // Catálogos — disponibles
  const [catalogos, setCatalogos] = useState({
    medios: [], stakeholders: [], fuentes: [], tiposPr: [],
  })

  useEffect(() => {
    Promise.all([getMedios(), getStakeholders(), getFuentes(), getTiposPr()])
      .then(([medios, stakeholders, fuentes, tiposPr]) =>
        setCatalogos({ medios, stakeholders, fuentes, tiposPr })
      )
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!esEdicion) return
    setCargando(true)
    getPersonaById(id)
      .then((p) => {
        setForm({
          nombre:       p.nombre       ?? '',
          cedula:       p.cedula       ?? '',
          frecuencia:   p.frecuencia   ?? '',
          tendencia:    p.tendencia    ?? '',
          sentimiento_ep: p.sentimiento_ep ?? '',
          influencia:   p.influencia   != null ? String(p.influencia) : '',
          contacto:     p.contacto     != null ? String(p.contacto)   : '',
          respuesta:    p.respuesta    != null ? String(p.respuesta)   : '',
          compromiso:   p.compromiso   != null ? String(p.compromiso)  : '',
          engagement:   p.engagement   != null ? String(p.engagement)  : '',
        })
        setCorreos(
          (p.correos ?? []).map((c) => ({
            _key: crypto.randomUUID(), direccion: c.direccion ?? '', es_principal: c.es_principal ?? false,
          }))
        )
        setTelefonos(
          (p.telefonos ?? []).map((t) => ({
            _key: crypto.randomUUID(), numero: t.numero ?? '', es_principal: t.es_principal ?? false,
          }))
        )
        setRedes(
          (p.redes_sociales ?? []).map((r) => ({
            _key: crypto.randomUUID(), tipo_cuenta: r.tipo_cuenta ?? '', nombre_usuario: r.nombre_usuario ?? '',
          }))
        )
        setMediosSel(
          (p.persona_medios ?? []).map((pm) => ({ id: pm.medios.id, nombre: pm.medios.nombre }))
        )
        setStakeholdersSel(
          (p.persona_stakeholders ?? []).map((ps) => ({ id: ps.stakeholders.id, nombre: ps.stakeholders.nombre }))
        )
        setFuentesSel(
          (p.persona_fuentes ?? []).map((pf) => ({ id: pf.fuentes.id, nombre: pf.fuentes.nombre }))
        )
        setTiposPrSel(
          (p.persona_tipos_pr ?? []).map((pt) => ({ id: pt.tipos_pr.id, nombre: pt.tipos_pr.nombre }))
        )
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

  // ── Helpers para listas dinámicas ──

  const agregarCorreo = () =>
    setCorreos((prev) => [...prev, { _key: crypto.randomUUID(), direccion: '', es_principal: prev.length === 0 }])

  const actualizarCorreo = (_key, campo, valor) =>
    setCorreos((prev) => prev.map((c) => c._key === _key ? { ...c, [campo]: valor } : c))

  const eliminarCorreo = (_key) =>
    setCorreos((prev) => prev.filter((c) => c._key !== _key))

  const marcarPrincipalCorreo = (_key) =>
    setCorreos((prev) => prev.map((c) => ({ ...c, es_principal: c._key === _key })))

  const agregarTelefono = () =>
    setTelefonos((prev) => [...prev, { _key: crypto.randomUUID(), numero: '', es_principal: prev.length === 0 }])

  const actualizarTelefono = (_key, campo, valor) =>
    setTelefonos((prev) => prev.map((t) => t._key === _key ? { ...t, [campo]: valor } : t))

  const eliminarTelefono = (_key) =>
    setTelefonos((prev) => prev.filter((t) => t._key !== _key))

  const marcarPrincipalTelefono = (_key) =>
    setTelefonos((prev) => prev.map((t) => ({ ...t, es_principal: t._key === _key })))

  const agregarRed = () =>
    setRedes((prev) => [...prev, { _key: crypto.randomUUID(), tipo_cuenta: '', nombre_usuario: '' }])

  const actualizarRed = (_key, campo, valor) =>
    setRedes((prev) => prev.map((r) => r._key === _key ? { ...r, [campo]: valor } : r))

  const eliminarRed = (_key) =>
    setRedes((prev) => prev.filter((r) => r._key !== _key))

  // ── Guardar ──

  const guardar = async (ev) => {
    ev.preventDefault()
    const e = validar()
    if (Object.keys(e).length) { setErrores(e); return }

    const toNum = (v) => (v.trim() !== '' ? Number(v) : null)

    const payload = {
      nombre:         form.nombre.trim(),
      cedula:         form.cedula.trim()         || null,
      frecuencia:     form.frecuencia            || null,
      tendencia:      form.tendencia.trim()      || null,
      sentimiento_ep: form.sentimiento_ep.trim() || null,
      influencia:     toNum(form.influencia),
      contacto:       toNum(form.contacto),
      respuesta:      toNum(form.respuesta),
      compromiso:     toNum(form.compromiso),
      engagement:     toNum(form.engagement),
    }

    setGuardando(true)
    setErrorApi(null)

    try {
      let personaId = id
      if (esEdicion) {
        await updatePersona(id, payload)
      } else {
        const nueva = await createPersona(payload)
        personaId = nueva.id
      }

      await sincronizarRelacionesPersona(personaId, {
        correos:       correos.map(({ direccion, es_principal }) => ({ direccion, es_principal })),
        telefonos:     telefonos.map(({ numero, es_principal }) => ({ numero, es_principal })),
        redes_sociales: redes.map(({ tipo_cuenta, nombre_usuario }) => ({ tipo_cuenta, nombre_usuario })),
        medios:        mediosSel,
        stakeholders:  stakeholdersSel,
        fuentes:       fuentesSel,
        tipos_pr:      tiposPrSel,
      })

      navigate(`/per/personas/${personaId}`)
    } catch (err) {
      setErrorApi(err.message)
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) return <div className="per-loading">Cargando…</div>

  return (
    <>
      <div className="pl-page__head">
        <div className="pl-page__title">
          <h1>{esEdicion ? 'Editar periodista' : 'Nuevo periodista'}</h1>
          <span className="meta"><b>PER</b> · Difusión y PR</span>
        </div>
      </div>

      <form onSubmit={guardar} noValidate>
        <div className="per-page-stack">

          {/* ── Datos personales ── */}
          <div className="pl-card per-form-card" style={{ padding: 'var(--space-6)' }}>
            <div className="per-form-section">
              <span className="per-form-section-title">Datos personales</span>
              <div className="pl-grid-2">
                <Field label="Nombre" error={errores.nombre}>
                  <Input
                    value={form.nombre}
                    onChange={(v) => set('nombre', v)}
                    placeholder="Nombre completo"
                    error={!!errores.nombre}
                  />
                </Field>
                <Field label="Cédula">
                  <Input
                    value={form.cedula}
                    onChange={(v) => set('cedula', v)}
                    placeholder="Ej. V-12345678"
                  />
                </Field>
              </div>
              <div style={{ maxWidth: 220 }}>
                <Field label="Frecuencia de contacto">
                  <Select
                    value={form.frecuencia}
                    onChange={(v) => set('frecuencia', v)}
                    options={FRECUENCIA_OPTS}
                    placeholder="Seleccionar"
                  />
                </Field>
              </div>
            </div>

            {/* ── Métricas ── */}
            <div className="per-form-section">
              <span className="per-form-section-title">Métricas</span>
              <div className="pl-grid-3">
                <Field label="Tendencia">
                  <Input value={form.tendencia} onChange={(v) => set('tendencia', v)} placeholder="Ej. alta" />
                </Field>
                <Field label="Sentimiento EP">
                  <Input value={form.sentimiento_ep} onChange={(v) => set('sentimiento_ep', v)} placeholder="Ej. positivo" />
                </Field>
                <Field label="Influencia">
                  <Input value={form.influencia} onChange={(v) => set('influencia', v.replace(/[^\d.]/g, ''))} placeholder="0 – 10" />
                </Field>
                <Field label="Contacto">
                  <Input value={form.contacto} onChange={(v) => set('contacto', v.replace(/[^\d.]/g, ''))} placeholder="0 – 10" />
                </Field>
                <Field label="Respuesta">
                  <Input value={form.respuesta} onChange={(v) => set('respuesta', v.replace(/[^\d.]/g, ''))} placeholder="0 – 10" />
                </Field>
                <Field label="Compromiso">
                  <Input value={form.compromiso} onChange={(v) => set('compromiso', v.replace(/[^\d.]/g, ''))} placeholder="0 – 10" />
                </Field>
                <Field label="Engagement">
                  <Input value={form.engagement} onChange={(v) => set('engagement', v.replace(/[^\d.]/g, ''))} placeholder="0 – 10" />
                </Field>
              </div>
            </div>
          </div>

          {/* ── Correos ── */}
          <div className="pl-card per-form-card" style={{ padding: 'var(--space-6)' }}>
            <div className="per-form-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="per-form-section-title">Correos</span>
                <Button variant="secondary" size="s" icon="plus" onClick={agregarCorreo} type="button">
                  Agregar
                </Button>
              </div>
              {correos.length === 0 && (
                <p style={{ fontSize: 'var(--fs-body-s)', color: 'var(--slate-400)' }}>Sin correos registrados</p>
              )}
              {correos.map((c) => (
                <FilaDinamica key={c._key} onEliminar={() => eliminarCorreo(c._key)}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 'var(--space-3)', alignItems: 'flex-end' }}>
                    <Field label="Dirección">
                      <Input
                        value={c.direccion}
                        onChange={(v) => actualizarCorreo(c._key, 'direccion', v)}
                        placeholder="correo@ejemplo.com"
                      />
                    </Field>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)', cursor: 'pointer', fontSize: 'var(--fs-body-s)', color: 'var(--slate-700)', whiteSpace: 'nowrap' }}>
                      <input
                        type="checkbox"
                        checked={c.es_principal}
                        onChange={() => marcarPrincipalCorreo(c._key)}
                      />
                      Principal
                    </label>
                  </div>
                </FilaDinamica>
              ))}
            </div>
          </div>

          {/* ── Teléfonos ── */}
          <div className="pl-card per-form-card" style={{ padding: 'var(--space-6)' }}>
            <div className="per-form-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="per-form-section-title">Teléfonos</span>
                <Button variant="secondary" size="s" icon="plus" onClick={agregarTelefono} type="button">
                  Agregar
                </Button>
              </div>
              {telefonos.length === 0 && (
                <p style={{ fontSize: 'var(--fs-body-s)', color: 'var(--slate-400)' }}>Sin teléfonos registrados</p>
              )}
              {telefonos.map((t) => (
                <FilaDinamica key={t._key} onEliminar={() => eliminarTelefono(t._key)}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 'var(--space-3)', alignItems: 'flex-end' }}>
                    <Field label="Número">
                      <Input
                        value={t.numero}
                        onChange={(v) => actualizarTelefono(t._key, 'numero', v)}
                        placeholder="Ej. 0414-1234567"
                      />
                    </Field>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)', cursor: 'pointer', fontSize: 'var(--fs-body-s)', color: 'var(--slate-700)', whiteSpace: 'nowrap' }}>
                      <input
                        type="checkbox"
                        checked={t.es_principal}
                        onChange={() => marcarPrincipalTelefono(t._key)}
                      />
                      Principal
                    </label>
                  </div>
                </FilaDinamica>
              ))}
            </div>
          </div>

          {/* ── Redes sociales ── */}
          <div className="pl-card per-form-card" style={{ padding: 'var(--space-6)' }}>
            <div className="per-form-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="per-form-section-title">Redes sociales</span>
                <Button variant="secondary" size="s" icon="plus" onClick={agregarRed} type="button">
                  Agregar
                </Button>
              </div>
              {redes.length === 0 && (
                <p style={{ fontSize: 'var(--fs-body-s)', color: 'var(--slate-400)' }}>Sin redes sociales registradas</p>
              )}
              {redes.map((r) => (
                <FilaDinamica key={r._key} onEliminar={() => eliminarRed(r._key)}>
                  <div className="pl-grid-2">
                    <Field label="Plataforma">
                      <select
                        className="per-select-native"
                        value={r.tipo_cuenta}
                        onChange={(e) => actualizarRed(r._key, 'tipo_cuenta', e.target.value)}
                      >
                        <option value="">Seleccionar…</option>
                        {PLATAFORMAS.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </Field>
                    <Field label="Usuario / Handle">
                      <Input
                        value={r.nombre_usuario}
                        onChange={(v) => actualizarRed(r._key, 'nombre_usuario', v)}
                        placeholder="@usuario"
                      />
                    </Field>
                  </div>
                </FilaDinamica>
              ))}
            </div>
          </div>

          {/* ── Catálogos ── */}
          <div className="pl-card per-form-card" style={{ padding: 'var(--space-6)' }}>
            <CatalogoPicker
              label="Medios"
              catalogoItems={catalogos.medios}
              seleccionados={mediosSel}
              onAdd={(item) => setMediosSel((prev) => [...prev, item])}
              onRemove={(itemId) => setMediosSel((prev) => prev.filter((s) => s.id !== itemId))}
            />
            <CatalogoPicker
              label="Stakeholders"
              catalogoItems={catalogos.stakeholders}
              seleccionados={stakeholdersSel}
              onAdd={(item) => setStakeholdersSel((prev) => [...prev, item])}
              onRemove={(itemId) => setStakeholdersSel((prev) => prev.filter((s) => s.id !== itemId))}
            />
            <CatalogoPicker
              label="Fuentes"
              catalogoItems={catalogos.fuentes}
              seleccionados={fuentesSel}
              onAdd={(item) => setFuentesSel((prev) => [...prev, item])}
              onRemove={(itemId) => setFuentesSel((prev) => prev.filter((s) => s.id !== itemId))}
            />
            <CatalogoPicker
              label="Tipos PR"
              catalogoItems={catalogos.tiposPr}
              seleccionados={tiposPrSel}
              onAdd={(item) => setTiposPrSel((prev) => [...prev, item])}
              onRemove={(itemId) => setTiposPrSel((prev) => prev.filter((s) => s.id !== itemId))}
            />
          </div>

          {errorApi && <div className="per-error" style={{ padding: 0 }}>{errorApi}</div>}

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
