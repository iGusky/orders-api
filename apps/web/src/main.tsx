import { lazy, StrictMode, Suspense } from 'react';
import * as ReactDOM from 'react-dom/client';
import '@fontsource-variable/atkinson-hyperlegible-next/wght.css';
import '@fontsource/young-serif';
import './styles.css'
import { BrowserRouter, Route, Routes } from 'react-router';
import Home from './pages/home';
import { MovementsPage } from './pages/movimientos';
import { InventoryPage } from './pages/inventario';
import { AddStockPage } from './pages/agregar-stock';
import { SalePage } from './pages/registrar-venta';
import { MovementFormPage } from './pages/registrar-movimiento';
import { SignInPage } from './pages/iniciar-sesion';
import { initTheme } from './hooks/useTheme';
import { AuthProvider } from './auth/AuthProvider';
import { RequireAuth, SIGN_IN_PATH } from './auth/RequireAuth';

// TEMPORAL: guía de estilos, solo en desarrollo. Ver src/pages/estilos/index.tsx para eliminarla.
const StyleGuide = import.meta.env.DEV ? lazy(() => import('./pages/estilos')) : null;

initTheme();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <StrictMode>
    <AuthProvider>
    <BrowserRouter>
    <Routes>
      <Route path={SIGN_IN_PATH} element={<SignInPage />}/>
      {/* Todo lo de aquí dentro exige sesión (D21). */}
      <Route element={<RequireAuth />}>
        <Route path="/" element={<Home />}/>
        <Route path="/movimientos" element={<MovementsPage />}/>
        <Route path="/inventario" element={<InventoryPage />}/>
        <Route path="/agregar-stock" element={<AddStockPage />}/>
        <Route path="/registrar-venta" element={<SalePage />}/>
        <Route path="/registrar-movimiento" element={<MovementFormPage />}/>
      </Route>
      {StyleGuide && (
        <Route path="/estilos" element={<Suspense fallback={null}><StyleGuide /></Suspense>} />
      )}
    </Routes>
    </BrowserRouter>
    </AuthProvider>
  </StrictMode>
);
