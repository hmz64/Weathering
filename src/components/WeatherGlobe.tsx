import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Stars, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { TimelapseFrame } from '../hooks/useTimelapseData';

interface WeatherGlobeProps {
  lat: number;
  lon: number;
  activeLayer: "temp" | "wind" | "rain" | "cloud";
  frameData?: TimelapseFrame | null;
}

// Helper to convert lat/lon to 3D position
const latLongToVector3 = (lat: number, lon: number, radius: number) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
};

function Earth({ lat, lon, activeLayer, frameData }: WeatherGlobeProps) {
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  
  // Load textures
  const [colorMap, bumpMap] = useTexture([
    'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
    'https://unpkg.com/three-globe/example/img/earth-topology.png'
  ]);

  // Auto-rotate slowly
  useFrame(() => {
    if (earthRef.current) earthRef.current.rotation.y += 0.0005;
    if (cloudsRef.current) cloudsRef.current.rotation.y += 0.0007; // Clouds drift slightly faster
  });

  // Calculate sun position based on time
  const sunPos = useMemo(() => {
    const date = frameData ? new Date(frameData.time) : new Date();
    const hours = date.getUTCHours() + date.getUTCMinutes() / 60;
    // Rough approximation: sun is opposite to the longitude that is currently at noon
    const sunLon = 180 - (hours / 24) * 360;
    // Sun declination (simplified, ignoring seasons for now to keep it stable)
    const sunLat = 0; 
    return latLongToVector3(sunLat, sunLon, 10);
  }, [frameData]);

  // User location marker
  const markerPos = useMemo(() => latLongToVector3(lat, lon, 1.01), [lat, lon]);

  return (
    <group>
      {/* Lighting */}
      <ambientLight intensity={0.1} />
      <directionalLight position={sunPos} intensity={1.5} color="#ffffff" />
      
      {/* Base Earth */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhongMaterial 
          map={colorMap}
          bumpMap={bumpMap}
          bumpScale={0.015}
          specular={new THREE.Color('grey')}
          shininess={15}
        />
      </mesh>

      {/* Atmosphere Glow */}
      <mesh>
        <sphereGeometry args={[1.03, 64, 64]} />
        <meshBasicMaterial 
          color="#4b8bf5" 
          transparent 
          opacity={0.15} 
          blending={THREE.AdditiveBlending} 
          side={THREE.BackSide}
        />
      </mesh>

      {/* Cloud Layer (Simulated) */}
      {(activeLayer === 'cloud' || activeLayer === 'rain') && (
        <mesh ref={cloudsRef}>
          <sphereGeometry args={[1.015, 64, 64]} />
          <meshPhongMaterial 
            color="#ffffff"
            transparent
            opacity={frameData ? frameData.cloudCover / 100 * 0.8 : 0.4}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Location Marker */}
      <mesh position={markerPos}>
        <sphereGeometry args={[0.02, 16, 16]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      
      {/* Ring around marker */}
      <mesh position={markerPos} lookAt={() => new THREE.Vector3(0,0,0)}>
        <ringGeometry args={[0.03, 0.04, 32]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export function WeatherGlobe(props: WeatherGlobeProps) {
  return (
    <div className="w-full h-full absolute inset-0 bg-[#050508] rounded-[2rem] overflow-hidden">
      <Canvas camera={{ position: [0, 0, 2.5], fov: 45 }}>
        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
        <Earth {...props} />
        <OrbitControls 
          enablePan={false} 
          enableZoom={true} 
          minDistance={1.2} 
          maxDistance={5}
          autoRotate={false}
        />
      </Canvas>
      
      {/* Overlay Info */}
      <div className="absolute top-4 left-4 glass px-3 py-1.5 rounded-full border border-white/10 text-[10px] text-white/50 uppercase tracking-widest z-10">
        3D Interactive Globe
      </div>
    </div>
  );
}
