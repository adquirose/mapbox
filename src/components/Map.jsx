import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client"; // Importar ReactDOMServer
import mapboxgl from "mapbox-gl";
import { collection, getDocs } from "firebase/firestore";
import { firebaseDB } from "../firebase/config";
import {
  ArrowUpward,
  ArrowDownward,
  ArrowBack,
  ArrowForward,
  Add,
  Close,
  Remove,
  RotateLeft,
  RotateRight,
  PhotoCamera
} from "@mui/icons-material";
import HomeIcon from "@mui/icons-material/Home";
import { IconButton, Button, Typography, CardContent, Card, CircularProgress, Dialog, DialogContent, Fade, Box, Tab, Tabs } from "@mui/material";
import { Krpano } from "./Krpano"; 
import "mapbox-gl/dist/mapbox-gl.css";
import "./Map.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const calculateCentroid = (coordinates) => {
  let area = 0;
  let cx = 0;
  let cy = 0;

  const points = coordinates[0]; // Usamos el primer anillo del polígono
  const numPoints = points.length;

  for (let i = 0; i < numPoints - 1; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];
    const factor = x1 * y2 - x2 * y1;

    area += factor;
    cx += (x1 + x2) * factor;
    cy += (y1 + y2) * factor;
  }

  area = area / 2;
  cx = cx / (6 * area);
  cy = cy / (6 * area);

  return [cx, cy];
};

// Componente de transición para el diálogo
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Fade ref={ref} {...props} />;
});

export const Map = () => {
  const [map, setMap] = useState(null);
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLote, setSelectedLote] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0); // Estado para la pestaña seleccionada
  const [isDialogOpen, setIsDialogOpen] = useState(false); // Estado para controlar el diálogo
  const [selectedScene, setSelectedScene] = useState(null);

  // Manejar el atributo `inert` en el contenedor principal
  useEffect(() => {
    const rootElement = document.getElementById("root");
    if (isDialogOpen) {
      rootElement.setAttribute("inert", "true"); // Agregar `inert` cuando el diálogo esté abierto
    } else {
      rootElement.removeAttribute("inert"); // Eliminar `inert` cuando el diálogo esté cerrado
    }

    return () => {
      rootElement.removeAttribute("inert"); // Asegurarse de limpiar el atributo al desmontar
    };
  }, [isDialogOpen]);
  
  useEffect(() => {
    const fetchLotes = async () => {
      try {
        const lotesCollection = collection(firebaseDB, "lotes");
        const lotesSnapshot = await getDocs(lotesCollection);
        const lotesData = lotesSnapshot.docs.map((doc) => {
          const data = doc.data();
          let coordinates = [];

          if (data.geometry) {
            const geometry = JSON.parse(data.geometry);
            if (geometry.type === "Polygon" && geometry.coordinates) {
              coordinates = geometry.coordinates;
            }
          }

          return {
            id: doc.id,
            ...data,
            coordinates,
            len: data.len || 0, // Valor predeterminado para `len`
            reflen: data.reflen || 0, // Valor predeterminado para `reflen`
            class: data.class || "default", // Valor predeterminado para `class`
          };
        });

        setLotes(lotesData);
      } catch (error) {
        console.error("Error al obtener los lotes:", error);
      }
    };

    fetchLotes();
  }, []);

  useEffect(() => {
    if (lotes.length > 0) {
      const mapInstance = new mapboxgl.Map({
        container: "map",
        style: "mapbox://styles/adquirose/cma38r675000h01s1bw4q23zi",
        center: [-72.2524, -45.3358],
        zoom: 10,
        pitch: 0,
        bearing: 0,
      });

      mapInstance.on("load", () => {
        
        const bounds = new mapboxgl.LngLatBounds();
             // Función para crear un marcador con un ícono de cámara
      const createPhotoMarker = (lngLat, sceneName) => {
        const photoMarkerElement = document.createElement("div");
        photoMarkerElement.style.display = "flex";
        photoMarkerElement.style.alignItems = "center";
        photoMarkerElement.style.justifyContent = "center";
        photoMarkerElement.style.width = "40px";
        photoMarkerElement.style.height = "40px";
        photoMarkerElement.style.borderRadius = "50%";
        photoMarkerElement.style.backgroundColor = "white";
        photoMarkerElement.style.boxShadow = "0px 4px 6px rgba(0, 0, 0, 0.1)";
        photoMarkerElement.style.cursor = "pointer";

        photoMarkerElement.style.height = "40px";
        photoMarkerElement.style.borderRadius = "50%";
        photoMarkerElement.style.backgroundColor = "white";
        photoMarkerElement.style.boxShadow = "0px 4px 6px rgba(0, 0, 0, 0.1)";
        photoMarkerElement.style.cursor = "pointer";

        // Renderizar el ícono de Material-UI directamente en el marcador usando ReactDOM.createRoot
        const root = ReactDOM.createRoot(photoMarkerElement);
        root.render(<PhotoCamera fontSize="small" style={{ color: "#333" }} />);
        // Agregar evento de clic al marcador
        photoMarkerElement.addEventListener("click", () => {
          setSelectedScene(sceneName); // Establecer la escena seleccionada
          setIsDialogOpen(true); // Abrir el diálogo
        });

        // Agregar el marcador al mapa
        new mapboxgl.Marker({ element: photoMarkerElement })
          .setLngLat(lngLat) // Coordenadas especificadas
          .addTo(mapInstance);
      };
      
      // Crear el primer marcador para `scene_207`
      createPhotoMarker([-72.21877924218475, -45.328054249773366], "scene_207");

      // Crear el segundo marcador para `scene_76`
      createPhotoMarker([-72.22715432323628, -45.33958015428611], "scene_76"); // Cambia las coordenadas según sea necesario
     

        lotes.forEach((lote) => {
          if (lote.coordinates.length > 0) {
            // Agregar fuente y capa para el polígono
            mapInstance.addSource(`lote-${lote.id}`, {
              type: "geojson",
              data: {
                type: "Feature",
                geometry: {
                  type: "Polygon",
                  coordinates: lote.coordinates,
                },
                properties: {
                  ...lote,
                  len: lote.len || 0, // Proporciona un valor predeterminado si `len` no está definido
                  reflen: lote.reflen || 0, // Proporciona un valor predeterminado si `reflen` no está definido
                  class: lote.class || "default", // Proporciona un valor predeterminado si `class` no está definido
                },
              },
            });

            mapInstance.addLayer({
              id: `lote-fill-${lote.id}`,
              type: "fill",
              source: `lote-${lote.id}`,
              layout: {},
              paint: {
                "fill-color": "#088",
                "fill-opacity": 0.1,
              },
            });

            mapInstance.addLayer({
              id: `lote-line-${lote.id}`,
              type: "line",
              source: `lote-${lote.id}`,
              layout: {},
              paint: {
                "line-color": "#FFF",
                "line-width": 1,
              },
            });

            // Calcular el centroide del polígono
            const center = calculateCentroid(lote.coordinates);

            // Crear un marcador personalizado con el ID del lote sin el prefijo "lote_"
            const markerElement = document.createElement("div");
            markerElement.style.fontSize = "14px";
            markerElement.style.fontWeight = "bold";
            markerElement.style.color = "white";
            markerElement.style.textShadow = "none"; // Sin sombra
            markerElement.style.border = "1px solid white"; // Borde blanco
            markerElement.style.borderRadius = "50%"; // Forma circular
            markerElement.style.padding = "5px";
            markerElement.style.textAlign = "center";
            markerElement.style.width = "30px";
            markerElement.style.height = "30px";
            markerElement.style.display = "flex";
            markerElement.style.alignItems = "center";
            markerElement.style.justifyContent = "center";
            markerElement.style.backgroundColor = "transparent"; // Sin fondo
            markerElement.textContent = lote.id.replace("lote_", ""); // Eliminar el prefijo "lote_"

            const marker = new mapboxgl.Marker({ element: markerElement })
              .setLngLat(center)
              .addTo(mapInstance);

            // Extender los límites del mapa
            lote.coordinates[0].forEach((coord) => {
              bounds.extend(coord);
            });

            // Detectar clics en el polígono
            mapInstance.on("click", `lote-fill-${lote.id}`, () => {
              setSelectedLote(lote);

              // Calcular el desplazamiento para que el polígono quede a la derecha
              const offset = [
                window.innerWidth / 4, // Desplazar hacia la derecha (1/4 del ancho de la ventana)
                0, // Sin desplazamiento vertical
              ];

              mapInstance.setPaintProperty(
                `lote-fill-${lote.id}`,
                "fill-opacity",
                0.5
              ); // Cambiar opacidad
              mapInstance.flyTo({
                center: center, // Centrar en el centroide del polígono
                zoom: 15, // Nivel de zoom
                speed: 1.5, // Velocidad del vuelo
                offset, // Aplicar el desplazamiento
              });
            });

            // Detectar clics en el marcador
            marker.getElement().addEventListener("click", () => {
              setSelectedLote(lote);

              // Calcular el desplazamiento para que el polígono quede a la derecha
              const offset = [
                window.innerWidth / 4, // Desplazar hacia la derecha (1/4 del ancho de la ventana)
                0, // Sin desplazamiento vertical
              ];

              mapInstance.setPaintProperty(
                `lote-fill-${lote.id}`,
                "fill-opacity",
                0.5
              ); // Cambiar opacidad
              mapInstance.flyTo({
                center: center, // Centrar en el centroide del polígono
                zoom: 15, // Nivel de zoom
                speed: 1.5, // Velocidad del vuelo
                offset, // Aplicar el desplazamiento
              });
            });
            // Cambiar dinámicamente el tamaño del marcador según el nivel de zoom
            mapInstance.on("zoom", () => {
              const zoom = mapInstance.getZoom();
              if (zoom < 13) {
                const size = Math.max(10, Math.min(20, zoom * 2)); // Ajustar el tamaño entre 10px y 30px
                markerElement.style.width = `${size}px`;
                markerElement.style.height = `${size}px`;
                markerElement.style.padding = `${size / 6}px`;
                markerElement.style.fontSize = `${14 * 0.75}px`; // 3/4 de 14px
              } else {
                markerElement.style.width = "30px";
                markerElement.style.height = "30px";
                markerElement.style.padding = "5px";
              }
              if (zoom < 12) {
                // Ocultar el marcador
                markerElement.style.display = "none";
              } else {
                // Mostrar el marcador
                markerElement.style.display = "flex";
              }
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
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        backgroundColor: "gray",
      }}
    >
      {loading && (
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 1000,
          }}
        >
          <CircularProgress />
        </Box>
      )}
      <Box sx={{ width: "100%", height: "100%" }} id="map"></Box>
      {/* Dialog con Krpano */}
      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)} // Cerrar el diálogo
        fullWidth
        maxWidth="lg" // Tamaño del diálogo
        slots={{ transition: Transition }} // Usar slots.transition en lugar de TransitionComponent
      >
        <DialogContent style={{ position: "relative", padding: 0, height: "500px" }}>
          {/* Botón de cerrar */}
          <IconButton
            onClick={() => setIsDialogOpen(false)}
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              zIndex: 1001,
              backgroundColor: "white",
              borderRadius: "50%",
              boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Close />
          </IconButton>

          {/* Componente Krpano */}
          <Krpano scene={selectedScene}/>
        </DialogContent>
      </Dialog>
      {/* Barra lateral para rotación */}
      <Box
        sx={{
          position: "absolute",
          top: "10px",
          right: "10px",
          zIndex: 1001,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          background: "rgba(0, 0, 0, 0.5)",
          borderRadius: "8px",
          padding: "10px",
        }}
      >
        <IconButton
          onClick={() => map.setBearing(map.getBearing() - 10)}
          sx={{ color: "white" }}
        >
          <RotateLeft />
        </IconButton>
        <IconButton
          onClick={() => map.setBearing(map.getBearing() + 10)}
          sx={{ color: "white" }}
        >
          <RotateRight />
        </IconButton>
      </Box>

      {/* Barra de controles en la parte inferior */}
      <Box
        sx={{
          position: "absolute",
          bottom: "5px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1001,
          display: "flex",
          gap: "10px",
          background: "rgba(0, 0, 0, 0.5)",
          borderRadius: "8px",
          padding: "10px",
        }}
      >
        <IconButton
          onClick={() => map.panBy([-100, 0])}
          sx={{ color: "white" }}
        >
          <ArrowBack />
        </IconButton>
        <IconButton
          onClick={() => map.panBy([0, -100])}
          sx={{ color: "white" }}
        >
          <ArrowUpward />
        </IconButton>
        <IconButton onClick={() => map.panBy([0, 100])} sx={{ color: "white" }}>
          <ArrowDownward />
        </IconButton>
        <IconButton onClick={() => map.panBy([100, 0])} sx={{ color: "white" }}>
          <ArrowForward />
        </IconButton>
        <IconButton onClick={() => map.zoomIn()} sx={{ color: "white" }}>
          <Add />
        </IconButton>
        <IconButton onClick={() => map.zoomOut()} sx={{ color: "white" }}>
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
          sx={{ color: "white" }}
        >
          <HomeIcon />
        </IconButton>
      </Box>

      {selectedLote && (
        <>
          {/* Capa de bloqueo del mapa */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0, 0, 0, 0.5)", // Fondo semitransparente
              zIndex: 999, // Debajo de la tarjeta
            }}
            onClick={() => {
              // Cerrar la tarjeta al hacer clic en la capa de bloqueo
              map.setPaintProperty(
                `lote-fill-${selectedLote.id}`,
                "fill-opacity",
                0.1
              ); // Restaurar opacidad
              setSelectedLote(null);
            }}
          ></div>
          {/* Tarjeta */}
          <Card
            style={{
              position: "absolute",
              top: "50%", // Centrado verticalmente
              left: "10px", // A 10px de la izquierda
              transform: "translateY(-50%)", // Ajuste para centrar verticalmente
              zIndex: 1000,
              width: "300px",
              minHeight: "fit-content", // Altura mínima ajustada al contenido
              overflow: "visible",
            }}
          >
            <CardContent>
              {/* Botón de cerrar estilizado */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <IconButton
                  onClick={() => {
                    map.setPaintProperty(
                      `lote-fill-${selectedLote.id}`,
                      "fill-opacity",
                      0.1
                    ); // Restaurar opacidad
                    setSelectedLote(null);
                    const bounds = new mapboxgl.LngLatBounds();
                    lotes.forEach((lote) => {
                      lote.coordinates[0].forEach((coord) =>
                        bounds.extend(coord)
                      );
                    });
                    if (!bounds.isEmpty()) {
                      map.fitBounds(bounds, { padding: 50, duration: 2000 });
                    }
                  }}
                  style={{
                    backgroundColor: "transparent", // Fondo blanco
                    border: "none", // Borde gris claro
                    borderRadius: "50%", // Forma circular
                    boxShadow: "none", // Sombra ligera
                    padding: "5px",
                  }}
                >
                  <Close style={{ fontSize: "21px", color: "#333" }} />{" "}
                  {/* Ícono de cerrar */}
                </IconButton>
              </div>

              {/* Pestañas */}
              <Tabs
                value={selectedTab}
                onChange={(e, newValue) => setSelectedTab(newValue)}
                indicatorColor="primary"
                textColor="primary"
                variant="fullWidth"
              >
                <Tab label="Info" />
                <Tab label="Contacto" />
              </Tabs>

              {/* Contenido de las pestañas */}
              {selectedTab === 0 && (
                <div
                  style={{
                    marginTop: "20px",
                    minHeight: "250px", // Igualar la altura mínima a la de "Contacto"
                  }}
                >
                  {/* Sección de información */}
                  <Typography variant="h6" style={{ marginBottom: "16px" }}>
                    {`Lote ${selectedLote.id.replace("lote_", "")}`}
                  </Typography>
                  <Typography variant="body2" style={{ marginBottom: "12px" }}>
                    <strong>Estado:</strong> {selectedLote.estado || "N/A"}
                  </Typography>
                  <Typography variant="body2" style={{ marginBottom: "12px" }}>
                    <strong>Superficie:</strong>{" "}
                    {selectedLote.superficie || "N/A"} Ha.
                  </Typography>
                  <Typography variant="body2">
                    <strong>Valor:</strong> ${selectedLote.valor || "N/A"}
                  </Typography>
                </div>
              )}

              {selectedTab === 1 && (
                <div
                  style={{
                    marginTop: "10px",
                    minHeight: "250px", // Igualar la altura mínima a la de "Info"
                  }}
                >
                  {/* Sección de contacto */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      console.log("Formulario enviado");
                    }}
                  >
                    {/* Campo Nombre */}
                    <div style={{ marginBottom: "8px" }}>
                      <label
                        htmlFor="nombre"
                        style={{ fontSize: "12px", display: "block" }}
                      >
                        Nombre:
                      </label>
                      <input
                        type="text"
                        id="nombre"
                        name="nombre"
                        required
                        style={{
                          width: "100%",
                          padding: "6px",
                          marginTop: "3px",
                          borderRadius: "4px",
                          border: "1px solid #ccc",
                          fontSize: "12px",
                        }}
                      />
                    </div>

                    {/* Campo RUT */}
                    <div style={{ marginBottom: "8px" }}>
                      <label
                        htmlFor="rut"
                        style={{ fontSize: "12px", display: "block" }}
                      >
                        RUT:
                      </label>
                      <input
                        type="text"
                        id="rut"
                        name="rut"
                        required
                        pattern="^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$"
                        title="Formato válido: 12.345.678-9"
                        style={{
                          width: "100%",
                          padding: "6px",
                          marginTop: "3px",
                          borderRadius: "4px",
                          border: "1px solid #ccc",
                          fontSize: "12px",
                        }}
                      />
                    </div>

                    {/* Campo Email */}
                    <div style={{ marginBottom: "8px" }}>
                      <label
                        htmlFor="email"
                        style={{ fontSize: "12px", display: "block" }}
                      >
                        Email:
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        style={{
                          width: "100%",
                          padding: "6px",
                          marginTop: "3px",
                          borderRadius: "4px",
                          border: "1px solid #ccc",
                          fontSize: "12px",
                        }}
                      />
                    </div>

                    {/* Campo Teléfono */}
                    <div style={{ marginBottom: "8px" }}>
                      <label
                        htmlFor="telefono"
                        style={{ fontSize: "12px", display: "block" }}
                      >
                        Teléfono:
                      </label>
                      <input
                        type="tel"
                        id="telefono"
                        name="telefono"
                        required
                        pattern="^\+?\d{9,15}$"
                        title="Debe ser un número de teléfono válido"
                        style={{
                          width: "100%",
                          padding: "6px",
                          marginTop: "3px",
                          borderRadius: "4px",
                          border: "1px solid #ccc",
                          fontSize: "12px",
                        }}
                      />
                    </div>

                    {/* Botón de Enviar */}
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      style={{
                        width: "100%",
                        padding: "6px",
                        fontSize: "12px",
                      }}
                    >
                      Enviar
                    </Button>
                  </form>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
};
