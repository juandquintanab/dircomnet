import { Field, Input } from '../../../../components/primitives'
import ProductoMetricas from './ProductoMetricas'

export default function SeccionSpot({ spot, onChange, precioLocutores }) {
  const set = (key) => (val) => onChange(key)(val)

  return (
    <div className="rad-seccion">
      <span className="label-section">Detalle del spot</span>

      <div className="rad-seccion__grid">
        <Field label="Duración (segundos)">
          <Input
            value={spot.duracion_segundos}
            onChange={set('duracion_segundos')}
            placeholder="Ej. 30"
          />
        </Field>

        <Field label="Precio base (Bs.)">
          <Input
            value={spot.precio_guardado}
            onChange={set('precio_guardado')}
            placeholder="0.00"
          />
        </Field>

        <Field label="Descuento (%)">
          <Input
            value={spot.descuento_aplicado}
            onChange={set('descuento_aplicado')}
            placeholder="0"
          />
        </Field>
      </div>

      <ProductoMetricas
        precioGuardado={spot.precio_guardado}
        descuentoAplicado={spot.descuento_aplicado}
        precioLocutores={precioLocutores}
      />
    </div>
  )
}
