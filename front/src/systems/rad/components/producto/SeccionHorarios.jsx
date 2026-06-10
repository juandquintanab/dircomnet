import { Button, Field, Input } from '../../../../components/primitives'

export default function SeccionHorarios({ horarios, onAgregar, onCampo, onQuitar }) {
  return (
    <div className="rad-seccion">
      <span className="label-section">Horarios</span>

      {horarios.map((h, i) => (
        <div key={i} className="rad-horario-row">
          <Field label="Días">
            <Input
              value={h.dias}
              onChange={(v) => onCampo(i, 'dias', v)}
              placeholder="Ej. Lun–Vie"
            />
          </Field>
          <Field label="Desde">
            <input
              type="time"
              className="pl-input"
              value={h.hora_inicio}
              onChange={(e) => onCampo(i, 'hora_inicio', e.target.value)}
            />
          </Field>
          <Field label="Hasta">
            <input
              type="time"
              className="pl-input"
              value={h.hora_fin}
              onChange={(e) => onCampo(i, 'hora_fin', e.target.value)}
            />
          </Field>
          <Button
            variant="ghost"
            size="s"
            icon="trash"
            onClick={() => onQuitar(i)}
            type="button"
          />
        </div>
      ))}

      <Button
        variant="ghost"
        size="s"
        icon="plus"
        onClick={onAgregar}
        type="button"
        style={{ marginTop: 'var(--space-3)' }}
      >
        Agregar horario
      </Button>
    </div>
  )
}
