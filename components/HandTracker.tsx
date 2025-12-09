import React, { useEffect, useRef, useState } from 'react';
import { handDetectionService } from '../services/handDetectionService';
import { HandData } from '../types';

interface HandTrackerProps {
  onHandUpdate: (data: HandData | null) => void;
}

export const HandTracker: React.FC<HandTrackerProps> = ({ onHandUpdate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const requestRef = useRef<number>();
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const startCamera = async () => {
      try {
        await handDetectionService.initialize();
        
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: 640,
            height: 480,
            frameRate: { ideal: 30 }
          }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener('loadeddata', predictWebcam);
          setPermissionGranted(true);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setLoading(false);
      }
    };

    startCamera();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const predictWebcam = () => {
    if (!videoRef.current) return;

    const result = handDetectionService.detect(videoRef.current);
    
    if (result && result.landmarks && result.landmarks.length > 0) {
      // Use the first detected hand
      const landmarks = result.landmarks[0];
      
      // Landmark indices: 0=Wrist, 4=ThumbTip, 8=IndexTip, 12=MiddleTip, etc.
      const wrist = landmarks[0];
      const thumbTip = landmarks[4];
      const indexTip = landmarks[8];
      const middleTip = landmarks[12];
      const ringTip = landmarks[16];
      const pinkyTip = landmarks[20];

      // 1. Detect Open vs Closed (Fist)
      // Calculate average distance of fingertips to wrist
      const fingerTips = [indexTip, middleTip, ringTip, pinkyTip];
      const avgDistToWrist = fingerTips.reduce((acc, tip) => {
        return acc + Math.sqrt(
          Math.pow(tip.x - wrist.x, 2) + 
          Math.pow(tip.y - wrist.y, 2)
        );
      }, 0) / 4;

      // Thresholds need tuning based on coordinate system (0-1)
      const isOpen = avgDistToWrist > 0.25; 

      // 2. Detect Pinch (Thumb + Index)
      const pinchDist = Math.sqrt(
        Math.pow(thumbTip.x - indexTip.x, 2) + 
        Math.pow(thumbTip.y - indexTip.y, 2)
      );
      const isPinching = pinchDist < 0.05;

      const handData: HandData = {
        isOpen,
        isPinching,
        pinchDistance: pinchDist,
        wristPos: wrist,
        indexTipPos: indexTip,
        thumbTipPos: thumbTip
      };

      onHandUpdate(handData);
    } else {
      onHandUpdate(null);
    }

    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  return (
    <div className="absolute bottom-4 right-4 z-50 w-32 h-24 rounded-lg overflow-hidden border-2 border-white/20 shadow-lg bg-black/50 backdrop-blur">
      {!permissionGranted && !loading && (
        <div className="w-full h-full flex items-center justify-center text-white text-xs text-center p-2">
          Camera needed
        </div>
      )}
      {loading && (
        <div className="w-full h-full flex items-center justify-center text-white text-xs">
          Loading AI...
        </div>
      )}
      <video
        ref={videoRef}
        className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
        autoPlay
        playsInline
        muted
      />
    </div>
  );
};