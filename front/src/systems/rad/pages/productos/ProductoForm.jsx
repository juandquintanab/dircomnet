import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Field, Input, Button } from '../../../../components/primitives'
import SeccionEmisora from '../../components/producto/SeccionEmisora'
import SeccionComercializadoras from '../../components/producto/SeccionComercializadoras'
import SeccionLocutores from '../../components/producto/SeccionLocutores'
import SeccionHorarios from '../../components/producto/SeccionHorarios'
import SeccionDetalle from '../../components/producto/SeccionDetalle'
import SeccionSpot from '../../components/producto/SeccionSpot'
import { useProductoForm } from '../../hooks/useProductoForm'
import { productoService } from '../../services/productoService'
import './productos.css'

const TIPOS = [
  { value: 'programa', label: 'Programa' },
  { value: 'micro', label: 'Micro' },
  { value: 'programa_especial', label: 'Programa especial' },
  { value: 'rotativa', label: 'Rotativa' },
]

export default function ProductoForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const esEdicion = !!id

  const [productoInicial, setProductoInicial] = useState(null)
  const [cargando, setCargando] = useState(esEdicion)

  useEffect(() => {
    if (!esEdicion) return
    productoService.getById(id).then(({ data }) => {
      setProductoInicial(data)
      setCargando(false)
    })
  }, [id, esEdicion])

  if (cargando) {
    return <p className="body-m" style={{ padding: 'var(--space-8)', color: 'var(--fg-3)' }}>Cargando…</p>
  }

  return <FormularioInterno esEdicion={esEdicion} productoInicial={productoInicial} id={id} navigate={navigate} />
}

function FormularioInterno({ esEdicion, productoInicial, id, navigate }) {
  const {
    form,
    submitState,
    submitError,
    setField,
    setTipo,
    setDetalleField,
    setSpotField,
    agregarLocutor,
    quitarLocutor,
    setPrecioLocutor,
    agregarHorario,
    setHorarioField,
    quitarHorario,
    toggleComercializadora,
    crearEmisoraInline,
    crearLocutorInline,
    crearComercializadoraInline,
    submit,
  } = useProductoForm(productoInicial)

  const esRotativa = form.tipo_producto === 'rotativa'

  const precioLocutores = form.locutores.reduce(
    (acc, l) => acc + (Number(l.precio_locutor) || 0), 0
  )

  async function handleSubmit(e) {
    e.preventDefault()
    const result = await submit(esEdicion ? id : null)
    if (result.ok) {
      navigate(`/rad/productos/${result.id ?? id}`)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="rad-form-header">
        <span className="rad-form-header__titulo">
          {esEdicion ? 'Editar producto' : 'Nuevo producto'}
        </span>
        <Button variant="secondary" size="m" onClick={() => navigate(-1)} type="button">
          Cancelar
        </Button>
        <Button
          variant="primary"
          size="m"
          type="submit"
          disabled={submitState === 'loading'}
        >
          {submitState === 'loading' ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>

      <div className="pl-card" style={{ padding: '0 var(--space-6)' }}>

        {/* SECCIÓN 1 — Información básica */}
        <div className="rad-seccion">
          <span className="label-section">Información básica</span>
          <div className="rad-seccion__grid">
            <Field label="Tipo de producto">
              <select
                className="pl-select__btn"
                value={form.tipo_producto}
                onChange={(e) => setTipo(e.target.value)}
              >
                <option value="">Seleccionar tipo…</option>
                {TIPOS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Nombre del producto">
              <Input
                value={form.nombre_producto}
                onChange={setField('nombre_producto')}
                placeholder="Nombre único del producto"
              />
            </Field>

            <div className="rad-seccion__full">
              <Field label="Nota">
                <textarea
                  className="pl-input"
                  rows={2}
                  value={form.nota}
                  onChange={(e) => setField('nota')(e.target.value)}
                  placeholder="Observaciones opcionales…"
                />
              </Field>
            </div>
          </div>
        </div>

        {/* SECCIÓN 2 — Emisora */}
        <SeccionEmisora
          idEmisora={form.id_emisora}
          onChange={setField('id_emisora')}
          onCrearInline={crearEmisoraInline}
        />

        {/* SECCIÓN 3 — Comercializadoras */}
        <SeccionComercializadoras
          seleccionadas={form.comercializadoras}
          onToggle={toggleComercializadora}
          onCrearInline={crearComercializadoraInline}
        />

        {/* SECCIÓN 4 — Locutores */}
        <SeccionLocutores
          locutores={form.locutores}
          onAgregar={agregarLocutor}
          onQuitar={quitarLocutor}
          onPrecio={setPrecioLocutor}
          onCrearInline={crearLocutorInline}
        />

        {/* SECCIÓN 5 — Horarios */}
        <SeccionHorarios
          horarios={form.horarios}
          onAgregar={agregarHorario}
          onCampo={setHorarioField}
          onQuitar={quitarHorario}
        />

        {/* SECCIÓN 6 — Detalle condicionado por tipo */}
        {form.tipo_producto && !esRotativa && (
          <SeccionDetalle
            detalle={form.detalle}
            onChange={setDetalleField}
            precioLocutores={precioLocutores}
          />
        )}

        {form.tipo_producto && esRotativa && (
          <SeccionSpot
            spot={form.spot}
            onChange={setSpotField}
            precioLocutores={precioLocutores}
          />
        )}

        {submitError && (
          <p className="pl-field__hint is-error" style={{ padding: 'var(--space-4) 0' }}>
            {submitError}
          </p>
        )}
      </div>
    </form>
  )
}
