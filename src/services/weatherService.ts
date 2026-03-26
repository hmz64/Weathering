export interface WeatherData {
  current: {
    temp: number;
    description: string;
    icon: string;
    weatherCode: number;
    isDay: boolean;
    humidity: number;
    windSpeed: number;
    uvIndex: number;
    feelsLike: number;
    pressure: number;
    visibility: number;
    precipitation: number;
  };
  hourly: {
    time: string[];
    temp: number[];
    icon: string[];
  };
  daily: {
    time: string[];
    tempMax: number[];
    tempMin: number[];
    icon: string[];
    sunrise: string[];
    sunset: string[];
    precipitationProbability: number[];
  };
}

export interface LocationData {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
}

const WEATHER_CODE_MAP: Record<number, { description: string; icon: string }> = {
  0: { description: "Clear sky", icon: "Sun" },
  1: { description: "Mainly clear", icon: "CloudSun" },
  2: { description: "Partly cloudy", icon: "CloudSun" },
  3: { description: "Overcast", icon: "Cloud" },
  45: { description: "Fog", icon: "CloudFog" },
  48: { description: "Depositing rime fog", icon: "CloudFog" },
  51: { description: "Light drizzle", icon: "CloudDrizzle" },
  53: { description: "Moderate drizzle", icon: "CloudDrizzle" },
  55: { description: "Dense drizzle", icon: "CloudDrizzle" },
  61: { description: "Slight rain", icon: "CloudRain" },
  63: { description: "Moderate rain", icon: "CloudRain" },
  65: { description: "Heavy rain", icon: "CloudRain" },
  71: { description: "Slight snow", icon: "CloudSnow" },
  73: { description: "Moderate snow", icon: "CloudSnow" },
  75: { description: "Heavy snow", icon: "CloudSnow" },
  80: { description: "Slight rain showers", icon: "CloudRain" },
  81: { description: "Moderate rain showers", icon: "CloudRain" },
  82: { description: "Violent rain showers", icon: "CloudRain" },
  95: { description: "Thunderstorm", icon: "CloudLightning" },
};

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,is_day,pressure_msl,surface_pressure,wind_speed_10m,uv_index,visibility,precipitation&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max&timezone=auto`;
  
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch weather data");
  const data = await response.json();

  const currentCode = data.current.weather_code;
  const currentInfo = WEATHER_CODE_MAP[currentCode] || { description: "Unknown", icon: "Cloud" };

  return {
    current: {
      temp: Math.round(data.current.temperature_2m),
      description: currentInfo.description,
      icon: currentInfo.icon,
      weatherCode: currentCode,
      isDay: data.current.is_day === 1,
      humidity: data.current.relative_humidity_2m,
      windSpeed: data.current.wind_speed_10m,
      uvIndex: data.current.uv_index,
      feelsLike: Math.round(data.current.apparent_temperature),
      pressure: data.current.pressure_msl,
      visibility: data.current.visibility / 1000, // km
      precipitation: data.current.precipitation,
    },
    hourly: {
      time: data.hourly.time.slice(0, 24),
      temp: data.hourly.temperature_2m.slice(0, 24).map(Math.round),
      icon: data.hourly.weather_code.slice(0, 24).map((code: number) => WEATHER_CODE_MAP[code]?.icon || "Cloud"),
    },
    daily: {
      time: data.daily.time,
      tempMax: data.daily.temperature_2m_max.map(Math.round),
      tempMin: data.daily.temperature_2m_min.map(Math.round),
      icon: data.daily.weather_code.map((code: number) => WEATHER_CODE_MAP[code]?.icon || "Cloud"),
      sunrise: data.daily.sunrise,
      sunset: data.daily.sunset,
      precipitationProbability: data.daily.precipitation_probability_max,
    },
  };
}

export async function searchLocations(query: string): Promise<LocationData[]> {
  if (query.length < 2) return [];
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
  
  const response = await fetch(url);
  if (!response.ok) return [];
  const data = await response.json();
  return data.results || [];
}

export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  // Open-Meteo doesn't have a direct reverse geocoding API, but we can use Nominatim (OpenStreetMap)
  // or just default to "Current Location" if it fails.
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`;
    const response = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    if (!response.ok) return "Current Location";
    const data = await response.json();
    return data.address.city || data.address.town || data.address.village || data.address.county || "Current Location";
  } catch {
    return "Current Location";
  }
}
