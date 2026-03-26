import { WeatherData, LocationData } from "../services/weatherService";
import { WeatherIcon } from "./WeatherIcon";
import { format } from "date-fns";
import { Wind, Droplets, MapPin } from "lucide-react";

interface AndroidWidgetsProps {
  weather: WeatherData;
  location: LocationData;
  convertTemp: (temp: number) => number;
  unitSystem: 'metric' | 'imperial';
}

export function AndroidWidgets({ weather, location, convertTemp, unitSystem }: AndroidWidgetsProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="text-center mb-8">
        <h2 className="text-xl font-light tracking-widest uppercase text-white/60">Android Home Screen Widgets</h2>
        <p className="text-sm text-white/40 mt-2">
          Install this app as a PWA (Add to Home Screen) to view it seamlessly.
          Below are widget previews you can use as inspiration or standalone embeds.
        </p>
      </div>

      {/* 4x2 Widget */}
      <div>
        <h3 className="text-xs uppercase tracking-widest text-white/40 mb-3 px-2">4x2 Detailed Widget</h3>
        <div className="glass rounded-[2rem] p-6 relative overflow-hidden max-w-md mx-auto aspect-[2/1] flex flex-col justify-between shadow-2xl border border-white/20 bg-gradient-to-br from-white/10 to-transparent backdrop-blur-2xl">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-1.5 text-white/80 mb-1">
                <MapPin className="w-3.5 h-3.5" />
                <span className="text-sm font-medium tracking-wide">{location.name}</span>
              </div>
              <p className="text-xs text-white/50">{format(new Date(), "EEEE, d MMM")}</p>
            </div>
            <div className="text-right">
              <span className="text-4xl font-light tracking-tighter">{convertTemp(weather.current.temp)}°</span>
              <p className="text-xs font-medium text-white/70 mt-1 capitalize">{weather.current.description}</p>
            </div>
          </div>

          <div className="flex items-end justify-between mt-4">
            <div className="flex gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1 text-white/50">
                  <Wind className="w-3 h-3" />
                  <span className="text-[10px] uppercase tracking-wider">Wind</span>
                </div>
                <span className="text-xs font-medium">{weather.current.windSpeed} km/h</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1 text-white/50">
                  <Droplets className="w-3 h-3" />
                  <span className="text-[10px] uppercase tracking-wider">Hum</span>
                </div>
                <span className="text-xs font-medium">{weather.current.humidity}%</span>
              </div>
            </div>
            
            <WeatherIcon name={weather.current.icon} className="w-16 h-16 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
          </div>
        </div>
      </div>

      {/* 2x2 Widget */}
      <div>
        <h3 className="text-xs uppercase tracking-widest text-white/40 mb-3 px-2">2x2 Compact Widget</h3>
        <div className="glass rounded-[2rem] p-6 relative overflow-hidden w-40 h-40 mx-auto flex flex-col items-center justify-center shadow-2xl border border-white/20 bg-gradient-to-br from-white/10 to-transparent backdrop-blur-2xl">
          <p className="text-[10px] font-medium tracking-wider text-white/60 mb-2 truncate w-full text-center">{location.name}</p>
          <WeatherIcon name={weather.current.icon} className="w-12 h-12 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] mb-2" />
          <span className="text-3xl font-light tracking-tighter">{convertTemp(weather.current.temp)}°</span>
        </div>
      </div>
      
      {/* 4x1 Widget */}
      <div>
        <h3 className="text-xs uppercase tracking-widest text-white/40 mb-3 px-2">4x1 Glance Widget</h3>
        <div className="glass rounded-full px-6 py-4 relative overflow-hidden max-w-md mx-auto flex items-center justify-between shadow-2xl border border-white/20 bg-gradient-to-r from-white/10 to-transparent backdrop-blur-2xl">
          <div className="flex items-center gap-3">
            <WeatherIcon name={weather.current.icon} className="w-8 h-8 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
            <div className="flex flex-col">
              <span className="text-sm font-medium tracking-wide">{location.name}</span>
              <span className="text-[10px] text-white/50 capitalize">{weather.current.description}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-lg font-light">{convertTemp(weather.current.temp)}°</span>
              <span className="text-[10px] text-white/40">
                H:{convertTemp(weather.daily.tempMax[0])}° L:{convertTemp(weather.daily.tempMin[0])}°
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
