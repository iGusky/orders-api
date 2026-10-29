import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import './styles.css'
import { BrowserRouter, Route, Routes } from 'react-router';
import Home from './pages/home';
import { Movimientos } from './pages/movimientos';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <StrictMode>
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />}/>
      <Route path="/movimientos" element={<Movimientos />}/>
    </Routes>
    </BrowserRouter>
  </StrictMode>
);