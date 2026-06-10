import { Routes, Route, Navigate, NavLink } from 'react-router-dom'
import { GERENCIAS } from '../../data/systems'
import SystemLayout from '../SystemLayout'
import { Icon } from '../../components/primitives'
import EmisorasPage from './pages/emisoras/EmisorasPage'
import LocutoresPage from './pages/locutores/LocutoresPage'
import ComercializadorasPage from './pages/comercializadoras/ComercializadorasPage'
import ProductosPage from './pages/productos/ProductosPage'
import ProductoForm from './pages/productos/ProductoForm'
import ProductoDetalle from './pages/productos/ProductoDetalle'
import PropuestasPage from './pages/propuestas/PropuestasPage'
import PropuestaDetalle from './pages/propuestas/PropuestaDetalle'
import ListaSeleccionada from './components/propuesta/ListaSeleccionada'
import { PropuestaActivaProvider, usePropuestaActivaContext } from './context/PropuestaActivaContext'
import './rad.css'

const sistema = GERENCIAS[0].sistemas.find((s) => s.id === 'rad')

function RadSidebar() {
  const { productosSeleccionados, setListaAbierta } = usePropuestaActivaContext()
  const count = productosSeleccionados.length

  return (
    <aside className="pl-sidebar">
      <div className="pl-sidebar__group">RAD</div>

      <NavLink
        to="/rad/productos"
        className={({ isActive }) => `pl-sidebar__item${isActive ? ' is-active' : ''}`}
      >
        <Icon name="grid" size={16} />
        Productos
      </NavLink>

      <NavLink
        to="/rad/propuestas"
        className={({ isActive }) => `pl-sidebar__item${isActive ? ' is-active' : ''}`}
      >
        <Icon name="file" size={16} />
        Propuestas
      </NavLink>

      <button
        type="button"
        className="pl-sidebar__item"
        onClick={() => setListaAbierta(true)}
      >
        <Icon name="list" size={16} />
        Lista seleccionada
        {count > 0 && (
          <span className="rad-sidebar-badge">{count}</span>
        )}
      </button>

      <div className="pl-sidebar__group" style={{ marginTop: 'var(--space-4)' }}>CATÁLOGOS</div>

      <NavLink
        to="/rad/emisoras"
        className={({ isActive }) => `pl-sidebar__item${isActive ? ' is-active' : ''}`}
      >
        <Icon name="radio" size={16} />
        Emisoras
      </NavLink>

      <NavLink
        to="/rad/locutores"
        className={({ isActive }) => `pl-sidebar__item${isActive ? ' is-active' : ''}`}
      >
        <Icon name="user" size={16} />
        Locutores
      </NavLink>

      <NavLink
        to="/rad/comercializadoras"
        className={({ isActive }) => `pl-sidebar__item${isActive ? ' is-active' : ''}`}
      >
        <Icon name="building" size={16} />
        Comercializadoras
      </NavLink>
    </aside>
  )
}

export default function RadRouter() {
  return (
    <PropuestaActivaProvider>
      <SystemLayout sistema={sistema} sidebar={<RadSidebar />}>
        <Routes>
          <Route index element={<Navigate to="/rad/productos" replace />} />
          <Route path="productos" element={<ProductosPage />} />
          <Route path="productos/nuevo" element={<ProductoForm />} />
          <Route path="productos/:id" element={<ProductoDetalle />} />
          <Route path="productos/:id/editar" element={<ProductoForm />} />
          <Route path="propuestas" element={<PropuestasPage />} />
          <Route path="propuestas/:id" element={<PropuestaDetalle />} />
          <Route path="emisoras" element={<EmisorasPage />} />
          <Route path="locutores" element={<LocutoresPage />} />
          <Route path="comercializadoras" element={<ComercializadorasPage />} />
        </Routes>
      </SystemLayout>
      <ListaSeleccionada />
    </PropuestaActivaProvider>
  )
}
