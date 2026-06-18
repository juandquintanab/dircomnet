import { useState, useRef, useEffect } from 'react'
import { Icon } from '../../../components/primitives'

/**
 * Dropdown de multiselección con buscador interno y checkboxes.
 * - `options`: [{ id, nombre }] — catálogo ya cargado en el cliente
 * - `selected`: string[] — ids seleccionados (se comparan como string)
 * - `onChange(nuevoArreglo)`: recibe el nuevo arreglo de ids
 *
 * El buscador filtra las opciones en memoria (no dispara llamadas al backend).
 */
export default function MultiSelectDropdown({ label, options = [], selected = [], onChange }) {
  const [open, setOpen]   = useState(false)
  const [busca, setBusca] = useState('')
  const ref = useRef(null)

  // Cerrar al hacer click fuera
  useEffect(() => {
    if (!open) return
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  // Limpiar el término al cerrar (no pierde la selección marcada)
  useEffect(() => { if (!open) setBusca('') }, [open])

  const sel = selected.map(String)
  const term = busca.trim().toLowerCase()
  const visibles = term
    ? options.filter((o) => o.nombre.toLowerCase().includes(term))
    : options

  const toggle = (id) => {
    const sid = String(id)
    onChange(sel.includes(sid) ? sel.filter((x) => x !== sid) : [...sel, sid])
  }

  return (
    <div className={`per-msd${open ? ' is-open' : ''}`} ref={ref}>
      <button
        type="button"
        className="per-msd__btn"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className={sel.length ? '' : 'per-msd__ph'}>
          {label}
          {sel.length > 0 && <span className="per-msd__badge">{sel.length}</span>}
        </span>
        <Icon name="chevron-down" size={14} />
      </button>

      {open && (
        <div className="per-msd__panel">
          <div className="per-msd__search">
            <Icon name="search" size={14} />
            <input
              autoFocus
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder={`Buscar ${label.toLowerCase()}…`}
            />
          </div>

          <div className="per-msd__list">
            {visibles.length === 0 ? (
              <div className="per-msd__empty">Sin opciones</div>
            ) : (
              visibles.map((o) => {
                const checked = sel.includes(String(o.id))
                return (
                  <label key={o.id} className="per-msd__opt">
                    <input type="checkbox" checked={checked} onChange={() => toggle(o.id)} />
                    <span>{o.nombre}</span>
                  </label>
                )
              })
            )}
          </div>

          {sel.length > 0 && (
            <button type="button" className="per-msd__clear" onClick={() => onChange([])}>
              Limpiar
            </button>
          )}
        </div>
      )}
    </div>
  )
}
