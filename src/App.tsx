import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Wind, 
  Droplets, 
  Sun, 
  Thermometer, 
  Navigation, 
  Eye, 
  Gauge,
  RefreshCw,
  AlertCircle,
  CloudRain,
  Sunrise,
  Sunset,
  Settings,
  Camera
} from "lucide-react";
import { format } from "date-fns";
import { 
  fetchWeather, 
  WeatherData, 
  LocationData, 
  reverseGeocode 
} from "./services/weatherService";
import { WeatherIcon } from "./components/WeatherIcon";
import { SearchBar } from "./components/SearchBar";
import { WeatherMap } from "./components/WeatherMap";
import { AndroidWidgets } from "./components/AndroidWidgets";
import { ARWeatherMode } from "./components/ARWeatherMode";
import { useDynamicIcon } from "./hooks/useDynamicIcon";
import { cn } from "./lib/utils";

export default function App() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');
  const [viewMode, setViewMode] = useState<'app' | 'widgets'>('app');
  const [showSettings, setShowSettings] = useState(false);
  const [showAR, setShowAR] = useState(false);

  const convertTemp = (c: number) => unitSystem === 'imperial' ? Math.round(c * 9 / 5 + 32) : c;
  const convertWind = (kmh: number) => unitSystem === 'imperial' ? Math.round(kmh * 0.621371) : kmh;
  const windUnit = unitSystem === 'imperial' ? 'mph' : 'km/h';

  useDynamicIcon({
    weatherCode: weather?.current.weatherCode || 0,
    isDay: weather?.current.isDay ?? true,
    temperature: convertTemp(weather?.current.temp || 0),
    description: weather?.current.description || 'Loading...'
  });

  const loadWeather = async (lat: number, lon: number, name?: string) => {
    try {
      setRefreshing(true);
      const data = await fetchWeather(lat, lon);
      setWeather(data);
      
      if (!name) {
        const cityName = await reverseGeocode(lat, lon);
        setLocation({ name: cityName, latitude: lat, longitude: lon });
      }
      
      setError(null);
    } catch (err) {
      setError("Failed to load weather data. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          loadWeather(position.coords.latitude, position.coords.longitude);
        },
        () => {
          // Default to London if geolocation fails
          loadWeather(51.5074, -0.1278, "London");
        }
      );
    } else {
      loadWeather(51.5074, -0.1278, "London");
    }
  }, []);

  const handleSelectLocation = (loc: LocationData) => {
    setLocation(loc);
    loadWeather(loc.latitude, loc.longitude, loc.name);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050508] text-white">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <RefreshCw className="w-12 h-12 text-white/20" />
        </motion.div>
        <p className="mt-4 text-white/40 font-light tracking-widest uppercase text-xs">Lumina Weather</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden px-4 py-8 md:px-8 max-w-4xl mx-auto">
      {/* Liquid Background Blobs */}
      <div className="liquid-blob w-[300px] h-[300px] bg-blue-600/20 top-[-50px] left-[-50px]" />
      <div className="liquid-blob w-[400px] h-[400px] bg-purple-600/10 bottom-[-100px] right-[-50px]" />
      <div className="liquid-blob w-[250px] h-[250px] bg-indigo-600/15 top-[40%] right-[-20px]" />

      <header className="mb-8 flex items-center justify-between gap-4 relative z-50">
        <div className="flex-1">
          <SearchBar onSelectLocation={handleSelectLocation} />
        </div>
        <div className="flex bg-white/10 p-1 rounded-full border border-white/20 backdrop-blur-md">
          <button 
            onClick={() => setViewMode('app')}
            className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-colors", viewMode === 'app' ? "bg-white/20 text-white" : "text-white/50 hover:text-white/80")}
          >
            App
          </button>
          <button 
            onClick={() => setViewMode('widgets')}
            className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-colors", viewMode === 'widgets' ? "bg-white/20 text-white" : "text-white/50 hover:text-white/80")}
          >
            Widgets
          </button>
        </div>
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full border border-white/20 backdrop-blur-md transition-colors text-white/80 hover:text-white"
        >
          <Settings className="w-5 h-5" />
        </button>
      </header>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-24 right-4 md:right-8 z-[100] glass p-4 rounded-2xl border border-white/20 shadow-2xl min-w-[200px]"
          >
            <h3 className="text-xs uppercase tracking-widest text-white/40 mb-3">Settings</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/80">Unit System</span>
                <div className="flex bg-white/10 p-1 rounded-full border border-white/20">
                  <button 
                    onClick={() => setUnitSystem('metric')}
                    className={cn("px-2 py-1 rounded-full text-xs font-medium transition-colors", unitSystem === 'metric' ? "bg-white/20 text-white" : "text-white/50")}
                  >
                    °C
                  </button>
                  <button 
                    onClick={() => setUnitSystem('imperial')}
                    className={cn("px-2 py-1 rounded-full text-xs font-medium transition-colors", unitSystem === 'imperial' ? "bg-white/20 text-white" : "text-white/50")}
                  >
                    °F
                  </button>
                </div>
              </div>
              <div className="pt-2 border-t border-white/10">
                <button 
                  onClick={() => {
                    setShowAR(true);
                    setShowSettings(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-xl text-sm transition-colors border border-blue-500/30"
                >
                  <Camera className="w-4 h-4" />
                  Enter AR Mode
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-3xl p-8 text-center"
          >
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-white/80 mb-6">{error}</p>
            <button
              onClick={() => location && loadWeather(location.latitude, location.longitude, location.name)}
              className="bg-white/10 hover:bg-white/20 px-6 py-2 rounded-full transition-colors"
            >
              Retry
            </button>
          </motion.div>
        ) : weather && location && (
          <motion.main
            key={`${location.name}-${viewMode}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {viewMode === 'widgets' ? (
              <AndroidWidgets 
                weather={weather} 
                location={location} 
                convertTemp={convertTemp} 
                unitSystem={unitSystem} 
              />
            ) : (
              <>
                {/* Weather Map - Moved to top as requested */}
                <WeatherMap lat={location.latitude} lon={location.longitude} unitSystem={unitSystem} />

                {/* Current Weather Card */}
            <section className="glass rounded-[2.5rem] p-8 relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-light tracking-tight">{location.name}</h1>
                  <p className="text-white/50 text-sm mt-1">{format(new Date(), "EEEE, d MMMM")}</p>
                </div>
                <button 
                  onClick={() => loadWeather(location.latitude, location.longitude, location.name)}
                  className={cn("p-2 rounded-full bg-white/5 hover:bg-white/10 transition-all", refreshing && "animate-spin")}
                >
                  <RefreshCw className="w-5 h-5 text-white/40" />
                </button>
              </div>

              <div className="mt-12 flex flex-col items-center text-center">
                <div className="relative">
                  <WeatherIcon name={weather.current.icon} className="w-32 h-32 text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.3)]" />
                </div>
                <div className="mt-4">
                  <span className="text-8xl font-thin tracking-tighter">{convertTemp(weather.current.temp)}°</span>
                  <p className="text-xl font-light text-white/70 mt-2">{weather.current.description}</p>
                </div>
              </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 pt-8 border-t border-white/10">
                <div className="text-center">
                  <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Wind</p>
                  <div className="flex items-center justify-center gap-1">
                    <Wind className="w-3 h-3 text-blue-400" />
                    <span className="text-sm font-medium">{convertWind(weather.current.windSpeed)} {windUnit}</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Humidity</p>
                  <div className="flex items-center justify-center gap-1">
                    <Droplets className="w-3 h-3 text-cyan-400" />
                    <span className="text-sm font-medium">{weather.current.humidity}%</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Feels Like</p>
                  <div className="flex items-center justify-center gap-1">
                    <Thermometer className="w-3 h-3 text-orange-400" />
                    <span className="text-sm font-medium">{convertTemp(weather.current.feelsLike)}°</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Precipitation</p>
                  <div className="flex items-center justify-center gap-1">
                    <CloudRain className="w-3 h-3 text-indigo-400" />
                    <span className="text-sm font-medium">{weather.current.precipitation} mm</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Hourly Forecast */}
            <section className="glass rounded-[2rem] p-6 overflow-hidden">
              <h2 className="text-xs uppercase tracking-widest text-white/40 mb-4 px-2">Hourly Forecast</h2>
              <div className="flex gap-6 overflow-x-auto no-scrollbar pb-2">
                {weather.hourly.time.map((time, i) => (
                  <div key={time} className="flex flex-col items-center min-w-[60px] py-2">
                    <span className="text-[10px] text-white/40 mb-3">
                      {i === 0 ? "Now" : format(new Date(time), "HH:mm")}
                    </span>
                    <WeatherIcon name={weather.hourly.icon[i]} className="w-6 h-6 text-white mb-3" />
                    <span className="text-sm font-medium">{convertTemp(weather.hourly.temp[i])}°</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Weather Map */}
            <WeatherMap lat={location.latitude} lon={location.longitude} unitSystem={unitSystem} />

            {/* Details Grid */}
            <section className="grid grid-cols-2 gap-4">
              <div className="glass rounded-3xl p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center">
                  <Sunrise className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/40">Sunrise</p>
                  <p className="text-sm font-medium">{format(new Date(weather.daily.sunrise[0]), "HH:mm")}</p>
                </div>
              </div>
              <div className="glass rounded-3xl p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center">
                  <Sunset className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/40">Sunset</p>
                  <p className="text-sm font-medium">{format(new Date(weather.daily.sunset[0]), "HH:mm")}</p>
                </div>
              </div>
              <div className="glass rounded-3xl p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center">
                  <Sun className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/40">UV Index</p>
                  <p className="text-sm font-medium">{weather.current.uvIndex}</p>
                </div>
              </div>
              <div className="glass rounded-3xl p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/40">Visibility</p>
                  <p className="text-sm font-medium">{weather.current.visibility} km</p>
                </div>
              </div>
              <div className="glass rounded-3xl p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center">
                  <Gauge className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/40">Pressure</p>
                  <p className="text-sm font-medium">{weather.current.pressure} hPa</p>
                </div>
              </div>
              <div className="glass rounded-3xl p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center">
                  <Navigation className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/40">Wind Speed</p>
                  <p className="text-sm font-medium">{convertWind(weather.current.windSpeed)} {windUnit}</p>
                </div>
              </div>
            </section>

            {/* 7-Day Forecast */}
            <section className="glass rounded-[2rem] p-6">
              <h2 className="text-xs uppercase tracking-widest text-white/40 mb-6 px-2">7-Day Forecast</h2>
              <div className="space-y-6">
                {weather.daily.time.map((day, i) => {
                  const minWeek = Math.min(...weather.daily.tempMin);
                  const maxWeek = Math.max(...weather.daily.tempMax);
                  const range = maxWeek - minWeek;
                  const left = ((weather.daily.tempMin[i] - minWeek) / range) * 100;
                  const width = ((weather.daily.tempMax[i] - weather.daily.tempMin[i]) / range) * 100;

                  return (
                    <div key={day} className="flex items-center justify-between px-2 gap-4">
                      <span className="text-sm font-medium w-16">
                        {i === 0 ? "Today" : format(new Date(day), "EEE")}
                      </span>
                      <div className="flex items-center gap-2 w-10">
                        <WeatherIcon name={weather.daily.icon[i]} className="w-5 h-5 text-white/70" />
                      </div>
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-xs font-light text-white/30 w-6 text-right">{convertTemp(weather.daily.tempMin[i])}°</span>
                        <div className="flex-1 h-1.5 bg-white/5 rounded-full relative overflow-hidden">
                          <div 
                            className="absolute h-full bg-gradient-to-r from-blue-400 to-orange-400 rounded-full"
                            style={{ left: `${left}%`, width: `${width}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium w-6">{convertTemp(weather.daily.tempMax[i])}°</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
              </>
            )}
          </motion.main>
        )}
      </AnimatePresence>

      {/* AR Mode Overlay */}
      {showAR && weather && (
        <ARWeatherMode 
          weatherCode={weather.current.weatherCode}
          temperature={convertTemp(weather.current.temp)}
          description={weather.current.description}
          windSpeed={convertWind(weather.current.windSpeed)}
          humidity={weather.current.humidity}
          onClose={() => setShowAR(false)}
        />
      )}

      <footer className="mt-12 text-center">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/20">
          Powered by Open-Meteo
        </p>
      </footer>
    </div>
  );
}
