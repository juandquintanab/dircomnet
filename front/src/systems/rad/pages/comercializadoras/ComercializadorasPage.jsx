import { useState } from 'react'
import { Button, Field, Input } from '../../../../components/primitives'
import RadPageHeader from '../../components/shared/RadPageHeader'
import RadEmptyState from '../../components/shared/RadEmptyState'
import { useComercializadoras } from '../../hooks/useComercializadoras'
import { comercializadoraService } from '../../services/comercializadoraService'
import './comercializadoras.css'

function ComercializadoraModal({ comercializadora, onClose, onSaved }) {
  const esEdicion = !!comercializadora?.id
  const [nombre, setNombre] = useState(comercializadora?.nombre_comercializadora ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!nombre.trim()) {
      setError('El nombre es obligatorio')
      return
    }
    setSaving(true)
    setError(null)

    const payload = { nombre_comercializadora: nombre.trim() }
    const { error: err } = esEdicion
      ? await comercializadoraService.update(comercializadora.id, payload)
      : await comercializadoraService.create(payload)

    if (err) { setError(err.message); setSaving(false); return }
    setSaving(false)
    onSaved()
  }

  return (
    <div className="pl-modal-scrim" onClick={onClose}>
      <div className="pl-modal" onClick={(e) => e.stopPropagation()}>
        <header className="pl-modal__head">
          <h2 className="pl-modal__title">
            {esEdicion ? 'Editar comercializadora' : 'Nueva comercializadora'}
          </h2>
          <button className="pl-modal__close" onClick={onClose} aria-label="Cerrar">×</button>
        </header>
        <form className="pl-modal__body" onSubmit={handleSubmit}>
          <Field label="Nombre">
            <Input
              value={nombre}
              onChange={setNombre}
              placeholder="Nombre de la comercializadora"
            />
          </Field>

          {error && (
            <p className="pl-field__hint is-error" style={{ marginTop: 'var(--space-3)' }}>
              {error}
            </p>
          )}

          <div className="rad-com-modal__actions">
            <Button variant="secondary" size="m" onClick={onClose} type="button">Cancelar</Button>
            <Button variant="primary" size="m" type="submit" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ComercializadorasPage() {
  const { data: comercializadoras, loading, error, refetch } = useComercializadoras()
  const [busqueda, setBusqueda] = useState('')
  const [modal, setModal] = useState(null)

  const filtradas = comercializadoras.filter((c) =>
    c.nombre_comercializadora.toLowerCase().includes(busqueda.toLowerCase())
  )

  async function handleEliminar(c) {
    if (!window.confirm(`¿Eliminar "${c.nombre_comercializadora}"?`)) return
    await comercializadoraService.delete(c.id)
    refetch()
  }

  return (
    <>
      <RadPageHeader
        titulo="Comercializadoras"
        labelAccion="+ Nueva"
        onAccion={() => setModal({})}
      />

      <div className="pl-card" style={{ padding: 'var(--space-6)' }}>
        <div className="rad-coms__search">
          <Input
            value={busqueda}
            onChange={setBusqueda}
            placeholder="Buscar comercializadora…"
            leadingIcon="search"
          />
        </div>

        {loading && <p className="body-m" style={{ color: 'var(--fg-3)' }}>Cargando…</p>}

        {error && <p className="pl-field__hint is-error">{error}</p>}

        {!loading && !error && filtradas.length === 0 && (
          <RadEmptyState
            mensaje="No hay comercializadoras registradas"
            accion={
              <Button variant="primary" size="m" icon="plus" onClick={() => setModal({})}>
                Nueva comercializadora
              </Button>
            }
          />
        )}

        {!loading && filtradas.length > 0 && (
          <div className="pl-table-wrap">
            <table className="pl-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th style={{ width: 96 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map((c) => (
                  <tr key={c.id}>
                    <td className="name">{c.nombre_comercializadora}</td>
                    <td>
                      <div className="pl-row" style={{ justifyContent: 'flex-end' }}>
                        <Button
                          variant="ghost"
                          size="s"
                          icon="edit"
                          onClick={() => setModal(c)}
                        />
                        <Button
                          variant="ghost"
                          size="s"
                          icon="trash"
                          onClick={() => handleEliminar(c)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal !== null && (
        <ComercializadoraModal
          comercializadora={modal?.id ? modal : null}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); refetch() }}
        />
      )}
    </>
  )
}
