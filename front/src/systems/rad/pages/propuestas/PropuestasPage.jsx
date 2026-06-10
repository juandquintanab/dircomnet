import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, EmptyDash } from '../../../../components/primitives'
import RadPageHeader from '../../components/shared/RadPageHeader'
import RadEmptyState from '../../components/shared/RadEmptyState'
import PropuestaEstado from '../../components/propuesta/PropuestaEstado'
import { usePropuestas } from '../../hooks/usePropuestas'
import { propuestaService } from '../../services/propuestaService'
import { downloadCSV } from '../../utils/csv'
import './propuestas.css'

function fechaCorta(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('es-VE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

export default function PropuestasPage() {
  const navigate = useNavigate()
  const { data: propuestas, loading, error, refetch } = usePropuestas()
  const [exportando, setExportando] = useState(null)

  async function handleEliminar(p) {
    if (!window.confirm(`¿Eliminar la propuesta "${p.nombre}"?`)) return
    await propuestaService.delete(p.id)
    refetch()
  }

  async function handleExportarCSV(p) {
    setExportando(p.id)
    const { data } = await propuestaService.exportarCSV(p.id)
    if (data) {
      const fecha = new Date().toISOString().slice(0, 10)
      const nombre = p.nombre.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]/g, '')
      downloadCSV(data, `propuesta_${nombre}_${fecha}.csv`)
    }
    setExportando(null)
  }

  return (
    <>
      <RadPageHeader titulo="Propuestas" />

      <div className="pl-card" style={{ padding: 'var(--space-6)' }}>
        {loading && (
          <p className="body-m" style={{ color: 'var(--fg-3)' }}>Cargando…</p>
        )}

        {error && <p className="pl-field__hint is-error">{error}</p>}

        {!loading && !error && propuestas.length === 0 && (
          <RadEmptyState
            mensaje="No hay propuestas todavía. Agrega productos a la lista y guárdalos como propuesta."
          />
        )}

        {!loading && propuestas.length > 0 && (
          <div className="pl-table-wrap">
            <table className="pl-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Productos</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th style={{ width: 140 }}></th>
                </tr>
              </thead>
              <tbody>
                {propuestas.map((p) => {
                  const countProductos = (p.rad_propuesta_detalle ?? []).length
                  return (
                    <tr key={p.id}>
                      <td className="name">{p.nombre}</td>
                      <td>{countProductos}</td>
                      <td><PropuestaEstado estado={p.estado} /></td>
                      <td>{fechaCorta(p.created_at) ?? <EmptyDash />}</td>
                      <td>
                        <div className="pl-row" style={{ justifyContent: 'flex-end' }}>
                          <Button
                            variant="ghost"
                            size="s"
                            icon="external"
                            onClick={() => navigate(`/rad/propuestas/${p.id}`)}
                          />
                          <Button
                            variant="ghost"
                            size="s"
                            icon="file"
                            onClick={() => handleExportarCSV(p)}
                            disabled={exportando === p.id}
                          />
                          <Button
                            variant="ghost"
                            size="s"
                            icon="trash"
                            onClick={() => handleEliminar(p)}
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
    </>
  )
}
