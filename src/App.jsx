import { useEffect } from 'react';
import { AppTheme } from './theme/AppTheme';
import { Map } from './components/Map';

function App() {
  useEffect(() => {
    const updateVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    updateVh();
    window.addEventListener('resize', updateVh);

    return () => window.removeEventListener('resize', updateVh);
  }, []);

  return (
    <AppTheme>
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <Map />
      </div>
    </AppTheme>
  );
}

export default App;