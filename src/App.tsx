import { UniverseScene } from './components/3d/UniverseScene';
import { Navigation } from './components/ui/Navigation';
import { NodeInspector } from './components/ui/NodeInspector';
import { CaptureModal } from './components/ui/CaptureModal';
import { InsightsPanel } from './components/ui/InsightsPanel';
import { GestureHUD } from './components/ui/GestureHUD';
import { useGraphStore } from './store/useGraphStore';

function App() {
  const { isCaptureModalOpen, setCaptureModalOpen } = useGraphStore();
  return (
    <div className="w-screen h-screen bg-background overflow-hidden relative select-none">
      <UniverseScene />
      <Navigation />
      <GestureHUD />
      <InsightsPanel />
      <NodeInspector />
      <CaptureModal 
        isOpen={isCaptureModalOpen} 
        onClose={() => setCaptureModalOpen(false)} 
      />
    </div>
  );
}

export default App;
