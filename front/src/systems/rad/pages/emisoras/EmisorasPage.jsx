import { useState } from 'react'
import { Button, Field, Input, Select, EmptyDash } from '../../../../components/primitives'
import RadPageHeader from '../../components/shared/RadPageHeader'
import RadEmptyState from '../../components/shared/RadEmptyState'
import { useEmisoras } from '../../hooks/useEmisoras'
import { useLugares } from '../../hooks/useLugares'
import { useComercializadoras } from '../../hooks/useComercializadoras'
import { emisoraService } from '../../services/emisoraService'
import './emisoras.css'

const FORM_VACIO = {
  nombre_emisora: '',
  id_lugar: '',
  edad: '',
  genero: '',
  estrato: '',
  tipo_contenido: '',
  tipo_musica: '',
  tipo_audiencia: '',
}

function EmisoraModal({ emisora, lugares, comercializadoras, onClose, onSaved }) {
  const esEdicion = !!emisora?.id
  const [form, setForm] = useState(
    esEdicion
      ? {
          nombre_emisora: emisora.nombre_emisora ?? '',
          id_lugar: emisora.id_lugar ?? '',
          edad: emisora.edad ?? '',
          genero: emisora.genero ?? '',
          estrato: emisora.estrato ?? '',
          tipo_contenido: emisora.tipo_contenido ?? '',
          tipo_musica: emisora.tipo_musica ?? '',
          tipo_audiencia: emisora.tipo_audiencia ?? '',
        }
      : { ...FORM_VACIO }
  )

  const comIds = (emisora?.rad_emisora_x_comercializadora ?? []).map(
    (r) => r.rad_comercializadora?.id
  )
  const [selectedComs, setSelectedComs] = useState(new Set(comIds))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const setField = (key) => (val) => setForm((f) => ({ ...f, [key]: val }))

  const toggleCom = (id) => {
    setSelectedComs((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const lugarOptions = lugares.map((l) => ({
    value: l.id,
    label: `${l.nombre_ciudad}, ${l.nombre_estado}`,
  }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nombre_emisora.trim()) {
      setError('El nombre de la emisora es obligatorio')
      return
    }
    setSaving(true)
    setError(null)

    const payload = { ...form, id_lugar: form.id_lugar || null }
    let id = emisora?.id

    if (esEdicion) {
      const { error: err } = await emisoraService.update(id, payload)
      if (err) { setError(err.message); setSaving(false); return }
    } else {
      const { data, error: err } = await emisoraService.create(payload)
      if (err) { setError(err.message); setSaving(false); return }
      id = data.id
    }

    await emisoraService.setComercializadoras(id, [...selectedComs])
    setSaving(false)
    onSaved()
  }

  return (
    <div className="pl-modal-scrim" onClick={onClose}>
      <div className="pl-modal" onClick={(e) => e.stopPropagation()}>
        <header className="pl-modal__head">
          <h2 className="pl-modal__title">{esEdicion ? 'Editar emisora' : 'Nueva emisora'}</h2>
          <button className="pl-modal__close" onClick={onClose} aria-label="Cerrar">×</button>
        </header>
        <form className="pl-modal__body" onSubmit={handleSubmit}>
          <div className="rad-emisora-modal__grid">
            <div className="rad-emisora-modal__full">
              <Field label="Nombre">
                <Input
                  value={form.nombre_emisora}
                  onChange={setField('nombre_emisora')}
                  placeholder="Nombre de la emisora"
                />
              </Field>
            </div>

            <Field label="Lugar">
              <select
                className="pl-select__btn"
                value={form.id_lugar}
                onChange={(e) => setField('id_lugar')(e.target.value)}
              >
                <option value="">Sin lugar</option>
                {lugarOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Edad">
              <Input value={form.edad} onChange={setField('edad')} placeholder="Ej. 25–45" />
            </Field>

            <Field label="Género">
              <Input value={form.genero} onChange={setField('genero')} placeholder="Ej. Mixto" />
            </Field>

            <Field label="Estrato">
              <Input value={form.estrato} onChange={setField('estrato')} placeholder="Ej. A/B" />
            </Field>

            <Field label="Tipo de contenido">
              <Input value={form.tipo_contenido} onChange={setField('tipo_contenido')} placeholder="Ej. Noticias" />
            </Field>

            <Field label="Tipo de música">
              <Input value={form.tipo_musica} onChange={setField('tipo_musica')} placeholder="Ej. Pop, Tropical" />
            </Field>

            <Field label="Tipo de audiencia">
              <Input value={form.tipo_audiencia} onChange={setField('tipo_audiencia')} placeholder="Ej. Familiar" />
            </Field>

            {comercializadoras.length > 0 && (
              <div className="rad-emisora-modal__full">
                <Field label="Comercializadoras">
                  <div>
                    {comercializadoras.map((c) => (
                      <label key={c.id} className="rad-com-check">
                        <input
                          type="checkbox"
                          checked={selectedComs.has(c.id)}
                          onChange={() => toggleCom(c.id)}
                        />
                        {c.nombre_comercializadora}
                      </label>
                    ))}
                  </div>
                </Field>
              </div>
            )}
          </div>

          {error && (
            <p className="pl-field__hint is-error" style={{ marginTop: 'var(--space-3)' }}>
              {error}
            </p>
          )}

          <div className="rad-emisora-modal__actions">
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

export default function EmisorasPage() {
  const { data: emisoras, loading, error, refetch } = useEmisoras()
  const { data: lugares } = useLugares()
  const { data: comercializadoras } = useComercializadoras()
  const [busqueda, setBusqueda] = useState('')
  const [modal, setModal] = useState(null)

  const filtradas = emisoras.filter((e) =>
    e.nombre_emisora.toLowerCase().includes(busqueda.toLowerCase())
  )

  async function handleEliminar(emisora) {
    if (!window.confirm(`¿Eliminar "${emisora.nombre_emisora}"?`)) return
    await emisoraService.delete(emisora.id)
    refetch()
  }

  return (
    <>
      <RadPageHeader
        titulo="Emisoras"
        labelAccion="+ Nueva emisora"
        onAccion={() => setModal({})}
      />

      <div className="pl-card" style={{ padding: 'var(--space-6)' }}>
        <div className="rad-emisoras__search">
          <Input
            value={busqueda}
            onChange={setBusqueda}
            placeholder="Buscar emisora…"
            leadingIcon="search"
          />
        </div>

        {loading && <p className="body-m" style={{ color: 'var(--fg-3)' }}>Cargando…</p>}

        {error && (
          <p className="pl-field__hint is-error">{error}</p>
        )}

        {!loading && !error && filtradas.length === 0 && (
          <RadEmptyState
            mensaje="No hay emisoras registradas"
            accion={
              <Button variant="primary" size="m" icon="plus" onClick={() => setModal({})}>
                Nueva emisora
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
                  <th>Lugar</th>
                  <th>Comercializadoras</th>
                  <th style={{ width: 96 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map((e) => {
                  const coms = (e.rad_emisora_x_comercializadora ?? []).map(
                    (r) => r.rad_comercializadora
                  ).filter(Boolean)
                  const lugar = e.rad_lugar
                    ? `${e.rad_lugar.nombre_ciudad}, ${e.rad_lugar.nombre_estado}`
                    : null

                  return (
                    <tr key={e.id}>
                      <td className="name">{e.nombre_emisora}</td>
                      <td>{lugar ?? <EmptyDash />}</td>
                      <td>
                        {coms.length ? (
                          <div className="rad-emisoras__coms">
                            {coms.map((c) => (
                              <span key={c.id} className="pl-chip pl-chip--slate">
                                {c.nombre_comercializadora}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <EmptyDash />
                        )}
                      </td>
                      <td>
                        <div className="pl-row" style={{ justifyContent: 'flex-end' }}>
                          <Button
                            variant="ghost"
                            size="s"
                            icon="edit"
                            onClick={() => setModal(e)}
                          />
                          <Button
                            variant="ghost"
                            size="s"
                            icon="trash"
                            onClick={() => handleEliminar(e)}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal !== null && (
        <EmisoraModal
          emisora={modal?.id ? modal : null}
          lugares={lugares}
          comercializadoras={comercializadoras}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); refetch() }}
        />
      )}
    </>
  )
}
