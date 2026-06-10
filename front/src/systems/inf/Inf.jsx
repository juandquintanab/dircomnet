import { Routes, Route, Navigate, NavLink } from 'react-router-dom'
import { GERENCIAS } from '../../data/systems'
import SystemLayout from '../SystemLayout'
import { Icon } from '../../components/primitives'
import InfluencersList from './influencers/InfluencersList'
import InfluencerDetail from './influencers/InfluencerDetail'
import InfluencerForm from './influencers/InfluencerForm'
import MarcasList from './marcas/MarcasList'
import MarcaForm from './marcas/MarcaForm'
import ContratosList from './contratos/ContratosList'
import ContratoDetail from './contratos/ContratoDetail'
import ContratoForm from './contratos/ContratoForm'
import EntregableForm from './entregables/EntregableForm'
import PagoForm from './pagos/PagoForm'
import CampanasList from './campanas/CampanasList'
import CampanaDetail from './campanas/CampanaDetail'
import CampanaForm from './campanas/CampanaForm'
import './inf.css'

const sistema = GERENCIAS[0].sistemas.find((s) => s.id === 'inf')

function InfSidebar() {
  return (
    <aside className="pl-sidebar">
      <div className="pl-sidebar__group">INF</div>
      <NavLink
        to="/inf/influencers"
        className={({ isActive }) => `pl-sidebar__item${isActive ? ' is-active' : ''}`}
      >
        <Icon name="users" size={16} />
        Influencers
      </NavLink>
      <NavLink
        to="/inf/marcas"
        className={({ isActive }) => `pl-sidebar__item${isActive ? ' is-active' : ''}`}
      >
        <Icon name="building" size={16} />
        Marcas
      </NavLink>
      <NavLink
        to="/inf/contratos"
        className={({ isActive }) => `pl-sidebar__item${isActive ? ' is-active' : ''}`}
      >
        <Icon name="file" size={16} />
        Contratos
      </NavLink>
      <NavLink
        to="/inf/campanas"
        className={({ isActive }) => `pl-sidebar__item${isActive ? ' is-active' : ''}`}
      >
        <Icon name="bar" size={16} />
        Campañas
      </NavLink>
    </aside>
  )
}

export default function Inf() {
  return (
    <SystemLayout sistema={sistema} sidebar={<InfSidebar />}>
      <Routes>
        <Route index element={<Navigate to="/inf/influencers" replace />} />

        {/* Influencers */}
        <Route path="influencers" element={<InfluencersList />} />
        <Route path="influencers/nuevo" element={<InfluencerForm />} />
        <Route path="influencers/:id" element={<InfluencerDetail />} />
        <Route path="influencers/:id/editar" element={<InfluencerForm />} />

        {/* Marcas */}
        <Route path="marcas" element={<MarcasList />} />
        <Route path="marcas/nueva" element={<MarcaForm />} />
        <Route path="marcas/:id/editar" element={<MarcaForm />} />

        {/* Contratos */}
        <Route path="contratos" element={<ContratosList />} />
        <Route path="contratos/nuevo" element={<ContratoForm />} />
        <Route path="contratos/:id" element={<ContratoDetail />} />
        <Route path="contratos/:id/editar" element={<ContratoForm />} />

        {/* Entregables (sub-ruta de contrato) */}
        <Route path="contratos/:contratoId/entregables/nuevo" element={<EntregableForm />} />
        <Route path="contratos/:contratoId/entregables/:id/editar" element={<EntregableForm />} />

        {/* Pagos (sub-ruta de contrato) */}
        <Route path="contratos/:contratoId/pagos/nuevo" element={<PagoForm />} />
        <Route path="contratos/:contratoId/pagos/:id/editar" element={<PagoForm />} />

        {/* Campañas */}
        <Route path="campanas" element={<CampanasList />} />
        <Route path="campanas/nueva" element={<CampanaForm />} />
        <Route path="campanas/:id" element={<CampanaDetail />} />
        <Route path="campanas/:id/editar" element={<CampanaForm />} />
      </Routes>
    </SystemLayout>
  )
}
