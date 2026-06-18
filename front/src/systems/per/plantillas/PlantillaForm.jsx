import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Field, Input, Chip, Icon } from '../../../components/primitives'
import { useBreadcrumbs } from '../../SystemLayout'
import {
  getPlantillaById,
  createPlantilla,
  updatePlantilla,
  sincronizarCamposPlantilla,
} from '../lib/perQueries'

const TIPOS_LISTA  = ['convocatoria', 'gifting', 'gira', 'otra']
const TIPOS_CAMPO  = [
  { value: 'texto',    label: 'Texto' },
  { value: 'select',   label: 'Selección' },
  { value: 'fecha',    label: 'Fecha' },
  { value: 'numero',   label: 'Número' },
  { value: 'checkbox', label: 'Casilla' },
]

const CAMPOS_PERSONA = [
  { tipo_persona: 'nombre',            etiqueta: 'Nombre' },
  { tipo_persona: 'cedula',            etiqueta: 'Cédula' },
  { tipo_persona: 'frecuencia',        etiqueta: 'Frecuencia' },
  { tipo_persona: 'correo_principal',  etiqueta: 'Correo principal' },
  { tipo_persona: 'telefono_principal', etiqueta: 'Teléfono principal' },
  { tipo_persona: 'medio_actual',      etiqueta: 'Medio actual' },
  { tipo_persona: 'tendencia',         etiqueta: 'Tendencia' },
  { tipo_persona: 'sentimiento_ep',    etiqueta: 'Sentimiento EP' },
  { tipo_persona: 'influencia',        etiqueta: 'Influencia' },
]

function campoVacío(override = {}) {
  return {
    _key:        crypto.randomUUID(),
    tipo_campo:  'texto',
    tipo_persona: null,
    etiqueta:    '',
    requerido:   false,
    orden:       0,
    opciones:    [],
    ...override,
  }
}

export default function PlantillaForm() {
  const { id } = useParams()
  const navigate  = useNavigate()
  const esEdicion = Boolean(id)

  const [nombre, setNombre]       = useState('')
  const [tipoLista, setTipoLista] = useState('')
  const [campos, setCampos]       = useState([])
  const [errores, setErrores]     = useState({})
  const [cargando, setCargando]   = useState(esEdicion)
  const [guardando, setGuardando] = useState(false)
  const [errorApi, setErrorApi]   = useState(null)

  useBreadcrumbs([
    { label: 'Plantillas', to: '/per/plantillas' },
    { label: esEdicion ? 'Editar plantilla' : 'Nueva plantilla' },
  ])

  // Drag-and-drop: índice fuente almacenado en ref para evitar re-renders
  const dragIndex  = useRef(null)
  const overIndex  = useRef(null)

  useEffect(() => {
    if (!esEdicion) return
    setCargando(true)
    getPlantillaById(id)
      .then((p) => {
        setNombre(p.nombre ?? '')
        setTipoLista(p.tipo_lista ?? '')
        setCampos(
          (p.campos_plantilla ?? [])
            .sort((a, b) => a.orden - b.orden)
            .map((c) => ({
              _key:        crypto.randomUUID(),
              tipo_campo:  c.tipo_campo,
              tipo_persona: c.tipo_persona || null,
              etiqueta:    c.etiqueta,
              requerido:   c.requerido ?? false,
              orden:       c.orden,
              opciones:    (c.opciones_campo ?? []).map((o) => o.valor),
            }))
        )
      })
      .catch((e) => setErrorApi(e.message))
      .finally(() => setCargando(false))
  }, [id, esEdicion])

  // ── Drag-and-drop helpers ──

  const handleDragStart = (i) => (e) => {
    dragIndex.current = i
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (i) => (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    overIndex.current = i
    // Forzar re-render del data-over attribute via DOM directamente
    document.querySelectorAll('[data-over="true"]').forEach((el) => el.removeAttribute('data-over'))
    e.currentTarget.setAttribute('data-over', 'true')
  }

  const handleDrop = (i) => (e) => {
    e.preventDefault()
    e.currentTarget.removeAttribute('data-over')
    const from = dragIndex.current
    if (from === null || from === i) return
    setCampos((prev) => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(i, 0, moved)
      return next.map((c, idx) => ({ ...c, orden: idx }))
    })
    dragIndex.current = null
    overIndex.current = null
  }

  const handleDragEnd = () => {
    document.querySelectorAll('[data-over="true"]').forEach((el) => el.removeAttribute('data-over'))
    dragIndex.current = null
  }

  // ── Gestión de campos ──

  const agregarCampoPersona = (tp) => {
    if (campos.some((c) => c.tipo_campo === 'persona' && c.tipo_persona === tp.tipo_persona)) return
    setCampos((prev) => [
      ...prev,
      campoVacío({ tipo_campo: 'persona', tipo_persona: tp.tipo_persona, etiqueta: tp.etiqueta, orden: prev.length }),
    ])
  }

  const agregarCampoPersonalizado = () => {
    setCampos((prev) => [...prev, campoVacío({ orden: prev.length })])
  }

  const actualizarCampo = (_key, campo, valor) => {
    setCampos((prev) => prev.map((c) => c._key === _key ? { ...c, [campo]: valor } : c))
  }

  const eliminarCampo = (_key) => {
    setCampos((prev) => prev.filter((c) => c._key !== _key).map((c, i) => ({ ...c, orden: i })))
  }

  // ── Guardar ──

  const validar = () => {
    const e = {}
    if (!nombre.trim()) e.nombre = 'El nombre es obligatorio'
    return e
  }

  const guardar = async (ev) => {
    ev.preventDefault()
    const e = validar()
    if (Object.keys(e).length) { setErrores(e); return }

    setGuardando(true)
    setErrorApi(null)
    try {
      let plantillaId = id
      if (esEdicion) {
        await updatePlantilla(id, nombre.trim(), tipoLista || null)
      } else {
        const nueva = await createPlantilla(nombre.trim(), tipoLista || null)
        plantillaId = nueva.id
      }
      await sincronizarCamposPlantilla(plantillaId, campos)
      navigate('/per/plantillas')
    } catch (err) {
      setErrorApi(err.message)
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) return <div className="per-loading">Cargando…</div>

  const tiposPersonaActivos = new Set(
    campos.filter((c) => c.tipo_campo === 'persona').map((c) => c.tipo_persona)
  )

  return (
    <>
      <div className="pl-page__head">
        <div className="pl-page__title">
          <h1>{esEdicion ? 'Editar plantilla' : 'Nueva plantilla'}</h1>
          <span className="meta"><b>PER</b> · Difusión y PR</span>
        </div>
      </div>

      <form onSubmit={guardar} noValidate>
        <div className="per-page-stack">

          {/* ── Datos de la plantilla ── */}
          <div className="pl-card per-form-card" style={{ padding: 'var(--space-6)' }}>
            <div className="per-form-section">
              <span className="per-form-section-title">Datos de la plantilla</span>
              <div className="pl-grid-2">
                <Field label="Nombre" error={errores.nombre}>
                  <Input
                    value={nombre}
                    onChange={(v) => { setNombre(v); if (errores.nombre) setErrores((e) => ({ ...e, nombre: null })) }}
                    placeholder="Ej. Plantilla convocatoria"
                    error={!!errores.nombre}
                  />
                </Field>
                <Field label="Tipo de lista">
                  <select
                    className="per-select-native"
                    value={tipoLista}
                    onChange={(e) => setTipoLista(e.target.value)}
                  >
                    <option value="">Sin tipo…</option>
                    {TIPOS_LISTA.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
              </div>
            </div>
          </div>

          {/* ── Campos de persona predefinidos ── */}
          <div className="pl-card per-form-card" style={{ padding: 'var(--space-6)' }}>
            <div className="per-form-section">
              <span className="per-form-section-title">Campos de persona</span>
              <p style={{ fontSize: 'var(--fs-body-s)', color: 'var(--slate-400)', margin: 0 }}>
                Selecciona los campos del periodista a incluir. Se leerán directamente de su perfil.
              </p>
              <div className="per-contact-chips">
                {CAMPOS_PERSONA.map((tp) => {
                  const activo = tiposPersonaActivos.has(tp.tipo_persona)
                  return activo ? (
                    <span key={tp.tipo_persona} className="pl-chip pl-chip--blue">
                      {tp.etiqueta}
                      <button
                        type="button"
                        className="pl-chip__x"
                        onClick={() => eliminarCampo(campos.find((c) => c.tipo_persona === tp.tipo_persona)?._key)}
                        aria-label={`Quitar ${tp.etiqueta}`}
                      >
                        <Icon name="x" size={11} />
                      </button>
                    </span>
                  ) : (
                    <button
                      key={tp.tipo_persona}
                      type="button"
                      className="pl-chip pl-chip--slate"
                      onClick={() => agregarCampoPersona(tp)}
                      style={{ cursor: 'pointer', border: '1px dashed var(--slate-300)', background: 'transparent' }}
                    >
                      + {tp.etiqueta}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ── Campos personalizados + reordenamiento ── */}
          <div className="pl-card per-form-card" style={{ padding: 'var(--space-6)' }}>
            <div className="per-form-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="per-form-section-title">
                  Todos los campos ({campos.length})
                </span>
                <Button type="button" variant="secondary" size="s" icon="plus" onClick={agregarCampoPersonalizado}>
                  Campo personalizado
                </Button>
              </div>

              {campos.length === 0 && (
                <p style={{ fontSize: 'var(--fs-body-s)', color: 'var(--slate-400)' }}>
                  Sin campos. Agrega campos de persona o personalizados.
                </p>
              )}

              {/* Cabecera */}
              {campos.length > 0 && (
                <div className="per-campo-row" style={{ paddingBottom: 'var(--space-2)', borderBottom: '2px solid var(--border-default)' }}>
                  <div />
                  <span className="label-field">Etiqueta</span>
                  <span className="label-field">Tipo</span>
                  <span className="label-field" style={{ textAlign: 'center' }}>Req.</span>
                  <div />
                </div>
              )}

              {campos.map((campo, i) => (
                <div
                  key={campo._key}
                  className="per-campo-row"
                  draggable
                  onDragStart={handleDragStart(i)}
                  onDragOver={handleDragOver(i)}
                  onDrop={handleDrop(i)}
                  onDragEnd={handleDragEnd}
                >
                  {/* Handle */}
                  <div className="per-campo-handle" title="Arrastrar para reordenar">
                    ⋮⋮
                  </div>

                  {/* Etiqueta */}
                  <div>
                    <input
                      className="pl-input"
                      style={{ display: 'block', width: '100%' }}
                      value={campo.etiqueta}
                      onChange={(e) => actualizarCampo(campo._key, 'etiqueta', e.target.value)}
                      placeholder={campo.tipo_campo === 'persona' ? 'Etiqueta (opcional)' : 'Nombre del campo'}
                    />
                    {/* Opciones para campos tipo select */}
                    {campo.tipo_campo === 'select' && (
                      <div style={{ marginTop: 'var(--space-2)' }}>
                        <input
                          className="pl-input"
                          style={{ display: 'block', width: '100%', fontSize: 'var(--fs-body-xs)' }}
                          value={campo.opciones.join(', ')}
                          onChange={(e) =>
                            actualizarCampo(
                              campo._key,
                              'opciones',
                              e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                            )
                          }
                          placeholder="Opciones separadas por comas: Sí, No, Tal vez"
                        />
                      </div>
                    )}
                  </div>

                  {/* Tipo */}
                  <div>
                    {campo.tipo_campo === 'persona' ? (
                      <Chip tone="blue">{campo.tipo_persona}</Chip>
                    ) : (
                      <select
                        className="per-select-native"
                        value={campo.tipo_campo}
                        onChange={(e) => actualizarCampo(campo._key, 'tipo_campo', e.target.value)}
                        style={{ fontSize: 'var(--fs-body-s)' }}
                      >
                        {TIPOS_CAMPO.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    )}
                  </div>

                  {/* Requerido */}
                  <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12 }}>
                    <input
                      type="checkbox"
                      checked={campo.requerido}
                      onChange={(e) => actualizarCampo(campo._key, 'requerido', e.target.checked)}
                    />
                  </div>

                  {/* Eliminar */}
                  <div style={{ paddingTop: 8 }}>
                    <button
                      type="button"
                      className="pl-btn pl-btn--ghost pl-btn--s"
                      onClick={() => eliminarCampo(campo._key)}
                      aria-label="Eliminar campo"
                    >
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
