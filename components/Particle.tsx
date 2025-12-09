import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import { ParticleConfig } from '../types';

interface ParticleProps {
  config: ParticleConfig;
  targetState: 'tree' | 'exploded';
  handRotation: number;
}

export const Particle: React.FC<ParticleProps> = ({ config, targetState, handRotation }) => {
  const meshRef = useRef<THREE.Group>(null);
  
  // Random noise for the exploded state
  const randomOffset = useMemo(() => {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    const r = 5 + Math.random() * 5; // Radius of explosion
    return new THREE.Vector3(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    );
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Calculate Target Position
    let targetPos = new THREE.Vector3();

    if (targetState === 'tree') {
      targetPos.set(...config.treePos);
    } else {
      // Exploded state: Base random position + rotation
      const x = randomOffset.x;
      const z = randomOffset.z;
      // Rotate the exploded particles based on time or hand interaction
      const speed = 0.5;
      const time = state.clock.getElapsedTime();
      
      const rotatedX = x * Math.cos(time * speed) - z * Math.sin(time * speed);
      const rotatedZ = x * Math.sin(time * speed) + z * Math.cos(time * speed);
      
      targetPos.set(rotatedX, randomOffset.y, rotatedZ);
    }

    // Smooth Interpolation (Lerp)
    // "Silky smooth" factor
    const smoothFactor = 4.0 * delta;
    
    meshRef.current.position.lerp(targetPos, smoothFactor);
    
    // Rotate individual particles slightly
    meshRef.current.rotation.x += config.rotationSpeed[0] * delta;
    meshRef.current.rotation.y += config.rotationSpeed[1] * delta;
  });

  const materialProps = {
    roughness: 0.1,
    metalness: 0.8,
    emissive: new THREE.Color(config.color),
    emissiveIntensity: 0.2,
    color: config.color,
  };

  const renderGeometry = () => {
    if (config.type === 'emoji') {
      return (
        <Text
          fontSize={config.scale}
          outlineWidth={0.02}
          outlineColor="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {config.emoji}
        </Text>
      );
    }

    switch (config.type) {
      case 'sphere':
        return (
          <mesh scale={config.scale}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
        );
      case 'box':
        return (
          <mesh scale={config.scale}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial {...materialProps} />
          </mesh>
        );
      case 'cone': // Representation of a tree shape
        return (
          <mesh scale={config.scale}>
            <coneGeometry args={[1, 2, 8]} />
            <meshStandardMaterial {...materialProps} color="green" />
          </mesh>
        );
      default:
        return null;
    }
  };

  return (
    <group ref={meshRef} position={config.initialPos}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        {renderGeometry()}
      </Float>
    </group>
  );
};