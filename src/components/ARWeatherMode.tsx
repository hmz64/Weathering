import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { XR, createXRStore } from '@react-three/xr';
import { WeatherParticles, FloatingWeatherCard } from './ARComponents';
import { X } from 'lucide-react';

const store = createXRStore({
  emulate: false,
});

interface ARWeatherModeProps {
  weatherCode: number;
  temperature: number;
  description: string;
  windSpeed: number;
  humidity: number;
  onClose: () => void;
}

export function ARWeatherMode({ weatherCode, temperature, description, windSpeed, humidity, onClose }: ARWeatherModeProps) {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);

  useEffect(() => {
    if ('xr' in navigator) {
      (navigator as any).xr.isSessionSupported('immersive-ar').then((supported: boolean) => {
        setIsSupported(supported);
      });
    } else {
      setIsSupported(false);
    }
  }, []);

  const handleEnterAR = () => {
    store.enterAR();
  };

  if (isSupported === false) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black/90 flex flex-col items-center justify-center p-6 text-center">
        <div className="glass p-8 rounded-3xl max-w-sm w-full border border-white/20">
          <h2 className="text-xl font-medium text-white mb-4">AR Not Supported</h2>
          <p className="text-white/60 text-sm mb-6">
            Your device or browser does not support WebXR AR mode. Please try using Chrome on a compatible Android device.
          </p>
          <button 
            onClick={onClose}
            className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-colors border border-white/10"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black">
      {/* UI Overlay */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-10 pointer-events-none">
        <button 
          onClick={onClose}
          className="p-3 glass rounded-full border border-white/20 text-white/80 hover:text-white pointer-events-auto"
        >
          <X className="w-6 h-6" />
        </button>
        
        <button 
          onClick={handleEnterAR}
          className="px-6 py-3 bg-blue-500/80 hover:bg-blue-500 rounded-full text-white font-medium shadow-lg pointer-events-auto border border-blue-400/50 backdrop-blur-md animate-pulse"
        >
          Start AR Session
        </button>
      </div>

      <div className="absolute bottom-8 left-0 w-full text-center z-10 pointer-events-none">
        <p className="text-white/50 text-sm glass inline-block px-4 py-2 rounded-full border border-white/10">
          Point your camera around to see the weather
        </p>
      </div>

      {/* 3D Canvas */}
      <Canvas>
        <XR store={store}>
          <ambientLight intensity={1} />
          <directionalLight position={[5, 5, 5]} intensity={2} />
          
          <WeatherParticles weatherCode={weatherCode} />
          <FloatingWeatherCard 
            temperature={temperature}
            description={description}
            windSpeed={windSpeed}
            humidity={humidity}
          />
        </XR>
      </Canvas>
    </div>
  );
}
