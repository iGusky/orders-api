import { lazy, StrictMode, Suspense } from 'react';
import * as ReactDOM from 'react-dom/client';
import '@fontsource-variable/atkinson-hyperlegible-next/wght.css';
import '@fontsource/young-serif';
import './styles.css'
import { BrowserRouter, Route, Routes } from 'react-router';
import Home from './pages/home';
import { MovementsPage } from './pages/movimientos';
import { InventoryPage } from './pages/inventario';

// TEMPORAL: guía de estilos, solo en desarrollo. Ver src/pages/estilos/index.tsx para eliminarla.
const StyleGuide = import.meta.env.DEV ? lazy(() => import('./pages/estilos')) : null;

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <StrictMode>
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />}/>
      <Route path="/movimientos" element={<MovementsPage />}/>
      <Route path="/inventario" element={<InventoryPage />}/>
      {StyleGuide && (
        <Route path="/estilos" element={<Suspense fallback={null}><StyleGuide /></Suspense>} />
      )}
    </Routes>
    </BrowserRouter>
  </StrictMode>
);