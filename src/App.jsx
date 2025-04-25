import { AppTheme } from './theme/AppTheme'; // Importar el tema de la aplicación
import { Map } from './components/Map'; // Importar el componente del mapa

function App() {
  
  return (
    <AppTheme>
      <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
        <Map />
      </div>
    </AppTheme>
  );
}

export default App;