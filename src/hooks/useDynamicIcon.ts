import { useEffect } from 'react';
import { generateWeatherIcon, getThemeColor } from '../utils/iconGenerator';

interface DynamicIconProps {
  weatherCode: number;
  isDay: boolean;
  temperature: number;
  description: string;
}

export function useDynamicIcon({ weatherCode, isDay, temperature, description }: DynamicIconProps) {
  useEffect(() => {
    if (weatherCode === undefined || temperature === undefined) return;

    // Generate icons
    const faviconDataUrl = generateWeatherIcon(weatherCode, isDay, temperature, 32);
    const pwaIconDataUrl = generateWeatherIcon(weatherCode, isDay, temperature, 512);
    const themeColor = getThemeColor(weatherCode, isDay);

    // Update Favicon
    let iconLink = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!iconLink) {
      iconLink = document.createElement('link');
      iconLink.rel = 'icon';
      document.head.appendChild(iconLink);
    }
    iconLink.href = faviconDataUrl;

    // Update Apple Touch Icon
    let appleIconLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
    if (!appleIconLink) {
      appleIconLink = document.createElement('link');
      appleIconLink.rel = 'apple-touch-icon';
      document.head.appendChild(appleIconLink);
    }
    appleIconLink.href = pwaIconDataUrl;

    // Update Theme Color
    let themeColorMeta = document.querySelector("meta[name='theme-color']") as HTMLMetaElement;
    if (!themeColorMeta) {
      themeColorMeta = document.createElement('meta');
      themeColorMeta.name = 'theme-color';
      document.head.appendChild(themeColorMeta);
    }
    themeColorMeta.content = themeColor;

    // Update Document Title
    document.title = `${Math.round(temperature)}°C · ${description} — Lumina Weather`;

    // Update PWA Manifest dynamically
    const updateManifest = async () => {
      const manifestLink = document.querySelector("link[rel='manifest']") as HTMLLinkElement;
      if (manifestLink) {
        try {
          // Fetch existing manifest to keep other properties
          const res = await fetch(manifestLink.href);
          const manifest = await res.json();
          
          manifest.icons = [
            { src: pwaIconDataUrl, sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
          ];
          manifest.theme_color = themeColor;
          manifest.background_color = themeColor;

          const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          manifestLink.href = url;
        } catch (e) {
          console.error("Failed to update manifest dynamically", e);
        }
      }
    };

    updateManifest();

  }, [weatherCode, isDay, temperature, description]);
}
