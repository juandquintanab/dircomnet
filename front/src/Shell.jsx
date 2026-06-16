import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './auth/Login';
import PortalLayout from './portal/PortalLayout';
import Portal from './portal/Portal';
import Metricas from './portal/sections/Metricas';
import Asistente from './portal/sections/Asistente';
import Usuarios from './portal/sections/Usuarios';
import Configuracion from './portal/sections/Configuracion';
import Adm from './systems/adm/Adm';
import RadRouter from './systems/rad/RadRouter';
import Inf from './systems/inf/Inf';
import Per from './systems/per/Per';

export default function Shell() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/portal" element={<PortalLayout />}>
          <Route index element={<Portal />} />
          <Route path="metricas" element={<Metricas />} />
          <Route path="asistente" element={<Asistente />} />
          <Route path="usuarios" element={<Usuarios />} />
          <Route path="configuracion" element={<Configuracion />} />
        </Route>
        <Route path="/adm" element={<Adm />} />
        <Route path="/rad/*" element={<RadRouter />} />
        <Route path="/inf/*" element={<Inf />} />
        <Route path="/per/*" element={<Per />} />
      </Routes>
    </BrowserRouter>
  );
}
