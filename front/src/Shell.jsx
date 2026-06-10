import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Portal from './portal/Portal';
import Adm from './systems/adm/Adm';
import RadRouter from './systems/rad/RadRouter';
import Inf from './systems/inf/Inf';
import Per from './systems/per/Per';

export default function Shell() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Portal />} />
        <Route path="/adm" element={<Adm />} />
        <Route path="/rad/*" element={<RadRouter />} />
        <Route path="/inf/*" element={<Inf />} />
        <Route path="/per/*" element={<Per />} />
      </Routes>
    </BrowserRouter>
  );
}
