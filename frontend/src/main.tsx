import { StrictMode, useEffect, useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import keycloak from './services/keycloak';

function AppWithKeycloak() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const isRun = useRef(false);

  useEffect(() => {
    if (isRun.current) return;
    isRun.current = true;

    keycloak
      .init({ onLoad: 'login-required', checkLoginIframe: false })
      .then((auth) => {
        setAuthenticated(auth);
      })
      .catch((err) => {
        console.error('Failed to initialize keycloak', err);
        setAuthenticated(false);
      });
  }, []);

  if (authenticated === null) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>Carregando...</div>;
  }

  if (!authenticated) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>Falha na Autenticação.</div>;
  }

  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppWithKeycloak />
  </StrictMode>,
);
