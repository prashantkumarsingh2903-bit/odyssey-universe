import { create } from 'zustand';

export type GestureType = 'NONE' | 'ORBIT' | 'PINCH_ZOOM' | 'FIST_LOCK' | 'POINTING';

export interface GestureState {
  isCameraActive: boolean;
  isModelLoaded: boolean;
  currentGesture: GestureType;
  handDetected: boolean;
  handPosition: { x: number; y: number; z: number }; // normalized 0-1
  handDelta: { x: number; y: number };
  pointerScreenPos: { x: number; y: number } | null; // normalized -1 to 1 for Three.js raycasting
  pinchDistance: number;
  zoomFactor: number;
  confidence: number;
  fps: number;
  
  setCameraActive: (active: boolean) => void;
  setModelLoaded: (loaded: boolean) => void;
  updateGesture: (data: Partial<Omit<GestureState, 'setCameraActive' | 'setModelLoaded' | 'updateGesture'>>) => void;
}

export const useGestureStore = create<GestureState>((set) => ({
  isCameraActive: false,
  isModelLoaded: false,
  currentGesture: 'NONE',
  handDetected: false,
  handPosition: { x: 0.5, y: 0.5, z: 0 },
  handDelta: { x: 0, y: 0 },
  pointerScreenPos: null,
  pinchDistance: 1,
  zoomFactor: 0,
  confidence: 0,
  fps: 0,

  setCameraActive: (active) => set({ isCameraActive: active }),
  setModelLoaded: (loaded) => set({ isModelLoaded: loaded }),
  updateGesture: (data) => set((state) => ({ ...state, ...data })),
}));
