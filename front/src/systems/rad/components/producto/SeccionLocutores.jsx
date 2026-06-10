import { useState } from 'react'
import { Button, Field, Input, EmptyDash } from '../../../../components/primitives'
import { useLocutores } from '../../hooks/useLocutores'

export default function SeccionLocutores({
  locutores,
  onAgregar,
  onQuitar,
  onPrecio,
  onCrearInline,
}) {
  const { data: todos, refetch } = useLocutores()
  const [buscando, setBuscando] = useState('')
  const [creando, setCreando] = useState(false)
  const [nuevoLocutor, setNuevoLocutor] = useState({ nombre_locutor: '', alcance: '', genero: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const agregadosIds = new Set(locutores.map((l) => l.id_locutor))
  const filtrados = todos.filter(
    (l) =>
      !agregadosIds.has(l.id) &&
      l.nombre_locutor.toLowerCase().includes(buscando.toLowerCase())
  )

  async function handleCrear() {
    if (!nuevoLocutor.nombre_locutor.trim()) { setError('Nombre obligatorio'); return }
    setSaving(true)
    setError(null)
    try {
      const loc = await onCrearInline(nuevoLocutor)
      await refetch()
      onAgregar(loc)
      setCreando(false)
      setNuevoLocutor({ nombre_locutor: '', alcance: '', genero: '' })
    } catch (e) {
      setError(e.message)
    }
    setSaving(false)
  }

  return (
    <div className="rad-seccion">
      <span className="label-section">Locutores</span>

      {locutores.length > 0 && (
        <div className="rad-locutores-lista">
          {locutores.map((l) => (
            <div key={l.id_locutor} className="rad-locutor-row">
              <span className="rad-locutor-row__nombre">{l.nombre_locutor}</span>
              <Field label="Precio (Bs.)">
                <Input
                  value={l.precio_locutor}
                  onChange={(v) => onPrecio(l.id_locutor, v)}
                  placeholder="0.00"
                />
              </Field>
              <Button
                variant="ghost"
                size="s"
                icon="x"
                onClick={() => onQuitar(l.id_locutor)}
                type="button"
              />
            </div>
          ))}
        </div>
      )}

      <div className="rad-seccion__inline" style={{ marginTop: 'var(--space-4)' }}>
        <Input
          value={buscando}
          onChange={setBuscando}
          placeholder="Buscar locutor existente…"
          leadingIcon="search"
        />
        {buscando && filtrados.length > 0 && (
          <div className="rad-locutor-sugerencias">
            {filtrados.slice(0, 6).map((l) => (
              <button
                key={l.id}
                type="button"
                className="rad-locutor-sugerencias__item"
                onClick={() => { onAgregar(l); setBuscando('') }}
              >
                {l.nombre_locutor}
                {l.alcance ? <span className="rad-locutor-sugerencias__meta"> — {l.alcance}</span> : null}
              </button>
            ))}
          </div>
        )}
      </div>

      {!creando && (
        <button
          type="button"
          className="pl-btn pl-btn--ghost pl-btn--s"
          style={{ marginTop: 'var(--space-3)' }}
          onClick={() => setCreando(true)}
        >
          + Crear nuevo locutor
        </button>
      )}

      {creando && (
        <div className="rad-seccion__inline pl-info" style={{ marginTop: 'var(--space-3)' }}>
          <Field label="Nombre">
            <Input
              value={nuevoLocutor.nombre_locutor}
              onChange={(v) => setNuevoLocutor((f) => ({ ...f, nombre_locutor: v }))}
              placeholder="Nombre completo"
            />
          </Field>
          <div className="pl-grid-2">
            <Field label="Alcance">
              <Input
                value={nuevoLocutor.alcance}
                onChange={(v) => setNuevoLocutor((f) => ({ ...f, alcance: v }))}
                placeholder="Ej. Nacional"
              />
            </Field>
            <Field label="Género">
              <Input
                value={nuevoLocutor.genero}
                onChange={(v) => setNuevoLocutor((f) => ({ ...f, genero: v }))}
                placeholder="Ej. Masculino"
              />
            </Field>
          </div>
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
