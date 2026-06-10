import { Field, Input } from '../../../../components/primitives'
import ProductoMetricas from './ProductoMetricas'
import { useMetricas } from '../../hooks/useMetricas'

const ESTRATOS = ['1', '2', '3', '4', '5', '6']
const TONOS = ['Informativo', 'Inspirador', 'Divertido', 'Serio']
const PARTICIPACIONES = ['Entrevista', 'Mención', 'Patrocinio', 'Live']

function RadSelect({ value, onChange, options, placeholder }) {
  return (
    <select
      className="pl-select__btn"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  )
}

function PreviewPrecio({ precioGuardado, descuentoAplicado }) {
  const { precioMercado, ahorro } = useMetricas(precioGuardado, descuentoAplicado)
  const desc = Number(descuentoAplicado) || 0
  const fmt = (n) =>
    Number(n).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div
      className="pl-info"
      style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-6)', padding: 'var(--space-4) var(--space-5)' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        <span className="label-field">Mercado</span>
        <span style={{ fontWeight: 'var(--fw-semi)', color: 'var(--fg-1)' }}>
          Bs. {fmt(precioMercado)}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        <span className="label-field">Ahorro</span>
        <span style={{ fontWeight: 'var(--fw-semi)', color: 'var(--status-success)' }}>
          Bs. {fmt(ahorro)}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        <span className="label-field">Desc.</span>
        <span style={{ fontWeight: 'var(--fw-semi)', color: 'var(--fg-2)' }}>
          {desc > 0 ? `${desc}%` : '—'}
        </span>
      </div>
    </div>
  )
}

export default function SeccionDetalle({ detalle, onChange, precioLocutores }) {
  const set = (key) => (val) => onChange(key)(val)

  return (
    <div className="rad-seccion">
      <span className="label-section">Detalle del producto</span>

      <div className="rad-seccion__grid">

        {/* Sinopsis — ancho completo */}
        <div className="rad-seccion__full">
          <Field label="Sinopsis">
            <textarea
              className="pl-input"
              rows={3}
              value={detalle.sinopsis}
              onChange={(e) => set('sinopsis')(e.target.value)}
              placeholder="Descripción del programa…"
            />
          </Field>
        </div>

        {/* Precio + descuento */}
        <Field label="Precio guardado *">
          <Input
            value={detalle.precio_guardado}
            onChange={set('precio_guardado')}
            placeholder="0.00"
          />
        </Field>

        <Field label="Descuento aplicado (%)">
          <Input
            value={detalle.descuento_aplicado}
            onChange={set('descuento_aplicado')}
            placeholder="0"
          />
        </Field>

        {/* Preview de métricas junto a precio/descuento */}
        <div className="rad-seccion__full">
          <PreviewPrecio
            precioGuardado={detalle.precio_guardado}
            descuentoAplicado={detalle.descuento_aplicado}
          />
        </div>

        {/* Clasificadores */}
        <Field label="Participación">
          <RadSelect
            value={detalle.participacion}
            onChange={set('participacion')}
            options={PARTICIPACIONES}
            placeholder="Seleccionar…"
          />
        </Field>

        <Field label="Tono">
          <RadSelect
            value={detalle.tono}
            onChange={set('tono')}
            options={TONOS}
            placeholder="Seleccionar…"
          />
        </Field>

        <Field label="Edad">
          <Input
            value={detalle.edad}
            onChange={set('edad')}
            placeholder="Ej. 25–45"
          />
        </Field>

        <Field label="Género">
          <Input
            value={detalle.genero}
            onChange={set('genero')}
            placeholder="Ej. Mixto"
          />
        </Field>

        <Field label="Estrato">
          <RadSelect
            value={detalle.estrato}
            onChange={set('estrato')}
            options={ESTRATOS}
            placeholder="Seleccionar…"
          />
        </Field>

      </div>

      {/* Resumen completo con locutores al pie de la sección */}
      <ProductoMetricas
        precioGuardado={detalle.precio_guardado}
        descuentoAplicado={detalle.descuento_aplicado}
        precioLocutores={precioLocutores}
      />
    </div>
  )
}
