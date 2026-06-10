import { Field, Input, Select } from '../../../../components/primitives'
import { useEmisoras } from '../../hooks/useEmisoras'
import { useComercializadoras } from '../../hooks/useComercializadoras'
import { useLocutores } from '../../hooks/useLocutores'

const TIPOS = ['programa', 'micro', 'programa_especial', 'rotativa']
const TIPO_LABELS = {
  programa: 'Programa',
  micro: 'Micro',
  programa_especial: 'Especial',
  rotativa: 'Rotativa',
}

export default function ProductoFiltros({ filtros, onChange, onLimpiar }) {
  const { data: emisoras } = useEmisoras()
  const { data: coms } = useComercializadoras()
  const { data: locutores } = useLocutores()

  const set = (key) => (val) => onChange({ ...filtros, [key]: val || undefined })

  return (
    <div className="rad-filtros pl-card" style={{ padding: 'var(--space-5)' }}>
      <div className="rad-filtros__grid">
        <Field label="Buscar">
          <Input
            value={filtros.busqueda ?? ''}
            onChange={set('busqueda')}
            placeholder="Nombre del producto…"
            leadingIcon="search"
          />
        </Field>

        <Field label="Tipo">
          <Select
            value={filtros.tipo ?? ''}
            onChange={set('tipo')}
            placeholder="Todos"
            options={TIPOS.map((t) => TIPO_LABELS[t])}
            optionValues={TIPOS}
          />
        </Field>

        <Field label="Emisora">
          <Select
            value={filtros.id_emisora ?? ''}
            onChange={set('id_emisora')}
            placeholder="Todas"
            options={emisoras.map((e) => e.nombre_emisora)}
            optionValues={emisoras.map((e) => e.id)}
          />
        </Field>

        <Field label="Comercializadora">
          <Select
            value={filtros.id_comercializadora ?? ''}
            onChange={set('id_comercializadora')}
            placeholder="Todas"
            options={coms.map((c) => c.nombre_comercializadora)}
            optionValues={coms.map((c) => c.id)}
          />
        </Field>

        <Field label="Locutor">
          <Select
            value={filtros.id_locutor ?? ''}
            onChange={set('id_locutor')}
            placeholder="Todos"
            options={locutores.map((l) => l.nombre_locutor)}
            optionValues={locutores.map((l) => l.id)}
          />
        </Field>

        <Field label="Precio mín.">
          <Input
            value={filtros.precio_min ?? ''}
            onChange={set('precio_min')}
            placeholder="0"
          />
        </Field>

        <Field label="Precio máx.">
          <Input
            value={filtros.precio_max ?? ''}
            onChange={set('precio_max')}
            placeholder="Sin límite"
          />
        </Field>
      </div>

      <button className="pl-btn pl-btn--ghost pl-btn--s rad-filtros__limpiar" onClick={onLimpiar}>
        Limpiar filtros
      </button>
    </div>
  )
}
