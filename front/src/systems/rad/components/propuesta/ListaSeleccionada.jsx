import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Field, Input } from '../../../../components/primitives'
import RadBadge from '../shared/RadBadge'
import PropuestaTotales from './PropuestaTotales'
import { usePropuestaActiva } from '../../hooks/usePropuestaActiva'

function fmt(n) {
  return Number(n).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function ListaSeleccionada() {
  const navigate = useNavigate()
  const {
    productosSeleccionados,
    listaAbierta,
    setListaAbierta,
    quitarProducto,
    limpiar,
    total,
    totalMercado,
    ahorroTotal,
    guardarComoPropuesta,
    guardando,
    guardadoError,
  } = usePropuestaActiva()

  const [nombre, setNombre] = useState('')
  const [errorNombre, setErrorNombre] = useState(null)

  if (!listaAbierta) return null

  async function handleGuardar() {
    if (!nombre.trim()) { setErrorNombre('El nombre es obligatorio'); return }
    setErrorNombre(null)
    const result = await guardarComoPropuesta(nombre)
    if (result.ok) {
      setNombre('')
      setListaAbierta(false)
      navigate('/rad/propuestas')
    }
  }

  return (
    <div className="pl-drawer-scrim" onClick={() => setListaAbierta(false)}>
      <aside className="pl-drawer rad-lista-drawer" onClick={(e) => e.stopPropagation()}>
        <header className="pl-drawer__head">
          <h2 className="pl-drawer__title">Lista seleccionada</h2>
          <button
            className="pl-modal__close"
            onClick={() => setListaAbierta(false)}
            aria-label="Cerrar"
          >
            ×
          </button>
        </header>

        <div className="pl-drawer__body">
          {productosSeleccionados.length === 0 ? (
            <p className="body-m" style={{ color: 'var(--fg-3)', padding: 'var(--space-6) 0' }}>
              No hay productos en la lista.
            </p>
          ) : (
            <ul className="rad-lista-items">
              {productosSeleccionados.map((p) => (
                <li key={p.id} className="rad-lista-item">
                  <div className="rad-lista-item__info">
                    <span className="rad-lista-item__nombre">{p.nombre_producto}</span>
                    <RadBadge tipo={p.tipo_producto} />
                  </div>
                  <div className="rad-lista-item__derecha">
                    <span className="rad-lista-item__precio">Bs. {fmt(p.precioTotal)}</span>
                    <button
                      type="button"
                      className="pl-btn pl-btn--ghost pl-btn--s"
                      onClick={() => quitarProducto(p.id)}
                      aria-label="Quitar"
                    >
                      ×
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {productosSeleccionados.length > 0 && (
            <PropuestaTotales
              total={total}
              totalMercado={totalMercado}
              ahorroTotal={ahorroTotal}
            />
          )}
        </div>

        <footer className="pl-drawer__footer">
          <Field label="Nombre de la propuesta">
            <Input
              value={nombre}
              onChange={setNombre}
              placeholder="Ej. Propuesta Q3 — Polar Bebidas"
              error={errorNombre}
            />
          </Field>

          {guardadoError && (
            <p className="pl-field__hint is-error" style={{ marginTop: 'var(--space-2)' }}>
              {guardadoError}
            </p>
          )}

          <div className="pl-row" style={{ marginTop: 'var(--space-4)' }}>
            <Button
              variant="ghost"
              size="m"
              onClick={limpiar}
              type="button"
              disabled={!productosSeleccionados.length}
            >
              Limpiar lista
            </Button>
            <Button
              variant="primary"
              size="m"
              onClick={handleGuardar}
              type="button"
              disabled={guardando || !productosSeleccionados.length}
            >
              {guardando ? 'Guardando…' : 'Guardar propuesta'}
            </Button>
          </div>
        </footer>
      </aside>
    </div>
  )
}
