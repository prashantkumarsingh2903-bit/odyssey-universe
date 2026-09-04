import { create } from 'zustand';
import { Vector3, Euler } from 'three';

interface TelemetryState {
  playerVector: Vector3;
  playerRotation: Euler;
  velocity: Vector3;
  asteroids: any[];
  setPlayerTransform: (position: Vector3, rotation: Euler, velocity: Vector3) => void;
  setAsteroids: (asteroids: any[]) => void;
}

// Store is created but intended to be accessed via useTelemetryStore.getState() in animation loops
// rather than mapped to React component state to prevent unnecessary re-renders.
export const useTelemetryStore = create<TelemetryState>((set) => ({
  playerVector: new Vector3(0, 0, 0),
  playerRotation: new Euler(0, 0, 0),
  velocity: new Vector3(0, 0, 0),
  asteroids: [],
  setPlayerTransform: (position, rotation, velocity) => 
    set({ playerVector: position, playerRotation: rotation, velocity }),
  setAsteroids: (asteroids) => set({ asteroids }),
}));
