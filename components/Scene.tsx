import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Environment, OrbitControls, Stars, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { Particle } from './Particle';
import { PhotoCard } from './PhotoCard';
import { HandData, ParticleConfig, PhotoData, ParticleType } from '../types';

interface SceneProps {
  handData: React.MutableRefObject<HandData | null>;
  photos: PhotoData[];
}

const EMOJIS = ['🎁', '🎄', '🎅', '🔔', '👔', '🧦', '❄️', '🦌'];
const PARTICLE_COUNT = 300; // Adjusted for performance
const TREE_HEIGHT = 12;
const TREE_RADIUS_BASE = 6;

export const Scene: React.FC<SceneProps> = ({ handData, photos }) => {
  const [targetState, setTargetState] = useState<'tree' | 'exploded'>('tree');
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);
  
  // Create Particles Data
  const particles = useMemo(() => {
    const temp: ParticleConfig[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Tree Form Calculation (Spiral)
      const t = i / PARTICLE_COUNT;
      const angle = t * Math.PI * 20; // Multiple loops
      const y = (t * TREE_HEIGHT) - (TREE_HEIGHT / 2); // -Height/2 to Height/2
      const r = TREE_RADIUS_BASE * (1 - t); // Radius shrinks as we go up
      
      const treePos: [number, number, number] = [
        Math.cos(angle) * r,
        y,
        Math.sin(angle) * r
      ];

      // Random Types
      const typeRoll = Math.random();
      let type: ParticleType = 'sphere';
      let emoji = undefined;
      let color = '#ffffff';

      if (typeRoll > 0.6) {
        type = 'emoji';
        emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
      } else if (typeRoll > 0.4) {
        type = 'box';
        color = '#ff3333';
      } else if (typeRoll > 0.2) {
        type = 'cone'; // Small trees
        color = '#228822';
      } else {
        color = Math.random() > 0.5 ? '#ffd700' : '#ffffff'; // Gold or White bulbs
      }

      temp.push({
        id: i,
        type,
        emoji,
        color,
        initialPos: [(Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20],
        treePos,
        scale: 0.3 + Math.random() * 0.4,
        rotationSpeed: [Math.random(), Math.random(), Math.random()]
      });
    }
    return temp;
  }, []);

  // Frame Loop for Interaction Logic
  useFrame((state) => {
    const hand = handData.current;
    
    // Default rotation of the whole group
    const time = state.clock.getElapsedTime();

    if (hand) {
      // 1. Open/Closed Hand -> Explode/Tree
      if (hand.isOpen) {
        setTargetState('exploded');
      } else {
        setTargetState('tree');
      }

      // 2. Pinch -> Grab Photo
      // Simple logic: If pinching, find a photo. If multiple photos, cycle or pick random based on hand X position.
      if (hand.isPinching) {
        // Map hand X (0-1) to photo index
        // Mirror the hand X for intuitive selection
        const selectionIndex = Math.floor((1 - hand.wristPos.x) * photos.length);
        const safeIndex = Math.max(0, Math.min(photos.length - 1, selectionIndex));
        
        if (photos.length > 0) {
            setActivePhotoId(photos[safeIndex].id);
        }
      } else {
        setActivePhotoId(null);
      }
    } else {
        // Auto rotate if no hand detected? Or just stay in tree mode
        setTargetState('tree');
        setActivePhotoId(null);
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <spotLight position={[0, 20, 0]} angle={0.5} penumbra={1} intensity={2} castShadow />

      {/* Environment for reflections */}
      <Environment preset="night" />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      {/* The Tree / Particle Cloud */}
      <group position={[0, -2, 0]}>
        
        {/* Tree Top Star/Light */}
        <mesh position={[0, TREE_HEIGHT / 2 + 0.5, 0]}>
            <dodecahedronGeometry args={[0.8]} />
            <meshStandardMaterial emissive="#ffff00" emissiveIntensity={2} color="#ffff00" toneMapped={false} />
            <pointLight distance={10} intensity={2} color="#ffff00" />
        </mesh>

        {/* Main Particles */}
        {particles.map((p) => (
          <Particle 
            key={p.id} 
            config={p} 
            targetState={targetState} 
            handRotation={0} 
          />
        ))}

        {/* Photos embedded in the tree */}
        {photos.map((photo, index) => {
            // Distribute photos within the tree volume
            // We use a fixed position relative to the tree structure based on index
            const angle = (index / (photos.length || 1)) * Math.PI * 2;
            const y = (index % 3) * 2 - 1; // Spread vertically
            const r = 4;
            const basePos = new THREE.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r);
            
            return (
                <PhotoCard 
                    key={photo.id}
                    data={photo}
                    isActive={activePhotoId === photo.id}
                    basePosition={basePos}
                />
            );
        })}

        {/* Extra Magic */}
        <Sparkles count={100} scale={12} size={4} speed={0.4} opacity={0.5} color="#fff" />
      </group>

      <OrbitControls enableZoom={false} enablePan={false} autoRotate={targetState === 'exploded'} autoRotateSpeed={0.5} />
    </>
  );
};