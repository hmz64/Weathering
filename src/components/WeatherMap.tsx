import { useEffect, useState, Suspense, lazy } from "react";
import { 
  MapContainer, 
  TileLayer, 
  useMap, 
  LayersControl, 
  Marker, 
  Popup,
  useMapEvents
} from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";
import { motion, AnimatePresence } from "motion/react";
import { Wind, CloudRain, Thermometer, Cloud, Crosshair, Globe, Map as MapIcon, Clock } from "lucide-react";
import { cn } from "../lib/utils";
import { useTimelapseData, TimelapseFrame } from "../hooks/useTimelapseData";
import { TimelapsePlayer } from "./TimelapsePlayer";

const WeatherGlobe = lazy(() => import('./WeatherGlobe').then(module => ({ default: module.WeatherGlobe })));

// Fix Leaflet marker icons
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface WeatherMapProps {
  lat: number;
  lon: number;
  unitSystem: 'metric' | 'imperial';
}

type LayerType = "wind" | "rain" | "temp" | "cloud";

// --- Heatmap Layer Component ---
function HeatmapLayer({ lat, lon, active }: { lat: number; lon: number; active: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (!active) return;

    let heatLayer: any;

    const fetchHeatData = async () => {
      try {
        // Fetch a 5x5 grid around the location
        const points: [number, number, number][] = [];
        const step = 0.5; // ~50km
        const queries = [];

        for (let i = -2; i <= 2; i++) {
          for (let j = -2; j <= 2; j++) {
            const pLat = lat + i * step;
            const pLon = lon + j * step;
            queries.push(
              fetch(`https://api.open-meteo.com/v1/forecast?latitude=${pLat}&longitude=${pLon}&current=temperature_2m`)
                .then(r => r.json())
                .then(data => [pLat, pLon, data.current.temperature_2m] as [number, number, number])
            );
          }
        }

        const results = await Promise.all(queries);
        // @ts-ignore
        heatLayer = L.heatLayer(results, {
          radius: 60,
          blur: 40,
          maxZoom: 10,
          gradient: {
            0.0: "#1e3a8a", // Deep Blue < 10
            0.2: "#3b82f6", // Blue 15
            0.4: "#10b981", // Green 22
            0.6: "#facc15", // Yellow 28
            0.8: "#f97316", // Orange 33
            1.0: "#ef4444", // Red > 38
          }
        }).addTo(map);
      } catch (err) {
        console.error("Heatmap fetch error:", err);
      }
    };

    fetchHeatData();

    return () => {
      if (heatLayer) map.removeLayer(heatLayer);
    };
  }, [map, lat, lon, active]);

  return null;
}

// --- RainViewer Layer Component ---
function RainLayer({ active }: { active: boolean }) {
  const [timestamp, setTimestamp] = useState<number | null>(null);
  const map = useMap();

  useEffect(() => {
    if (!active) return;

    fetch("https://tilecache.rainviewer.com/api/public/weather-maps.json")
      .then(r => r.json())
      .then(data => {
        if (data.radar && data.radar.past && data.radar.past.length > 0) {
          setTimestamp(data.radar.past[data.radar.past.length - 1].time);
        }
      });
  }, [active]);

  if (!active || !timestamp) return null;

  return (
    <TileLayer
      url={`https://tilecache.rainviewer.com/v2/radar/${timestamp}/256/{z}/{x}/{y}/2/1_1.png`}
      opacity={0.6}
      zIndex={100}
    />
  );
}

// --- Cloud Layer Component ---
function CloudLayer({ lat, lon, active }: { lat: number; lon: number; active: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (!active) return;

    let cloudLayer: any;

    const fetchCloudData = async () => {
      try {
        const points: [number, number, number][] = [];
        const step = 0.5;
        const queries = [];

        for (let i = -2; i <= 2; i++) {
          for (let j = -2; j <= 2; j++) {
            const pLat = lat + i * step;
            const pLon = lon + j * step;
            queries.push(
              fetch(`https://api.open-meteo.com/v1/forecast?latitude=${pLat}&longitude=${pLon}&current=cloud_cover`)
                .then(r => r.json())
                .then(data => [pLat, pLon, data.current.cloud_cover / 100] as [number, number, number])
            );
          }
        }

        const results = await Promise.all(queries);
        // @ts-ignore
        cloudLayer = L.heatLayer(results, {
          radius: 80,
          blur: 50,
          maxZoom: 10,
          gradient: {
            0.0: "rgba(255,255,255,0)",
            0.5: "rgba(255,255,255,0.4)",
            1.0: "rgba(255,255,255,0.8)"
          }
        }).addTo(map);
      } catch (err) {
        console.error("Cloud fetch error:", err);
      }
    };

    fetchCloudData();

    return () => {
      if (cloudLayer) map.removeLayer(cloudLayer);
    };
  }, [map, lat, lon, active]);

  return null;
}

// --- Wind Particle Layer (Custom Canvas) ---
function WindLayer({ lat, lon, active }: { lat: number; lon: number; active: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (!active) return;

    const canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "400";
    
    const pane = map.getPanes().overlayPane;
    pane.appendChild(canvas);

    let animationFrame: number;
    let particles: any[] = [];
    const particleCount = 1000;

    const resize = () => {
      const size = map.getSize();
      canvas.width = size.x;
      canvas.height = size.y;
    };

    const initParticles = () => {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          life: Math.random() * 100,
          speed: 1 + Math.random() * 2,
          angle: Math.PI / 4 // Default angle
        });
      }
    };

    // Fetch wind data for the center to set global direction for this demo
    // In a real grid, we'd fetch multiple points
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=wind_speed_10m,wind_direction_10m`)
      .then(r => r.json())
      .then(data => {
        const angle = (data.current.wind_direction_10m - 90) * (Math.PI / 180);
        const speed = data.current.wind_speed_10m / 5;
        particles.forEach(p => {
          p.angle = angle;
          p.speed = 1 + speed * Math.random();
        });
      });

    const draw = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 1.5;

      particles.forEach(p => {
        ctx.beginPath();
        const opacity = Math.min(p.life / 20, (100 - p.life) / 20);
        
        // Color based on speed
        let color = "rgba(59, 130, 246,"; // Blue
        if (p.speed > 4) color = "rgba(234, 179, 8,"; // Yellow
        if (p.speed > 7) color = "rgba(239, 68, 68,"; // Red
        
        ctx.strokeStyle = `${color}${opacity * 0.5})`;
        
        const nextX = p.x + Math.cos(p.angle) * p.speed;
        const nextY = p.y + Math.sin(p.angle) * p.speed;
        
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(nextX, nextY);
        ctx.stroke();

        p.x = nextX;
        p.y = nextY;
        p.life -= 0.5;

        if (p.life <= 0 || p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) {
          p.x = Math.random() * canvas.width;
          p.y = Math.random() * canvas.height;
          p.life = 100;
        }
      });

      animationFrame = requestAnimationFrame(draw);
    };

    map.on("move", () => {
      const pos = map.containerPointToLayerPoint([0, 0]);
      L.DomUtil.setPosition(canvas, pos);
    });

    resize();
    initParticles();
    draw();

    return () => {
      cancelAnimationFrame(animationFrame);
      pane.removeChild(canvas);
    };
  }, [map, active, lat, lon]);

  return null;
}

// --- Main Map Component ---
export function WeatherMap({ lat, lon, unitSystem }: WeatherMapProps) {
  const [activeLayer, setActiveLayer] = useState<LayerType>("temp");
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [is3D, setIs3D] = useState(false);
  const [showTimelapse, setShowTimelapse] = useState(false);
  const [currentFrame, setCurrentFrame] = useState<TimelapseFrame | null>(null);
  const { frames } = useTimelapseData(lat, lon);

  const layers: { id: LayerType; label: string; icon: any }[] = [
    { id: "wind", label: "Wind", icon: Wind },
    { id: "rain", label: "Rain", icon: CloudRain },
    { id: "temp", label: "Temp", icon: Thermometer },
    { id: "cloud", label: "Cloud", icon: Cloud },
  ];

  const handleRecenter = () => {
    if (mapInstance) {
      mapInstance.setView([lat, lon], 7);
    }
  };

  return (
    <section className="space-y-4 relative">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-xs uppercase tracking-widest text-white/40">Weather Map</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTimelapse(!showTimelapse)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
              showTimelapse ? "bg-blue-500/20 text-blue-300 border-blue-500/30" : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
            )}
          >
            <Clock className="w-3.5 h-3.5" />
            Time-lapse
          </button>
          <div className="flex bg-white/5 p-1 rounded-full border border-white/10">
            <button
              onClick={() => setIs3D(false)}
              className={cn("px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5", !is3D ? "bg-white/20 text-white" : "text-white/40 hover:text-white/60")}
            >
              <MapIcon className="w-3.5 h-3.5" />
              2D
            </button>
            <button
              onClick={() => setIs3D(true)}
              className={cn("px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5", is3D ? "bg-white/20 text-white" : "text-white/40 hover:text-white/60")}
            >
              <Globe className="w-3.5 h-3.5" />
              3D
            </button>
          </div>
        </div>
      </div>

      <div className="relative h-[60vh] rounded-[2.5rem] overflow-hidden glass border border-white/10">
        {is3D ? (
          <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-white/50">Loading 3D Globe...</div>}>
            <WeatherGlobe lat={lat} lon={lon} activeLayer={activeLayer} frameData={currentFrame} />
          </Suspense>
        ) : (
          <MapContainer
            center={[lat, lon]}
            zoom={7}
            scrollWheelZoom={false}
            className="h-full w-full z-10"
            ref={setMapInstance}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            
            <HeatmapLayer lat={lat} lon={lon} active={activeLayer === "temp"} />
            <RainLayer active={activeLayer === "rain"} />
            <CloudLayer lat={lat} lon={lon} active={activeLayer === "cloud"} />
            <WindLayer lat={lat} lon={lon} active={activeLayer === "wind"} />

            <Marker position={[lat, lon]}>
              <Popup>Your Location</Popup>
            </Marker>
          </MapContainer>
        )}

        {/* Layer Switcher */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex p-1 glass rounded-full border border-white/20 backdrop-blur-xl">
          {layers.map((layer) => (
            <button
              key={layer.id}
              onClick={() => setActiveLayer(layer.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all duration-300",
                activeLayer === layer.id 
                  ? "bg-white/20 text-white shadow-lg" 
                  : "text-white/40 hover:text-white/60"
              )}
            >
              <layer.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{layer.label}</span>
            </button>
          ))}
        </div>

        {/* Recenter Button */}
        {!is3D && (
          <button
            onClick={handleRecenter}
            className="absolute top-4 right-4 z-[1000] p-3 glass rounded-full border border-white/20 text-white/60 hover:text-white transition-all active:scale-95"
          >
            <Crosshair className="w-5 h-5" />
          </button>
        )}

        {/* Legend */}
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-6 left-6 z-[1000] p-4 glass rounded-2xl border border-white/10 min-w-[160px]"
          >
            <p className="text-[10px] uppercase tracking-wider text-white/40 mb-3">
              {activeLayer.charAt(0).toUpperCase() + activeLayer.slice(1)} Legend
            </p>
            
            {activeLayer === "temp" && (
              <div className="space-y-2">
                <div className="h-2 w-full rounded-full bg-gradient-to-r from-[#1e3a8a] via-[#10b981] via-[#facc15] to-[#ef4444]" />
                <div className="flex justify-between text-[10px] text-white/40">
                  <span>{unitSystem === 'imperial' ? '50°F' : '10°C'}</span>
                  <span>{unitSystem === 'imperial' ? '77°F' : '25°C'}</span>
                  <span>{unitSystem === 'imperial' ? '104°F' : '40°C'}</span>
                </div>
              </div>
            )}

            {activeLayer === "wind" && (
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-[10px] text-white/60">Light</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <span className="text-[10px] text-white/60">Moderate</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-[10px] text-white/60">Strong</span>
                  </div>
                </div>
              </div>
            )}

            {activeLayer === "rain" && (
              <div className="space-y-2">
                <div className="h-2 w-full rounded-full bg-gradient-to-r from-cyan-400 to-indigo-600" />
                <div className="flex justify-between text-[10px] text-white/40">
                  <span>Light</span>
                  <span>Heavy</span>
                </div>
              </div>
            )}

            {activeLayer === "cloud" && (
              <div className="space-y-2">
                <div className="h-2 w-full rounded-full bg-gradient-to-r from-transparent to-white/80" />
                <div className="flex justify-between text-[10px] text-white/40">
                  <span>Clear</span>
                  <span>Overcast</span>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Time-lapse Player */}
      {showTimelapse && frames.length > 0 && (
        <TimelapsePlayer 
          frames={frames} 
          onFrameChange={(frame) => setCurrentFrame(frame)} 
          onClose={() => {
            setShowTimelapse(false);
            setCurrentFrame(null);
          }} 
        />
      )}
    </section>
  );
}
