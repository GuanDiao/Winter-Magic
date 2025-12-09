import * as THREE from 'three';

export interface HandData {
  isOpen: boolean;
  isPinching: boolean;
  pinchDistance: number;
  wristPos: { x: number; y: number; z: number };
  indexTipPos: { x: number; y: number; z: number };
  thumbTipPos: { x: number; y: number; z: number };
}

export interface PhotoData {
  id: string;
  url: string;
  texture?: THREE.Texture;
  transitionType: 'spin' | 'slide' | 'pop' | 'fade';
}

export type ParticleType = 'sphere' | 'box' | 'cone' | 'emoji';

export interface ParticleConfig {
  id: number;
  type: ParticleType;
  emoji?: string; // If type is emoji
  color: string;
  initialPos: [number, number, number];
  treePos: [number, number, number]; // Target position in tree form
  scale: number;
  rotationSpeed: [number, number, number];
}