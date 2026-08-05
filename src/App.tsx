import { useState, useEffect } from 'react';
import { ModelViewer } from './components/ModelViewer';

// Mapping of routes to model URLs
const MODELS: Record<string, string> = {
  '/1': '/assets/Chair.glb',
  '1': '/assets/Chair.glb',
  '/2': '/assets/Luggage_Bag.glb',
  '2': '/assets/Luggage_Bag.glb',
  '/3': '/assets/Sauna.glb',
  '3': '/assets/Sauna.glb',
  '/4': '/assets/Sculptformer.glb',
  '4': '/assets/Sculptformer.glb',
  '/5': '/assets/Spa_4_Seater.glb',
  '5': '/assets/Spa_4_Seater.glb',
  '/6': '/assets/Trailer.glb',
  '6': '/assets/Trailer.glb',
};

function getRouteKey() {
  const path = window.location.pathname;
  if (path && path !== '/') return path;
  
  const hash = window.location.hash.replace(/^#/, '');
  if (hash) return hash.startsWith('/') ? hash : '/' + hash;
  
  return '/1'; // default route
}

function App() {
  const [route, setRoute] = useState(getRouteKey());

  useEffect(() => {
    const handleUrlChange = () => {
      setRoute(getRouteKey());
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  const modelUrl = MODELS[route] || MODELS['/1'];

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: 'transparent' }}>
      <ModelViewer modelUrl={modelUrl} />
    </div>
  );
}

export default App;
