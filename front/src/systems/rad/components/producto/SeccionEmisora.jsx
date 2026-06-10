import { useState } from 'react'
import { Field, Input, Button } from '../../../../components/primitives'
import { useEmisoras } from '../../hooks/useEmisoras'
import { useLugares } from '../../hooks/useLugares'

export default function SeccionEmisora({ idEmisora, onChange, onCrearInline }) {
  const { data: emisoras, refetch } = useEmisoras()
  const { data: lugares } = useLugares()
  const [creando, setCreando] = useState(false)
  const [nuevaEmisora, setNuevaEmisora] = useState({ nombre_emisora: '', id_lugar: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const seleccionada = emisoras.find((e) => e.id === idEmisora)

  async function handleCrear() {
    if (!nuevaEmisora.nombre_emisora.trim()) { setError('Nombre obligatorio'); return }
    setSaving(true)
    setError(null)
    try {
      const id = await onCrearInline(nuevaEmisora)
      await refetch()
      onChange(id)
      setCreando(false)
      setNuevaEmisora({ nombre_emisora: '', id_lugar: '' })
    } catch (e) {
      setError(e.message)
    }
    setSaving(false)
  }

  return (
    <div className="rad-seccion">
      <span className="label-section">Emisora</span>

      <Field label="Emisora">
        <select
          className="pl-select__btn"
          value={idEmisora}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Seleccionar emisora…</option>
          {emisoras.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nombre_emisora}
              {e.rad_lugar ? ` — ${e.rad_lugar.nombre_ciudad}` : ''}
            </option>
          ))}
        </select>
      </Field>

      {!creando && (
        <button
          type="button"
          className="pl-btn pl-btn--ghost pl-btn--s"
          onClick={() => setCreando(true)}
        >
          + Crear nueva emisora
        </button>
      )}

      {creando && (
        <div className="rad-seccion__inline pl-info">
          <span className="label-field">Nueva emisora</span>
          <Field label="Nombre">
            <Input
              value={nuevaEmisora.nombre_emisora}
              onChange={(v) => setNuevaEmisora((f) => ({ ...f, nombre_emisora: v }))}
              placeholder="Nombre de la emisora"
            />
          </Field>
          <Field label="Lugar">
            <select
              className="pl-select__btn"
              value={nuevaEmisora.id_lugar}
              onChange={(e) => setNuevaEmisora((f) => ({ ...f, id_lugar: e.target.value }))}
            >
              <option value="">Sin lugar</option>
              {lugares.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nombre_ciudad}, {l.nombre_estado}
                </option>
              ))}
            </select>
          </Field>
          {error && <p className="pl-field__hint is-error">{error}</p>}
          <div className="pl-row">
            <Button variant="secondary" size="s" onClick={() => setCreando(false)} type="button">
              Cancelar
            </Button>
            <Button variant="primary" size="s" onClick={handleCrear} type="button" disabled={saving}>
              {saving ? 'Creando…' : 'Crear y seleccionar'}
            </Button>
          </div>
        </div>
      )}

      {seleccionada?.rad_lugar && (
        <p className="body-s" style={{ color: 'var(--fg-3)', marginTop: 'var(--space-2)' }}>
          {seleccionada.rad_lugar.nombre_ciudad}, {seleccionada.rad_lugar.nombre_estado}
        </p>
      )}
    </div>
  )
}
