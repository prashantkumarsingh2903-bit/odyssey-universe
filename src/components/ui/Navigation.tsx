import React from 'react';
import { Compass, Book, Clock, GraduationCap, Sparkles, Plus, Hand, Volume2, VolumeX } from 'lucide-react';
import { useGraphStore } from '../../store/useGraphStore';
import { useGestureStore } from '../../store/useGestureStore';
import { useAudioStore } from '../../store/useAudioStore';

export const Navigation = () => {
  const setCaptureModalOpen = useGraphStore(state => state.setCaptureModalOpen);
  const { isCameraActive, setCameraActive } = useGestureStore();
  const { isAudioEnabled, enableAudio } = useAudioStore();

  return (
    <>
      <nav className="absolute left-8 top-1/2 -translate-y-1/2 flex flex-col gap-6 z-10">
        <h1 className="text-xl tracking-[0.3em] font-light mb-4 uppercase">Odyssey</h1>
        
        <NavItem icon={<Compass size={18} />} label="Universe" active />
        <NavItem icon={<Book size={18} />} label="Knowledge" />
        <NavItem icon={<Clock size={18} />} label="Daily Orbit" />
        <NavItem icon={<GraduationCap size={18} />} label="Learning" />
        <NavItem icon={<Sparkles size={18} />} label="Insights" />

        <div className="pt-4 border-t border-white/10">
          <button
            onClick={() => setCameraActive(!isCameraActive)}
            className={`flex items-center gap-4 uppercase tracking-widest text-xs transition-colors duration-300 mb-4 ${
              isCameraActive ? 'text-blue-400 font-medium' : 'text-white/40 hover:text-white'
            }`}
          >
            <span className={`flex items-center justify-center w-8 h-8 rounded-full ${
              isCameraActive ? 'bg-blue-500/20 text-blue-300 border border-blue-400/40 animate-pulse' : 'bg-white/5'
            }`}>
              <Hand size={16} />
            </span>
            <span>{isCameraActive ? 'Gestures: On' : 'Hand Control'}</span>
          </button>
          
          <button
            onClick={() => !isAudioEnabled && enableAudio()}
            className={`flex items-center gap-4 uppercase tracking-widest text-xs transition-colors duration-300 ${
              isAudioEnabled ? 'text-green-400 font-medium' : 'text-white/40 hover:text-white'
            }`}
          >
            <span className={`flex items-center justify-center w-8 h-8 rounded-full ${
              isAudioEnabled ? 'bg-green-500/20 text-green-300 border border-green-400/40' : 'bg-white/5'
            }`}>
              {isAudioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </span>
            <span>{isAudioEnabled ? 'Audio: On' : 'Enable Audio'}</span>
          </button>
        </div>
      </nav>

      <button 
        onClick={() => setCaptureModalOpen(true)}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white px-6 py-3 rounded-full uppercase tracking-wider text-sm transition-all z-10 group"
      >
        <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
        Capture
      </button>
    </>
  );
};

const NavItem = ({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) => (
  <button className={`flex items-center gap-4 uppercase tracking-widest text-xs transition-colors duration-300 hover:text-white ${active ? 'text-white' : 'text-white/40'}`}>
    <span className={`flex items-center justify-center w-8 h-8 rounded-full ${active ? 'bg-white/10' : 'bg-transparent'}`}>
      {icon}
    </span>
    {label}
  </button>
);
