import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Image, Html } from '@react-three/drei';
import * as THREE from 'three';
import { PhotoData } from '../types';

interface PhotoCardProps {
  data: PhotoData;
  isActive: boolean; // Is this photo currently being "grabbed"
  basePosition: THREE.Vector3; // Where it lives in the cloud
}

export const PhotoCard: React.FC<PhotoCardProps> = ({ data, isActive, basePosition }) => {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHover] = useState(false);

  // Define transition animation logic
  useFrame((state, delta) => {
    if (!meshRef.current) return;

    let targetPos = basePosition.clone();
    // Increase active scale to 3.5 to make it "slightly larger" and clearer
    let targetScale = isActive ? 3.5 : 0.4;
    let targetRot = new THREE.Euler(0, 0, 0);

    if (isActive) {
      // Move to front center
      targetPos.set(0, 0, 4); // Close to camera
      
      // Apply unique transitions based on type
      const time = state.clock.getElapsedTime();
      
      switch (data.transitionType) {
        case 'spin':
          targetRot.z = Math.sin(time * 2) * 0.2;
          break;
        case 'slide':
          targetPos.x += Math.sin(time * 3) * 0.5;
          break;
        case 'pop':
          targetScale += Math.sin(time * 10) * 0.1;
          break;
        case 'fade':
           // Fade handled by opacity mostly, but let's float it
           targetPos.y += Math.sin(time) * 0.2;
           break;
      }
    } else {
      // Return to tree/cloud
      // Add a slight orbit for idle animation
      const time = state.clock.getElapsedTime();
      targetPos.y += Math.sin(time + parseFloat(data.id)) * 0.05;
    }

    // Smooth transition
    meshRef.current.position.lerp(targetPos, delta * 5);
    meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 5);
    
    // Rotation smoothing
    meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, targetRot.x, delta * 5);
    meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetRot.y, delta * 5);
    meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, targetRot.z, delta * 5);

    // Look at camera if active or hovered
    if (isActive) {
        meshRef.current.lookAt(state.camera.position);
    }
  });

  return (
    <group ref={meshRef} position={basePosition}>
      <mesh 
        onPointerOver={() => setHover(true)} 
        onPointerOut={() => setHover(false)}
      >
        <planeGeometry args={[3, 2]} /> {/* Aspect ratio approx */}
        <meshBasicMaterial 
          map={data.texture} 
          transparent 
          opacity={1}
          side={THREE.DoubleSide}
        />
        {/* Glow Border for active state */}
        {isActive && (
            <Html center transform position={[0, -1.2, 0]}>
                <div className="text-white bg-black/50 px-2 py-1 rounded text-sm whitespace-nowrap backdrop-blur-md">
                   Memory
                </div>
            </Html>
        )}
      </mesh>
      
      {/* Backside of photo - Gift wrapping pattern maybe? kept simple for now */}
      <mesh rotation={[0, Math.PI, 0]}>
         <planeGeometry args={[3.1, 2.1]} />
         <meshStandardMaterial color="#881111" roughness={0.4} />
      </mesh>
    </group>
  );
};