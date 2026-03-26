import { useState, useEffect } from 'react';

export interface TimelapseFrame {
  time: string;
  temp: number;
  precipitation: number;
  cloudCover: number;
  windSpeed: number;
  windDirection: number;
  weatherCode: number;
}

export function useTimelapseData(lat: number, lon: number) {
  const [frames, setFrames] = useState<TimelapseFrame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lat || !lon) return;

    const fetchTimelapse = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,cloud_cover,wind_speed_10m,wind_direction_10m,weather_code&past_days=1&forecast_days=1&timezone=auto`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch timelapse data");
        const data = await response.json();

        // Find current hour index
        const now = new Date();
        now.setMinutes(0, 0, 0);
        const nowIso = now.toISOString().slice(0, 16); // Match format roughly, but Open-Meteo returns YYYY-MM-DDTHH:00
        
        let currentIndex = data.hourly.time.findIndex((t: string) => new Date(t).getTime() >= now.getTime());
        if (currentIndex === -1) currentIndex = 24; // fallback

        // Get 12 hours before and 12 hours after
        const startIndex = Math.max(0, currentIndex - 12);
        const endIndex = Math.min(data.hourly.time.length, currentIndex + 13); // +13 to include the 12th hour ahead

        const extractedFrames: TimelapseFrame[] = [];
        for (let i = startIndex; i < endIndex; i++) {
          extractedFrames.push({
            time: data.hourly.time[i],
            temp: data.hourly.temperature_2m[i],
            precipitation: data.hourly.precipitation[i],
            cloudCover: data.hourly.cloud_cover[i],
            windSpeed: data.hourly.wind_speed_10m[i],
            windDirection: data.hourly.wind_direction_10m[i],
            weatherCode: data.hourly.weather_code[i],
          });
        }

        setFrames(extractedFrames);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTimelapse();
  }, [lat, lon]);

  return { frames, loading, error };
}
