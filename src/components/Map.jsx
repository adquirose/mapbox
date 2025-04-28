import React, { useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { collection, getDocs } from 'firebase/firestore';
import { firebaseDB } from '../firebase/config';
import CircularProgress from '@mui/material/CircularProgress';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import { ArrowUpward, ArrowDownward, ArrowBack, ArrowForward, Add, Remove, RotateLeft, RotateRight } from '@mui/icons-material';
import HomeIcon from '@mui/icons-material/Home';
import { Box } from '@mui/material';
import 'mapbox-gl/dist/mapbox-gl.css';
import './Map.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export const Map = () => {
  const [map, setMap] = useState(null);
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLote, setSelectedLote] = useState(null);

  useEffect(() => {
    const fetchLotes = async () => {
      try {
        const lotesCollection = collection(firebaseDB, 'lotes');
        const lotesSnapshot = await getDocs(lotesCollection);
        const lotesData = lotesSnapshot.docs.map((doc) => {
          const data = doc.data();
          let coordinates = [];

          if (data.geometry) {
            const geometry = JSON.parse(data.geometry);
            if (geometry.type === 'Polygon' && geometry.coordinates) {
              coordinates = geometry.coordinates;
            }
          }

          return {
            id: doc.id,
            ...data,
            coordinates,
          };
        });

        setLotes(lotesData);
      } catch (error) {
        console.error('Error al obtener los lotes:', error);
      }
    };

    fetchLotes();
  }, []);

  useEffect(() => {
    if (lotes.length > 0) {
      const mapInstance = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/adquirose/cma1kkbav003f01qn86l26jet',
        center: [-72.2524, -45.3358],
        zoom: 10,
        pitch: 60,
        bearing: 0,
      });

      mapInstance.on('load', () => {
        const bounds = new mapboxgl.LngLatBounds();

        lotes.forEach((lote) => {
          if (lote.coordinates.length > 0) {
            // Agregar fuente y capa para el polígono
            mapInstance.addSource(`lote-${lote.id}`, {
              type: 'geojson',
              data: {
                type: 'Feature',
                geometry: {
                  type: 'Polygon',
                  coordinates: lote.coordinates,
                },
                properties: { ...lote },
              },
            });

            mapInstance.addLayer({
              id: `lote-fill-${lote.id}`,
              type: 'fill',
              source: `lote-${lote.id}`,
              layout: {},
              paint: {
                'fill-color': '#088',
                'fill-opacity': 0.1,
              },
            });

            mapInstance.addLayer({
              id: `lote-line-${lote.id}`,
              type: 'line',
              source: `lote-${lote.id}`,
              layout: {},
              paint: {
                'line-color': '#FFF',
                'line-width': 1,
              },
            });

            // Calcular el centro del polígono
            const center = lote.coordinates[0].reduce(
              (acc, coord) => [acc[0] + coord[0], acc[1] + coord[1]],
              [0, 0]
            ).map((val) => val / lote.coordinates[0].length);

            // Crear un marcador personalizado con el ID del lote sin el prefijo "lote_"
            const markerElement = document.createElement('div');
            markerElement.style.fontSize = '14px';
            markerElement.style.fontWeight = 'bold';
            markerElement.style.color = 'white';
            markerElement.style.textShadow = 'none'; // Sin sombra
            markerElement.style.border = '1px solid white'; // Borde blanco
            markerElement.style.borderRadius = '50%'; // Forma circular
            markerElement.style.padding = '5px';
            markerElement.style.textAlign = 'center';
            markerElement.style.width = '30px';
            markerElement.style.height = '30px';
            markerElement.style.display = 'flex';
            markerElement.style.alignItems = 'center';
            markerElement.style.justifyContent = 'center';
            markerElement.style.backgroundColor = 'transparent'; // Sin fondo
            markerElement.textContent = lote.id.replace('lote_', ''); // Eliminar el prefijo "lote_"

            const marker = new mapboxgl.Marker({ element: markerElement })
              .setLngLat(center)
              .addTo(mapInstance);

            // Extender los límites del mapa
            lote.coordinates[0].forEach((coord) => {
              bounds.extend(coord);
            });

            // Detectar clics en el polígono
            mapInstance.on('click', `lote-fill-${lote.id}`, () => {
              setSelectedLote(lote);
              mapInstance.setPaintProperty(`lote-fill-${lote.id}`, 'fill-opacity', 0.5); // Cambiar opacidad
              mapInstance.flyTo({
                center: center,
                zoom: 15, // Zoom hacia el polígono
                speed: 1.5,
              });
            });

            // Detectar clics en el marcador
            marker.getElement().addEventListener('click', () => {
              setSelectedLote(lote);
              mapInstance.setPaintProperty(`lote-fill-${lote.id}`, 'fill-opacity', 0.5); // Cambiar opacidad
              mapInstance.flyTo({
                center: center,
                zoom: 15, // Zoom hacia el marcador
                speed: 1.5,
              });
            });
          }
        });

        // Ajustar el mapa para que todos los polígonos sean visibles
        if (!bounds.isEmpty()) {
          mapInstance.fitBounds(bounds, {
            padding: 50,
            duration: 2000,
          });
        }

        setLoading(false);
      });

      setMap(mapInstance);

      return () => mapInstance.remove();
    }
  }, [lotes]);

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%', backgroundColor: 'gray' }}>
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
          }}
        >
          <CircularProgress />
        </Box>
      )}
      <Box sx={{ width: '100%', height: '100%' }} id="map"></Box>

      {/* Barra lateral para rotación */}
      <Box
        sx={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 1001,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          background: 'rgba(0, 0, 0, 0.5)',
          borderRadius: '8px',
          padding: '10px',
        }}
      >
        <IconButton onClick={() => map.setBearing(map.getBearing() - 10)} sx={{ color: 'white' }}>
          <RotateLeft />
        </IconButton>
        <IconButton onClick={() => map.setBearing(map.getBearing() + 10)} sx={{ color: 'white' }}>
          <RotateRight />
        </IconButton>
      </Box>

      {/* Barra de controles en la parte inferior */}
      <Box
        sx={{
          position: 'absolute',
          bottom: '5px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1001,
          display: 'flex',
          gap: '10px',
          background: 'rgba(0, 0, 0, 0.5)',
          borderRadius: '8px',
          padding: '10px',
        }}
      >
        <IconButton onClick={() => map.panBy([-100, 0])} sx={{ color: 'white' }}>
          <ArrowBack />
        </IconButton>
        <IconButton onClick={() => map.panBy([0, -100])} sx={{ color: 'white' }}>
          <ArrowUpward />
        </IconButton>
        <IconButton onClick={() => map.panBy([0, 100])} sx={{ color: 'white' }}>
          <ArrowDownward />
        </IconButton>
        <IconButton onClick={() => map.panBy([100, 0])} sx={{ color: 'white' }}>
          <ArrowForward />
        </IconButton>
        <IconButton onClick={() => map.zoomIn()} sx={{ color: 'white' }}>
          <Add />
        </IconButton>
        <IconButton onClick={() => map.zoomOut()} sx={{ color: 'white' }}>
          <Remove />
        </IconButton>
        <IconButton
          onClick={() => {
            const bounds = new mapboxgl.LngLatBounds();
            lotes.forEach((lote) => {
              lote.coordinates[0].forEach((coord) => bounds.extend(coord));
            });
            if (!bounds.isEmpty()) {
              map.fitBounds(bounds, { padding: 50, duration: 2000 });
            }
          }}
          sx={{ color: 'white' }}
        >
          <HomeIcon />
        </IconButton>
      </Box>

      {selectedLote && (
        <Card
          style={{
            position: 'absolute',
            bottom: '50%',
            left: '20px',
            zIndex: 1000,
            width: '300px',
          }}
        >
          <CardContent>
            <Typography variant="h6">{`Lote ${selectedLote.id.replace('lote_', '')}`}</Typography>
            <Typography variant="body2">
              <strong>Estado:</strong> {selectedLote.estado || 'N/A'}
            </Typography>
            <Typography variant="body2">
              <strong>Superficie:</strong> {selectedLote.superficie || 'N/A'} m²
            </Typography>
            <Typography variant="body2">
              <strong>Valor:</strong> ${selectedLote.valor || 'N/A'}
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              style={{ marginTop: '10px' }}
              onClick={() => {
                map.setPaintProperty(`lote-fill-${selectedLote.id}`, 'fill-opacity', 0.1); // Restaurar opacidad
                setSelectedLote(null);
                const bounds = new mapboxgl.LngLatBounds();
                lotes.forEach((lote) => {
                  lote.coordinates[0].forEach((coord) => bounds.extend(coord));
                });
                if (!bounds.isEmpty()) {
                  map.fitBounds(bounds, { padding: 50, duration: 2000 });
                }
              }}
            >
              Cerrar
            </Button>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};