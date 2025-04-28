import { AppTheme } from './theme/AppTheme'; // Importar el tema de la aplicación
import { Map } from './components/Map'; // Importar el componente del mapa
import { Box } from '@mui/material'; // Importar el componente Box de Material UI
function App() {
  return (
    <AppTheme>
      <Box sx={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#f0f0f0', paddingBottom:{xs:'35px',md:0} }}>
        <Map />
      </Box>
    </AppTheme>
  );
}

export default App;