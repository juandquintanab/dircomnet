import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import RadPageHeader from '../../components/shared/RadPageHeader'
import RadEmptyState from '../../components/shared/RadEmptyState'
import ProductoFiltros from '../../components/producto/ProductoFiltros'
import ProductoTabla from '../../components/producto/ProductoTabla'
import { useProductos } from '../../hooks/useProductos'
import { productoService } from '../../services/productoService'
import { Button } from '../../../../components/primitives'
import './productos.css'

export default function ProductosPage() {
  const navigate = useNavigate()
  const [filtros, setFiltros] = useState({})
  const { data: productos, loading, error, refetch } = useProductos(filtros)

  async function handleEliminar(producto) {
    if (!window.confirm(`¿Eliminar "${producto.nombre_producto}"?`)) return
    await productoService.delete(producto.id)
    refetch()
  }

  return (
    <>
      <RadPageHeader
        titulo="Productos"
        labelAccion="+ Nuevo producto"
        onAccion={() => navigate('/rad/productos/nuevo')}
      />

      <ProductoFiltros
        filtros={filtros}
        onChange={setFiltros}
        onLimpiar={() => setFiltros({})}
      />

      <div style={{ marginTop: 'var(--space-5)' }}>
        {loading && (
          <p className="body-m" style={{ color: 'var(--fg-3)', padding: 'var(--space-6)' }}>
            Cargando…
          </p>
        )}

        {error && (
          <p className="pl-field__hint is-error" style={{ padding: 'var(--space-4)' }}>{error}</p>
        )}

        {!loading && !error && productos.length === 0 && (
          <RadEmptyState
            mensaje="No hay productos que coincidan con los filtros"
            accion={
              <Button variant="primary" size="m" icon="plus" onClick={() => navigate('/rad/productos/nuevo')}>
                Nuevo producto
              </Button>
            }
          />
        )}

        {!loading && productos.length > 0 && (
          <ProductoTabla productos={productos} onEliminar={handleEliminar} />
        )}
      </div>
    </>
  )
}
