import { useState } from 'react'
import { Button, Input } from '../../../../components/primitives'
import { useComercializadoras } from '../../hooks/useComercializadoras'

export default function SeccionComercializadoras({
  seleccionadas,
  onToggle,
  onCrearInline,
}) {
  const { data: coms, refetch } = useComercializadoras()
  const [creando, setCreando] = useState(false)
  const [nombre, setNombre] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleCrear() {
    if (!nombre.trim()) { setError('Nombre obligatorio'); return }
    setSaving(true)
    setError(null)
    try {
      const id = await onCrearInline(nombre.trim())
      await refetch()
      onToggle(id)
      setCreando(false)
      setNombre('')
    } catch (e) {
      setError(e.message)
    }
    setSaving(false)
  }

  return (
    <div className="rad-seccion">
      <span className="label-section">Comercializadoras</span>

      <div className="rad-com-chips">
        {coms.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`pl-chip ${seleccionadas.includes(c.id) ? 'pl-chip--blue' : 'pl-chip--slate'}`}
            onClick={() => onToggle(c.id)}
          >
            {c.nombre_comercializadora}
          </button>
        ))}
      </div>

      {!creando && (
        <button
          type="button"
          className="pl-btn pl-btn--ghost pl-btn--s"
          style={{ marginTop: 'var(--space-3)' }}
          onClick={() => setCreando(true)}
        >
          + Nueva comercializadora
        </button>
      )}

      {creando && (
        <div className="rad-seccion__inline pl-info" style={{ marginTop: 'var(--space-3)' }}>
          <Input
            value={nombre}
            onChange={setNombre}
            placeholder="Nombre de la comercializadora"
          />
          {error && <p className="pl-field__hint is-error">{error}</p>}
          <div className="pl-row" style={{ marginTop: 'var(--space-3)' }}>
            <Button variant="secondary" size="s" onClick={() => setCreando(false)} type="button">Cancelar</Button>
            <Button variant="primary" size="s" onClick={handleCrear} type="button" disabled={saving}>
              {saving ? 'Creando…' : 'Crear y agregar'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
