import React, { useState, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { HandTracker } from './components/HandTracker';
import { Scene } from './components/Scene';
import { HandData, PhotoData } from './types';
import { v4 as uuidv4 } from 'uuid'; // Need a simple ID generator, using math random fallback if uuid fails or using custom function

// Helper for ID since we can't easily import uuid in all envs without install
const generateId = () => Math.random().toString(36).substr(2, 9);

const App: React.FC = () => {
  const handDataRef = useRef<HandData | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [photos, setPhotos] = useState<PhotoData[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Callback from HandTracker (runs every frame ideally, avoid state updates here for perf)
  const handleHandUpdate = useCallback((data: HandData | null) => {
    handDataRef.current = data;
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newPhotos: PhotoData[] = [];
      const transitions: ('spin' | 'slide' | 'pop' | 'fade')[] = ['spin', 'slide', 'pop', 'fade'];

      Array.from(files).forEach((file, index) => {
        const url = URL.createObjectURL(file as Blob);
        const texture = new THREE.TextureLoader().load(url);
        newPhotos.push({
          id: generateId(),
          url,
          texture,
          transitionType: transitions[index % transitions.length], // Cycle through types
        });
      });

      setPhotos(prev => [...prev, ...newPhotos]);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const toggleMusic = () => {
    if (!audioRef.current) return;

    if (isMusicPlaying) {
      audioRef.current.pause();
      setIsMusicPlaying(false);
    } else {
      const playPromise = audioRef.current.play();
      // Optimistically set to playing
      setIsMusicPlaying(true);
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          // If the user pauses immediately after playing, an AbortError is thrown.
          // This is expected behavior during rapid toggling.
          if (error.name === 'AbortError') {
            console.log("Audio play interrupted by pause");
            // We don't necessarily need to set false here because the pause action 
            // likely triggered this and handled the state.
          } else {
            console.error("Audio playback failed:", error);
            // Revert state if it was a genuine error (like permission denied)
            setIsMusicPlaying(false);
          }
        });
      }
    }
  };

  return (
    <div className="relative w-full h-full bg-neutral-900 overflow-hidden select-none">
      {/* 3D Canvas */}
      <Canvas
        shadows
        // Adjusted camera Z to 24 to fit the whole tree completely (Tree height ~12-15 units)
        camera={{ position: [0, 0, 24], fov: 45 }}
        dpr={[1, 2]} // Quality scaling
        gl={{ antialias: false, toneMapping: THREE.ReinhardToneMapping, toneMappingExposure: 1.5 }}
      >
        <Scene handData={handDataRef} photos={photos} />
        
        {/* Post Processing for the Glow/Bloom effect */}
        <EffectComposer disableNormalPass>
          <Bloom luminanceThreshold={1} mipmapBlur intensity={1.5} radius={0.4} />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>
      </Canvas>

      {/* Hand Tracker Overlay */}
      <HandTracker onHandUpdate={handleHandUpdate} />

      {/* Audio Element with Fallbacks */}
      <audio ref={audioRef} loop crossOrigin="anonymous">
        {/* Primary Source: Reliable MP3 */}
        <source src="https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/United_States_Marine_Band/We_Wish_You_a_Merry_Christmas/United_States_Marine_Band_-_We_Wish_You_a_Merry_Christmas.mp3" type="audio/mpeg" />
        {/* Fallback Source: OGG */}
        <source src="https://upload.wikimedia.org/wikipedia/commons/e/e9/We_Wish_You_a_Merry_Christmas.ogg" type="audio/ogg" />
        Your browser does not support the audio element.
      </audio>

      {/* UI Overlay */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start pointer-events-none">
        <div className="pointer-events-auto">
          <h1 className="text-3xl font-light text-white tracking-wider mb-2 drop-shadow-lg">
            Winter<span className="font-bold text-red-500">Magic</span>
          </h1>
          <p className="text-white/60 text-sm max-w-md">
            • ✊ Fist: Form Tree<br/>
            • 🖐 Open: Explode & Rotate<br/>
            • 👌 Pinch: Grab Memories
          </p>
        </div>

        <div className="flex flex-col gap-4 pointer-events-auto">
          <button 
            onClick={toggleFullscreen}
            className="bg-white/10 hover:bg-white/20 backdrop-blur text-white p-3 rounded-full transition-all border border-white/10"
            title="Toggle Fullscreen"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
            </svg>
          </button>

          <button 
            onClick={toggleMusic}
            className={`p-3 rounded-full transition-all border border-white/10 ${isMusicPlaying ? 'bg-green-600/80 text-white shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'bg-white/10 hover:bg-white/20 text-white/70'}`}
            title="Toggle Music"
          >
            {isMusicPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 animate-pulse">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
              </svg>
            )}
          </button>
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-red-500/80 hover:bg-red-600/90 text-white p-3 rounded-full transition-all shadow-lg shadow-red-500/20"
            title="Add Photos"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            multiple 
            accept="image/*" 
            className="hidden" 
          />
        </div>
      </div>

      {/* Guide for empty state */}
      {photos.length === 0 && (
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-white/40 text-sm pointer-events-none animate-pulse">
           Upload photos to decorate the tree
        </div>
      )}
    </div>
  );
};

export default App;