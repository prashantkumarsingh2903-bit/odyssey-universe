import { create } from 'zustand';
import { audioEngine } from '../audio/AudioEngine';

interface AudioState {
  isAudioEnabled: boolean;
  isHazardous: boolean;
  enableAudio: () => void;
  setHazardousState: (hazardous: boolean) => void;
  updateMonolithProximity: (distance: number, size: number) => void;
}

export const useAudioStore = create<AudioState>((set) => ({
  isAudioEnabled: false,
  isHazardous: false,
  enableAudio: () => {
    audioEngine.init();
    audioEngine.startDrone();
    set({ isAudioEnabled: true });
  },
  setHazardousState: (hazardous: boolean) => {
    audioEngine.setAnomalyState(hazardous);
    set({ isHazardous: hazardous });
  },
  updateMonolithProximity: (distance: number, size: number) => {
    audioEngine.handleMonolithProximity(distance, size);
  }
}));
