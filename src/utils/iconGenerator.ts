/**
 * Utility functions to generate dynamic weather icons using HTML5 Canvas.
 */

/**
 * Maps WMO weather codes to specific visual styles.
 */
const getWeatherStyle = (code: number, isDay: boolean) => {
  if (code === 0 || code === 1) {
    return isDay 
      ? { bg: ['#facc15', '#f97316'], type: 'sun', text: '#ffffff' }
      : { bg: ['#1e1b4b', '#312e81'], type: 'moon', text: '#facc15' };
  }
  if (code === 2 || code === 3) {
    return { bg: ['#9ca3af', '#f3f4f6'], type: 'cloud', text: '#4b5563' };
  }
  if ([51, 53, 55, 61, 63, 80, 81].includes(code)) {
    return { bg: ['#7dd3fc', '#3b82f6'], type: 'rain', text: '#e0f2fe' };
  }
  if ([65, 82].includes(code)) {
    return { bg: ['#1e3a8a', '#172554'], type: 'heavy-rain', text: '#ffffff' };
  }
  if ([71, 73, 75, 85, 86].includes(code)) {
    return { bg: ['#bae6fd', '#ffffff'], type: 'snow', text: '#0ea5e9' };
  }
  if ([95, 96, 99].includes(code)) {
    return { bg: ['#4c1d95', '#000000'], type: 'lightning', text: '#facc15' };
  }
  if ([45, 48].includes(code)) {
    return { bg: ['#9ca3af', '#d1d5db'], type: 'fog', text: '#4b5563' };
  }
  return { bg: ['#3b82f6', '#1d4ed8'], type: 'cloud', text: '#ffffff' };
};

/**
 * Generates a base64 PNG data URL for a weather icon.
 * @param code WMO weather code
 * @param isDay 1 for day, 0 for night
 * @param temperature Current temperature
 * @param size Canvas size (default 512)
 * @returns Data URL string
 */
export function generateWeatherIcon(code: number, isDay: boolean, temperature: number, size = 512): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const style = getWeatherStyle(code, isDay);

  // 1. Draw Background Gradient
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, style.bg[0]);
  gradient.addColorStop(1, style.bg[1]);
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, size * 0.22); // Rounded rectangle like iOS icons
  ctx.fill();

  // 2. Draw Icon Shape
  ctx.save();
  ctx.translate(size / 2, size / 2 - size * 0.1); // Center slightly higher to leave room for text
  
  const drawCircle = (x: number, y: number, r: number, color: string) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  };

  const drawCloud = (color: string) => {
    drawCircle(-size * 0.15, size * 0.05, size * 0.15, color);
    drawCircle(size * 0.15, size * 0.05, size * 0.12, color);
    drawCircle(0, -size * 0.05, size * 0.2, color);
    ctx.fillRect(-size * 0.15, -size * 0.07, size * 0.3, size * 0.27);
  };

  switch (style.type) {
    case 'sun':
      drawCircle(0, 0, size * 0.2, '#ffffff');
      // Rays
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = size * 0.04;
      ctx.lineCap = 'round';
      for (let i = 0; i < 8; i++) {
        ctx.rotate(Math.PI / 4);
        ctx.beginPath();
        ctx.moveTo(0, size * 0.28);
        ctx.lineTo(0, size * 0.38);
        ctx.stroke();
      }
      break;
    case 'moon':
      drawCircle(0, 0, size * 0.25, '#facc15');
      drawCircle(size * 0.08, -size * 0.08, size * 0.2, style.bg[0]); // Cutout
      break;
    case 'cloud':
      drawCloud('#ffffff');
      break;
    case 'rain':
    case 'heavy-rain':
      drawCloud('#ffffff');
      ctx.fillStyle = style.type === 'heavy-rain' ? '#93c5fd' : '#ffffff';
      ctx.beginPath();
      ctx.roundRect(-size * 0.15, size * 0.2, size * 0.04, size * 0.1, size * 0.02);
      ctx.roundRect(0, size * 0.25, size * 0.04, size * 0.1, size * 0.02);
      ctx.roundRect(size * 0.15, size * 0.2, size * 0.04, size * 0.1, size * 0.02);
      if (style.type === 'heavy-rain') {
        ctx.roundRect(-size * 0.07, size * 0.3, size * 0.04, size * 0.1, size * 0.02);
        ctx.roundRect(size * 0.07, size * 0.3, size * 0.04, size * 0.1, size * 0.02);
      }
      ctx.fill();
      break;
    case 'snow':
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = size * 0.04;
      ctx.lineCap = 'round';
      for (let i = 0; i < 6; i++) {
        ctx.rotate(Math.PI / 3);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, size * 0.3);
        ctx.moveTo(0, size * 0.15);
        ctx.lineTo(size * 0.08, size * 0.25);
        ctx.moveTo(0, size * 0.15);
        ctx.lineTo(-size * 0.08, size * 0.25);
        ctx.stroke();
      }
      break;
    case 'lightning':
      drawCloud('#9ca3af');
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(size * 0.05, size * 0.1);
      ctx.lineTo(-size * 0.1, size * 0.25);
      ctx.lineTo(0, size * 0.25);
      ctx.lineTo(-size * 0.05, size * 0.45);
      ctx.lineTo(size * 0.15, size * 0.2);
      ctx.lineTo(0, size * 0.2);
      ctx.closePath();
      ctx.fill();
      break;
    case 'fog':
      ctx.fillStyle = '#ffffff';
      ctx.roundRect(-size * 0.25, -size * 0.1, size * 0.5, size * 0.06, size * 0.03);
      ctx.roundRect(-size * 0.2, 0, size * 0.4, size * 0.06, size * 0.03);
      ctx.roundRect(-size * 0.3, size * 0.1, size * 0.6, size * 0.06, size * 0.03);
      ctx.fill();
      break;
  }
  ctx.restore();

  // 3. Draw Temperature
  ctx.fillStyle = style.text;
  ctx.font = `bold ${size * 0.25}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`${Math.round(temperature)}°`, size / 2, size * 0.95);

  return canvas.toDataURL('image/png');
}

/**
 * Gets the theme color for a specific weather condition.
 */
export function getThemeColor(code: number, isDay: boolean): string {
  return getWeatherStyle(code, isDay).bg[0];
}
