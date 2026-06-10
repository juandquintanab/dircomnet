import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, EmptyDash, Chip, Icon, Input } from '../../../components/primitives'
import {
  getListaById,
  updateListaEstado,
  upsertValorParticipante,
  addParticipante,
  removeParticipante,
  getPersonas,
} from '../lib/perQueries'

const ESTADO_TONE = { borrador: 'slate', activa: 'green', cerrada: 'blue', cancelada: 'red' }

const TRANSICIONES = {
  borrador:  [{ value: 'activa',    label: 'Activar lista' }],
  activa:    [{ value: 'cerrada',   label: 'Cerrar lista' }, { value: 'cancelada', label: 'Cancelar lista' }],
  cerrada:   [],
  cancelada: [],
}

function getPersonaFieldValue(persona, tipo_persona) {
  if (!persona) return null
  switch (tipo_persona) {
    case 'nombre':             return persona.nombre
    case 'cedula':             return persona.cedula
    case 'frecuencia':         return persona.frecuencia
    case 'correo_principal':   return persona.correos?.find((c) => c.es_principal)?.direccion
    case 'telefono_principal': return persona.telefonos?.find((t) => t.es_principal)?.numero
    case 'medio_actual':       return persona.persona_medios?.[0]?.medios?.nombre
    default:                   return persona[tipo_persona] ?? null
  }
}

export default function ListaDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [lista, setLista]       = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  // Inline cell edit
  const [editCell, setEditCell]   = useState(null)  // { participanteId, campoListaId }
  const [cellValue, setCellValue] = useState('')
  const [savingCell, setSavingCell] = useState(false)
  const cellInputRef = useRef(null)

  // Panel lateral
  const [panelAbierto, setPanelAbierto]   = useState(false)
  const [query, setQuery]                 = useState('')
  const [resultados, setResultados]       = useState([])
  const [buscando, setBuscando]           = useState(false)
  const [agregando, setAgregando]         = useState(null)  // persona_id en curso
  const [cambiandoEstado, setCambiandoEstado] = useState(false)

  // ── Carga ──

  const cargar = useCallback((silencioso = false) => {
    if (!silencioso) setLoading(true)
    getListaById(id)
      .then(setLista)
      .catch((e) => { if (!silencioso) setError(e.message) })
      .finally(() => { if (!silencioso) setLoading(false) })
  }, [id])

  useEffect(() => { cargar(false) }, [cargar])

  // Refetch silencioso al volver al tab
  useEffect(() => {
    const handleVis = () => { if (document.visibilityState === 'visible') cargar(true) }
    document.addEventListener('visibilitychange', handleVis)
    return () => document.removeEventListener('visibilitychange', handleVis)
  }, [cargar])

  // ── Búsqueda de participantes con debounce ──

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) { setResultados([]); return }
    const timer = setTimeout(() => {
      setBuscando(true)
      getPersonas({ buscar: q, limit: 10 })
        .then(({ data }) => setResultados(data))
        .catch(() => {})
        .finally(() => setBuscando(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  // ── Edición inline ──

  const iniciarEditCell = (participanteId, campoListaId, valorActual) => {
    setEditCell({ participanteId, campoListaId })
    setCellValue(valorActual ?? '')
    setTimeout(() => cellInputRef.current?.focus(), 0)
  }

  const guardarCelda = async () => {
    if (!editCell) return
    setSavingCell(true)
    try {
      await upsertValorParticipante(editCell.participanteId, editCell.campoListaId, cellValue)
      setLista((prev) => ({
        ...prev,
        participantes_lista: prev.participantes_lista.map((p) => {
          if (p.id !== editCell.participanteId) return p
          const vals = [...(p.valores_participante ?? [])]
          const idx  = vals.findIndex((v) => v.campo_lista_id === editCell.campoListaId)
          if (idx >= 0) {
            vals[idx] = { ...vals[idx], valor: cellValue }
          } else {
            vals.push({ id: `tmp_${Date.now()}`, campo_lista_id: editCell.campoListaId, valor: cellValue })
          }
          return { ...p, valores_participante: vals }
        }),
      }))
    } catch {
      /* silent — cell stays open if needed */
    } finally {
      setSavingCell(false)
      setEditCell(null)
    }
  }

  const handleCellKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); guardarCelda() }
    if (e.key === 'Escape') setEditCell(null)
  }

  // ── Agregar participante ──

  const handleAgregar = async (persona) => {
    if (lista.participantes_lista?.some((p) => p.personas?.id === persona.id)) return
    setAgregando(persona.id)
    try {
      const nuevo = await addParticipante({ lista_id: lista.id, persona_id: persona.id })
      setLista((prev) => ({
        ...prev,
        participantes_lista: [...(prev.participantes_lista ?? []), nuevo],
      }))
      setQuery('')
      setResultados([])
    } catch {}
    setAgregando(null)
  }

  // ── Quitar participante ──

  const handleQuitar = async (participanteId) => {
    try {
      await removeParticipante(participanteId)
      setLista((prev) => ({
        ...prev,
        participantes_lista: prev.participantes_lista.filter((p) => p.id !== participanteId),
      }))
    } catch {}
  }

  // ── Cambiar estado ──

  const handleEstado = async (nuevoEstado) => {
    if (!nuevoEstado) return
    setCambiandoEstado(true)
    try {
      const actualizada = await updateListaEstado(id, nuevoEstado)
      setLista((prev) => ({ ...prev, estado: actualizada.estado }))
    } catch {}
    setCambiandoEstado(false)
  }

  // ── Render ──

  if (loading) return <div className="per-loading">Cargando…</div>
  if (error)   return <div className="per-error">Error al cargar los datos.</div>
  if (!lista)  return null

  const campos      = (lista.campos_lista ?? []).sort((a, b) => a.orden - b.orden)
  const participantes = lista.participantes_lista ?? []
  const transiciones  = TRANSICIONES[lista.estado] ?? []
  const yaEnLista     = new Set(participantes.map((p) => p.personas?.id).filter(Boolean))

  return (
    <>
      {/* ── Drawer de participantes ── */}
      {panelAbierto && (
        <div className="pl-drawer-scrim" onClick={() => setPanelAbierto(false)}>
          <aside className="pl-drawer" onClick={(e) => e.stopPropagation()}>
            <header className="pl-drawer__head">
              <h2>Agregar periodistas</h2>
              <span className="sub">{lista.nombre}</span>
              <button
                type="button"
                className="pl-drawer__x"
                onClick={() => setPanelAbierto(false)}
                aria-label="Cerrar"
              >
                <Icon name="x" size={16} />
              </button>
            </header>

            <div className="pl-drawer__body">
              <Input
                value={query}
                onChange={setQuery}
                placeholder="Buscar periodista por nombre…"
                leadingIcon="search"
              />

              {buscando && (
                <p style={{ fontSize: 'var(--fs-body-s)', color: 'var(--slate-400)', marginTop: 'var(--space-3)' }}>
                  Buscando…
                </p>
              )}

              {!buscando && query.trim().length >= 2 && resultados.length === 0 && (
                <p style={{ fontSize: 'var(--fs-body-s)', color: 'var(--slate-400)', marginTop: 'var(--space-3)' }}>
                  Sin resultados
                </p>
              )}

              {resultados.length > 0 && (
                <div className="per-search-results">
                  {resultados.map((persona) => {
                    const enLista = yaEnLista.has(persona.id)
                    return (
                      <div
                        key={persona.id}
                        className="per-search-result"
                        onClick={() => !enLista && handleAgregar(persona)}
                        style={{ opacity: enLista ? 0.5 : 1, cursor: enLista ? 'default' : 'pointer' }}
                      >
                        <span className="per-search-result__nombre">{persona.nombre}</span>
                        <span className="per-search-result__meta">
                          {persona.persona_medios?.[0]?.medios?.nombre ?? '—'}
                          {enLista && ' · Ya en la lista'}
                          {agregando === persona.id && ' · Agregando…'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <footer className="pl-drawer__footer">
              <span style={{ fontSize: 'var(--fs-body-s)', color: 'var(--slate-400)' }}>
                {participantes.length} periodista{participantes.length !== 1 ? 's' : ''} en la lista
              </span>
              <Button variant="secondary" onClick={() => setPanelAbierto(false)}>
                Cerrar
              </Button>
            </footer>
          </aside>
        </div>
      )}

      {/* ── Encabezado ── */}
      <div className="pl-page__head">
        <div className="pl-page__title">
          <h1>{lista.nombre}</h1>
          <div className="pl-row" style={{ marginTop: 'var(--space-2)', gap: 'var(--space-3)' }}>
            <span className="meta"><b>PER</b> · Difusión y PR</span>
            {lista.estado && (
              <Chip tone={ESTADO_TONE[lista.estado] ?? 'slate'}>{lista.estado}</Chip>
            )}
            {transiciones.length > 0 && (
              <select
                className="per-select-native"
                style={{ width: 'auto', padding: '4px 10px', fontSize: 'var(--fs-body-s)' }}
                value=""
                onChange={(e) => handleEstado(e.target.value)}
                disabled={cambiandoEstado}
              >
                <option value="">Cambiar estado…</option>
                {transiciones.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            )}
          </div>
        </div>
        <div className="pl-page__actions">
          <Button variant="secondary" onClick={() => navigate(-1)}>Volver</Button>
          <Button variant="accent" icon="plus" onClick={() => setPanelAbierto(true)}>
            Agregar periodista
          </Button>
        </div>
      </div>

      {/* ── Tabla de participantes ── */}
      <div className="pl-card pl-table-wrap">
        <div className="pl-table-meta">
          <span className="left">
            <b>{participantes.length}</b>{' '}
            {participantes.length === 1 ? 'participante' : 'participantes'}
          </span>
          {savingCell && (
            <span style={{ fontSize: 'var(--fs-body-xs)', color: 'var(--slate-400)' }}>
              Guardando…
            </span>
          )}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="pl-table" style={{ minWidth: 600 }}>
            <thead>
              <tr>
                <th style={{ minWidth: 180, position: 'sticky', left: 0, background: 'var(--navy-900)', zIndex: 2 }}>
                  Periodista
                </th>
                {campos.map((c) => (
                  <th key={c.id} style={{ minWidth: 140 }}>{c.etiqueta}</th>
                ))}
                <th style={{ width: 56 }}></th>
              </tr>
            </thead>
            <tbody>
              {participantes.length === 0 ? (
                <tr>
                  <td colSpan={campos.length + 2}>
                    <div className="per-empty">
                      Sin participantes. Usa "Agregar periodista" para comenzar.
                    </div>
                  </td>
                </tr>
              ) : (
                participantes.map((part) => (
                  <tr key={part.id}>
                    {/* Nombre — columna sticky */}
                    <td
                      className="name"
                      style={{ position: 'sticky', left: 0, background: 'var(--white)', zIndex: 1 }}
                    >
                      {part.personas?.nombre ?? <EmptyDash />}
                      {part.medios && (
                        <div style={{ fontSize: 'var(--fs-body-xs)', color: 'var(--slate-400)', marginTop: 2 }}>
                          {part.medios.nombre}
                        </div>
                      )}
                    </td>

                    {/* Campos dinámicos */}
                    {campos.map((campo) => {
                      const esPersona = campo.tipo_campo === 'persona'
                      const estaEditando =
                        editCell?.participanteId === part.id && editCell?.campoListaId === campo.id

                      if (esPersona) {
                        const val = getPersonaFieldValue(part.personas, campo.tipo_persona)
                        return (
                          <td key={campo.id} className="per-td-static per-td-persona">
                            {val ?? <EmptyDash />}
                          </td>
                        )
                      }

                      const valorActual = part.valores_participante?.find(
                        (v) => v.campo_lista_id === campo.id
                      )?.valor

                      if (estaEditando) {
                        return (
                          <td key={campo.id} className="per-td-edit">
                            <input
                              ref={cellInputRef}
                              value={cellValue}
                              onChange={(e) => setCellValue(e.target.value)}
                              onBlur={guardarCelda}
                              onKeyDown={handleCellKeyDown}
                            />
                          </td>
                        )
                      }

                      return (
                        <td
                          key={campo.id}
                          className="per-td-edit per-td-static"
                          onClick={() => iniciarEditCell(part.id, campo.id, valorActual)}
                          title="Clic para editar"
                        >
                          {valorActual ?? <EmptyDash />}
                        </td>
                      )
                    })}

                    {/* Acciones */}
                    <td>
                      <div className="per-row-actions">
                        <button
                          type="button"
                          className="pl-btn pl-btn--ghost pl-btn--s"
                          onClick={() => handleQuitar(part.id)}
                          aria-label="Quitar de la lista"
                        >
                          <Icon name="trash" size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
