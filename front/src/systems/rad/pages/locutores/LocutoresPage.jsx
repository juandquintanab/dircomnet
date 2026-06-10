import { useState } from 'react'
import { Button, Field, Input, EmptyDash } from '../../../../components/primitives'
import RadPageHeader from '../../components/shared/RadPageHeader'
import RadEmptyState from '../../components/shared/RadEmptyState'
import { useLocutores } from '../../hooks/useLocutores'
import { locutorService } from '../../services/locutorService'
import './locutores.css'

const FORM_VACIO = {
  nombre_locutor: '',
  alcance: '',
  genero: '',
  estilo: '',
  personalidad: '',
  tipo_audiencia: '',
  tipo_contenido: '',
}

function LocutorModal({ locutor, onClose, onSaved }) {
  const esEdicion = !!locutor?.id
  const [form, setForm] = useState(
    esEdicion
      ? {
          nombre_locutor: locutor.nombre_locutor ?? '',
          alcance: locutor.alcance ?? '',
          genero: locutor.genero ?? '',
          estilo: locutor.estilo ?? '',
          personalidad: locutor.personalidad ?? '',
          tipo_audiencia: locutor.tipo_audiencia ?? '',
          tipo_contenido: locutor.tipo_contenido ?? '',
        }
      : { ...FORM_VACIO }
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const setField = (key) => (val) => setForm((f) => ({ ...f, [key]: val }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nombre_locutor.trim()) {
      setError('El nombre del locutor es obligatorio')
      return
    }
    setSaving(true)
    setError(null)

    const { error: err } = esEdicion
      ? await locutorService.update(locutor.id, form)
      : await locutorService.create(form)

    if (err) { setError(err.message); setSaving(false); return }
    setSaving(false)
    onSaved()
  }

  return (
    <div className="pl-modal-scrim" onClick={onClose}>
      <div className="pl-modal" onClick={(e) => e.stopPropagation()}>
        <header className="pl-modal__head">
          <h2 className="pl-modal__title">{esEdicion ? 'Editar locutor' : 'Nuevo locutor'}</h2>
          <button className="pl-modal__close" onClick={onClose} aria-label="Cerrar">×</button>
        </header>
        <form className="pl-modal__body" onSubmit={handleSubmit}>
          <div className="rad-locutor-modal__grid">
            <div className="rad-locutor-modal__full">
              <Field label="Nombre">
                <Input
                  value={form.nombre_locutor}
                  onChange={setField('nombre_locutor')}
                  placeholder="Nombre completo"
                />
              </Field>
            </div>

            <Field label="Alcance">
              <Input value={form.alcance} onChange={setField('alcance')} placeholder="Ej. Nacional" />
            </Field>

            <Field label="Género">
              <Input value={form.genero} onChange={setField('genero')} placeholder="Ej. Masculino" />
            </Field>

            <Field label="Estilo">
              <Input value={form.estilo} onChange={setField('estilo')} placeholder="Ej. Formal" />
            </Field>

            <Field label="Personalidad">
              <Input value={form.personalidad} onChange={setField('personalidad')} placeholder="Ej. Dinámico" />
            </Field>

            <Field label="Tipo de audiencia">
              <Input value={form.tipo_audiencia} onChange={setField('tipo_audiencia')} placeholder="Ej. Adultos" />
            </Field>

            <Field label="Tipo de contenido">
              <Input value={form.tipo_contenido} onChange={setField('tipo_contenido')} placeholder="Ej. Noticias" />
            </Field>
          </div>

          {error && (
            <p className="pl-field__hint is-error" style={{ marginTop: 'var(--space-3)' }}>
              {error}
            </p>
          )}

          <div className="rad-locutor-modal__actions">
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

export default function LocutoresPage() {
  const { data: locutores, loading, error, refetch } = useLocutores()
  const [busqueda, setBusqueda] = useState('')
  const [modal, setModal] = useState(null)

  const filtrados = locutores.filter((l) =>
    l.nombre_locutor.toLowerCase().includes(busqueda.toLowerCase())
  )

  async function handleEliminar(locutor) {
    if (!window.confirm(`¿Eliminar "${locutor.nombre_locutor}"?`)) return
    await locutorService.delete(locutor.id)
    refetch()
  }

  return (
    <>
      <RadPageHeader
        titulo="Locutores"
        labelAccion="+ Nuevo locutor"
        onAccion={() => setModal({})}
      />

      <div className="pl-card" style={{ padding: 'var(--space-6)' }}>
        <div className="rad-locutores__search">
          <Input
            value={busqueda}
            onChange={setBusqueda}
            placeholder="Buscar locutor…"
            leadingIcon="search"
          />
        </div>

        {loading && <p className="body-m" style={{ color: 'var(--fg-3)' }}>Cargando…</p>}

        {error && <p className="pl-field__hint is-error">{error}</p>}

        {!loading && !error && filtrados.length === 0 && (
          <RadEmptyState
            mensaje="No hay locutores registrados"
            accion={
              <Button variant="primary" size="m" icon="plus" onClick={() => setModal({})}>
                Nuevo locutor
              </Button>
            }
          />
        )}

        {!loading && filtrados.length > 0 && (
          <div className="pl-table-wrap">
            <table className="pl-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Alcance</th>
                  <th>Género</th>
                  <th style={{ width: 96 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((l) => (
                  <tr key={l.id}>
                    <td className="name">{l.nombre_locutor}</td>
                    <td>{l.alcance ?? <EmptyDash />}</td>
                    <td>{l.genero ?? <EmptyDash />}</td>
                    <td>
                      <div className="pl-row" style={{ justifyContent: 'flex-end' }}>
                        <Button
                          variant="ghost"
                          size="s"
                          icon="edit"
                          onClick={() => setModal(l)}
                        />
                        <Button
                          variant="ghost"
                          size="s"
                          icon="trash"
                          onClick={() => handleEliminar(l)}
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
        <LocutorModal
          locutor={modal?.id ? modal : null}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); refetch() }}
        />
      )}
    </>
  )
}
