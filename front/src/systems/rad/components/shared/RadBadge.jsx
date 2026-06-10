const TIPO_CONFIG = {
  programa:          { label: 'Programa',  tone: 'blue' },
  micro:             { label: 'Micro',     tone: 'slate' },
  programa_especial: { label: 'Especial',  tone: 'yellow' },
  rotativa:          { label: 'Rotativa',  tone: 'green' },
}

export default function RadBadge({ tipo }) {
  const cfg = TIPO_CONFIG[tipo] ?? { label: tipo, tone: 'slate' }
  return (
    <span className={`pl-chip pl-chip--${cfg.tone}`}>{cfg.label}</span>
  )
}
