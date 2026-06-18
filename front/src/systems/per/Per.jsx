import { Routes, Route, Navigate, NavLink } from 'react-router-dom'
import { GERENCIAS } from '../../data/systems'
import SystemLayout from '../SystemLayout'
import { Icon } from '../../components/primitives'
import PersonasPage from './personas/PersonasPage'
import PersonaForm from './personas/PersonaForm'
import PersonaDetalle from './personas/PersonaDetalle'
import PlantillasPage from './plantillas/PlantillasPage'
import PlantillaForm from './plantillas/PlantillaForm'
import ListasPage from './listas/ListasPage'
import ListaForm from './listas/ListaForm'
import ListaDetalle from './listas/ListaDetalle'
import './per.css'

const gerencia = GERENCIAS.find((g) => g.id === 'comunicaciones')
const sistema  = gerencia.sistemas.find((s) => s.id === 'per')

function PerSidebar() {
  return (
    <aside className="pl-sidebar">
      <div className="pl-sidebar__group">PER</div>
      <NavLink
        to="/per/personas"
        title="Periodistas"
        className={({ isActive }) => `pl-sidebar__item${isActive ? ' is-active' : ''}`}
      >
        <Icon name="users" size={16} />
        Periodistas
      </NavLink>
      <NavLink
        to="/per/listas"
        title="Listas"
        className={({ isActive }) => `pl-sidebar__item${isActive ? ' is-active' : ''}`}
      >
        <Icon name="list" size={16} />
        Listas
      </NavLink>
      <NavLink
        to="/per/plantillas"
        title="Plantillas"
        className={({ isActive }) => `pl-sidebar__item${isActive ? ' is-active' : ''}`}
      >
        <Icon name="file" size={16} />
        Plantillas
      </NavLink>
    </aside>
  )
}

export default function Per() {
  return (
    <SystemLayout sistema={sistema} sidebar={<PerSidebar />}>
      <Routes>
        <Route index element={<Navigate to="/per/personas" replace />} />

        {/* Periodistas */}
        <Route path="personas"            element={<PersonasPage />} />
        <Route path="personas/nuevo"      element={<PersonaForm />} />
        <Route path="personas/:id"        element={<PersonaDetalle />} />
        <Route path="personas/:id/editar" element={<PersonaForm />} />

        {/* Plantillas */}
        <Route path="plantillas"           element={<PlantillasPage />} />
        <Route path="plantillas/nuevo"     element={<PlantillaForm />} />
        <Route path="plantillas/:id/editar" element={<PlantillaForm />} />

        {/* Listas */}
        <Route path="listas"       element={<ListasPage />} />
        <Route path="listas/nueva" element={<ListaForm />} />
        <Route path="listas/:id"   element={<ListaDetalle />} />
      </Routes>
    </SystemLayout>
  )
}
