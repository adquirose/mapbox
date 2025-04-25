import React, { useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { collection, getDocs } from 'firebase/firestore';
import { firebaseDB } from '../firebase/config'; // Importar la configuración de Firebase
import CircularProgress from '@mui/material/CircularProgress'; // Importar el componente CircularProgress
import Card from '@mui/material/Card'; // Importar el componente Card
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button'; // Importar el componente Button
import 'mapbox-gl/dist/mapbox-gl.css';
import './Map.css'; // Asegúrate de incluir estilos básicos para el mapa

// Configuración de Mapbox
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export const Map = () => {
  const [map, setMap] = useState(null);
  const [lotes, setLotes] = useState([]);
  const [lastView, setLastView] = useState({ center: [-72.2524, -45.3358], zoom: 10 }); // Reducir el zoom inicial
  const [loading, setLoading] = useState(true); // Estado para controlar la carga
  const [selectedLote, setSelectedLote] = useState(null); // Estado para el lote seleccionado

  useEffect(() => {
    // Obtener los lotes desde Firestore
    const fetchLotes = async () => {
      try {
        const lotesCollection = collection(firebaseDB, 'lotes');
        const lotesSnapshot = await getDocs(lotesCollection);
        const lotesData = lotesSnapshot.docs.map((doc) => {
          const data = doc.data();
          let coordinates = [];

          // Parsear el campo geometry si existe
          if (data.geometry) {
            const geometry = JSON.parse(data.geometry);
            if (geometry.type === 'Polygon' && geometry.coordinates) {
              coordinates = geometry.coordinates;
            }
          }

          return {
            id: doc.id,
            ...data, // Incluir toda la información del lote
            coordinates,
          };
        });

        console.log('Lotes obtenidos:', lotesData); // Depuración
        setLotes(lotesData);
      } catch (error) {
        console.error('Error al obtener los lotes:', error);
      }
    };

    fetchLotes();
  }, []);

  useEffect(() => {
    if (lotes.length > 0) {
      // Calcular los límites de los lotes
      const bounds = new mapboxgl.LngLatBounds();

      lotes.forEach((lote) => {
        if (lote.coordinates.length > 0) {
          lote.coordinates[0].forEach((coord) => {
            if (Array.isArray(coord) && coord.length === 2) {
              bounds.extend(coord);
            }
          });
        }
      });

      // Inicializar el mapa centrado en los lotes o en la última vista
      const mapInstance = new mapboxgl.Map({
        container: 'map', // ID del contenedor
        style: 'mapbox://styles/mapbox/satellite-v9', // Estilo satelital
        center: lastView.center,
        zoom: lastView.zoom,
        pitch: 45, // Configurar perspectiva de 45 grados
        bearing: 0, // Orientación inicial
      });

      mapInstance.on('load', () => {
        if (!bounds.isEmpty()) {
          mapInstance.fitBounds(bounds, { padding: 50 });
        }

        // Habilitar el relieve (Terrain)
        mapInstance.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });

        // Agregar una fuente de elevación para el relieve
        mapInstance.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'mapbox://mapbox.terrain-rgb',
          tileSize: 512,
          maxzoom: 14,
        });

        // Agregar los polígonos al mapa
        lotes.forEach((lote) => {
          if (lote.coordinates.length > 0) {
            console.log(`Agregando lote: ${lote.id}`, lote.coordinates); // Depuración
            mapInstance.addSource(`lote-${lote.id}`, {
              type: 'geojson',
              data: {
                type: 'Feature',
                geometry: {
                  type: 'Polygon',
                  coordinates: lote.coordinates,
                },
                properties: { ...lote }, // Agregar propiedades del lote
              },
            });

            // Capa de relleno
            mapInstance.addLayer({
              id: `lote-fill-${lote.id}`,
              type: 'fill',
              source: `lote-${lote.id}`,
              layout: {},
              paint: {
                'fill-color': '#088',
                'fill-opacity': 0.25, // Más transparencia
              },
            });

            // Capa de borde
            mapInstance.addLayer({
              id: `lote-line-${lote.id}`,
              type: 'line',
              source: `lote-${lote.id}`,
              layout: {},
              paint: {
                'line-color': '#000',
                'line-width': 2,
              },
            });

            // Calcular el centro del polígono
            const center = lote.coordinates[0].reduce(
              (acc, coord) => [acc[0] + coord[0], acc[1] + coord[1]],
              [0, 0]
            ).map((val) => val / lote.coordinates[0].length);

            // Crear un marcador en el centro del polígono
            const loteId = lote.id.replace('lote_', ''); // Eliminar el prefijo "lote_"
            const marker = new mapboxgl.Marker({
              element: createCustomMarker(loteId), // Crear un marcador personalizado
            })
              .setLngLat(center)
              .addTo(mapInstance);

            // Detectar clics en el lote
            mapInstance.on('click', `lote-fill-${lote.id}`, (e) => {
              const properties = e.features[0].properties;
              setSelectedLote(properties); // Guardar el lote seleccionado
            });

            // Resaltar el polígono al hacer hover
            mapInstance.on('mouseenter', `lote-fill-${lote.id}`, () => {
              mapInstance.setPaintProperty(`lote-fill-${lote.id}`, 'fill-opacity', 0.5); // Aumentar la opacidad
            });

            mapInstance.on('mouseleave', `lote-fill-${lote.id}`, () => {
              mapInstance.setPaintProperty(`lote-fill-${lote.id}`, 'fill-opacity', 0.25); // Restaurar la opacidad
            });
          } else {
            console.warn(`Coordenadas inválidas para el lote: ${lote.id}`, lote.coordinates);
          }
        });

        // Ocultar el ícono de carga cuando el mapa esté listo
        setLoading(false);
      });

      // Reducir la velocidad del zoom
      mapInstance.scrollZoom.setZoomRate(0.1); // Hacer el zoom más lento

      // Guardar la última vista al desmontar el mapa
      mapInstance.on('moveend', () => {
        const center = mapInstance.getCenter();
        const zoom = mapInstance.getZoom();
        setLastView({ center: [center.lng, center.lat], zoom: zoom - 1 }); // Reducir el zoom en 1
      });

      setMap(mapInstance);

      return () => mapInstance.remove(); // Limpiar el mapa al desmontar el componente
    }
  }, [lotes]);

  // Crear un marcador personalizado con el ID del lote
  const createCustomMarker = (text) => {
    const marker = document.createElement('div');
    marker.style.backgroundColor = 'transparent'; // Fondo transparente
    marker.style.border = 'none'; // Sin borde
    marker.style.width = 'auto'; // Ajustar al contenido
    marker.style.height = 'auto'; // Ajustar al contenido
    marker.style.display = 'flex';
    marker.style.justifyContent = 'center';
    marker.style.alignItems = 'center';
    marker.style.fontSize = '14px'; // Tamaño de fuente
    marker.style.fontWeight = 'bold';
    marker.style.color = 'white'; // Letras blancas
    marker.textContent = text; // Texto del marcador
    return marker;
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '500px' }}>
      {loading && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
          }}
        >
          <CircularProgress />
        </div>
      )}
      <div id="map" style={{ width: '100%', height: '100%' }}></div>
      {selectedLote && (
        <Card
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            zIndex: 1000,
            width: '300px',
          }}
        >
          <CardContent>
            <Typography variant="h6">Información del Lote</Typography>
            <Typography variant="body2">ID: {selectedLote.id}</Typography>
            <Typography variant="body2">Propiedad: {selectedLote.propiedad || 'N/A'}</Typography>
            <Button
              variant="contained"
              color="secondary"
              style={{ marginTop: '10px' }}
              onClick={() => setSelectedLote(null)} // Cerrar la tarjeta
            >
              Cerrar
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};