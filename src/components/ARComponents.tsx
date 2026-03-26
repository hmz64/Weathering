import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';

interface WeatherParticlesProps {
  weatherCode: number;
}

export function WeatherParticles({ weatherCode }: WeatherParticlesProps) {
  const count = 1500;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  // Determine particle type based on weather code
  const isRain = [51, 53, 55, 61, 63, 65, 80, 81, 82].includes(weatherCode);
  const isSnow = [71, 73, 75, 85, 86].includes(weatherCode);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // Initial positions
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 10;
      const y = Math.random() * 10;
      const z = (Math.random() - 0.5) * 10;
      const speed = isRain ? 0.1 + Math.random() * 0.1 : 0.02 + Math.random() * 0.02;
      temp.push({ x, y, z, speed });
    }
    return temp;
  }, [count, isRain]);

  useFrame(() => {
    if (!meshRef.current || (!isRain && !isSnow)) return;
    
    particles.forEach((particle, i) => {
      particle.y -= particle.speed;
      if (particle.y < -2) {
        particle.y = 10;
        particle.x = (Math.random() - 0.5) * 10;
        particle.z = (Math.random() - 0.5) * 10;
      }
      
      // Add slight horizontal drift for snow
      if (isSnow) {
        particle.x += Math.sin(Date.now() * 0.001 + i) * 0.01;
      }

      dummy.position.set(particle.x, particle.y, particle.z);
      
      // Stretch raindrops
      if (isRain) {
        dummy.scale.set(0.02, 0.5, 0.02);
      } else {
        dummy.scale.set(0.05, 0.05, 0.05);
      }
      
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (!isRain && !isSnow) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      {isRain ? <cylinderGeometry args={[1, 1, 1, 4]} /> : <sphereGeometry args={[1, 8, 8]} />}
      <meshBasicMaterial color={isRain ? "#93c5fd" : "#ffffff"} transparent opacity={0.6} />
    </instancedMesh>
  );
}

interface FloatingWeatherCardProps {
  temperature: number;
  description: string;
  windSpeed: number;
  humidity: number;
}

export function FloatingWeatherCard({ temperature, description, windSpeed, humidity }: FloatingWeatherCardProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      // Gentle floating animation
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.05;
      // Slight rotation based on camera to simulate parallax
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, -1.5]}>
      {/* Glassmorphism Backing */}
      <mesh>
        <planeGeometry args={[1.2, 0.8]} />
        <meshPhysicalMaterial 
          color="#ffffff"
          transmission={0.9}
          opacity={1}
          metalness={0.1}
          roughness={0.2}
          ior={1.5}
          thickness={0.5}
          transparent
        />
      </mesh>
      
      {/* Border */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[1.22, 0.82]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.2} />
      </mesh>

      {/* Content */}
      <Text position={[0, 0.2, 0.01]} fontSize={0.2} color="#ffffff" anchorX="center" anchorY="middle" font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2">
        {`${Math.round(temperature)}°`}
      </Text>
      
      <Text position={[0, -0.05, 0.01]} fontSize={0.08} color="#e2e8f0" anchorX="center" anchorY="middle" font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2">
        {description}
      </Text>

      <Text position={[-0.3, -0.25, 0.01]} fontSize={0.05} color="#cbd5e1" anchorX="center" anchorY="middle" font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2">
        {`Wind: ${windSpeed} km/h`}
      </Text>

      <Text position={[0.3, -0.25, 0.01]} fontSize={0.05} color="#cbd5e1" anchorX="center" anchorY="middle" font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2">
        {`Hum: ${humidity}%`}
      </Text>
    </group>
  );
}
