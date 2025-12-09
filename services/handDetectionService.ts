import { FilesetResolver, HandLandmarker, HandLandmarkerResult } from "@mediapipe/tasks-vision";

export class HandDetectionService {
  private handLandmarker: HandLandmarker | undefined;
  private runningMode: "IMAGE" | "VIDEO" = "VIDEO";
  
  async initialize() {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    );
    
    this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
        delegate: "GPU"
      },
      runningMode: this.runningMode,
      numHands: 2
    });
  }

  detect(video: HTMLVideoElement): HandLandmarkerResult | null {
    if (!this.handLandmarker) return null;
    const startTimeMs = performance.now();
    return this.handLandmarker.detectForVideo(video, startTimeMs);
  }
}

export const handDetectionService = new HandDetectionService();