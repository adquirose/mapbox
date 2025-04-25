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
        style: 'mapbox://styles/mapbox/satellite-v9',
        center: [-72.2524, -45.3358],
        zoom: 10,
        pitch: 60,
        bearing: 0,
      });
  
      mapInstance.on('load', () => {
        const bounds = new mapboxgl.LngLatBounds();
  
        lotes.forEach((lote, index) => {
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
                'fill-opacity': 0.5,
              },
            });
  
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
  
            // Cambiar el tono del polígono al hacer hover
            mapInstance.on('mouseenter', `lote-fill-${lote.id}`, () => {
              mapInstance.setPaintProperty(`lote-fill-${lote.id}`, 'fill-opacity', 0.8);
            });
  
            mapInstance.on('mouseleave', `lote-fill-${lote.id}`, () => {
              mapInstance.setPaintProperty(`lote-fill-${lote.id}`, 'fill-opacity', 0.5);
            });
  
            // Calcular el centro del polígono
            const center = lote.coordinates[0].reduce(
              (acc, coord) => [acc[0] + coord[0], acc[1] + coord[1]],
              [0, 0]
            ).map((val) => val / lote.coordinates[0].length);
  
            // Crear un marcador personalizado con solo el número del lote
            const markerElement = document.createElement('div');
            markerElement.style.fontSize = '14px';
            markerElement.style.fontWeight = 'bold';
            markerElement.style.color = 'white'; // Cambiar el color del texto a blanco
            markerElement.style.textShadow = '0px 0px 3px black'; // Agregar sombra para mejor visibilidad
            markerElement.textContent = index + 1; // Número del lote
  
            new mapboxgl.Marker({ element: markerElement })
              .setLngLat(center)
              .addTo(mapInstance);
  
            // Extender los límites del mapa
            lote.coordinates[0].forEach((coord) => {
              bounds.extend(coord);
            });
  
            // Detectar clics en el polígono
            mapInstance.on('click', `lote-fill-${lote.id}`, (e) => {
              const properties = e.features[0].properties;
              setSelectedLote(properties);
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
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
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
      <div id="map"></div>

      {/* Barra de controles en la parte inferior */}
      <div
        style={{
          position: 'absolute',
          bottom: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1001,
          display: 'flex',
          gap: '10px',
          background: 'rgba(255, 255, 255, 0.8)',
          borderRadius: '8px',
          padding: '10px',
        }}
      >
        <IconButton onClick={() => map.panBy([-100, 0])} color="primary">
          <ArrowBack />
        </IconButton>
        <IconButton onClick={() => map.panBy([0, -100])} color="primary">
          <ArrowUpward />
        </IconButton>
        <IconButton onClick={() => map.panBy([0, 100])} color="primary">
          <ArrowDownward />
        </IconButton>
        <IconButton onClick={() => map.panBy([100, 0])} color="primary">
          <ArrowForward />
        </IconButton>
        <IconButton onClick={() => map.zoomIn()} color="secondary">
          <Add />
        </IconButton>
        <IconButton onClick={() => map.zoomOut()} color="secondary">
          <Remove />
        </IconButton>
        <IconButton onClick={() => map.setBearing(map.getBearing() + 10)} color="primary">
          <RotateRight />
        </IconButton>
        <IconButton onClick={() => map.setBearing(map.getBearing() - 10)} color="primary">
          <RotateLeft />
        </IconButton>
      </div>

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
            <Typography variant="body2">
              Propiedad: {selectedLote.propiedad || 'N/A'}
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              style={{ marginTop: '10px' }}
              onClick={() => setSelectedLote(null)}
            >
              Cerrar
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};