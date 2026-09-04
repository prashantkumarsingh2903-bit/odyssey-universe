import { UniverseScene } from './components/3d/UniverseScene';
import { Navigation } from './components/ui/Navigation';
import { NodeInspector } from './components/ui/NodeInspector';
import { CaptureModal } from './components/ui/CaptureModal';
import { InsightsPanel } from './components/ui/InsightsPanel';
import { GestureHUD } from './components/ui/GestureHUD';
import { useGraphStore } from './store/useGraphStore';
import { ApolloProvider } from '@apollo/client';
import { apolloClient } from './lib/apollo';
import { TelemetryHUD } from './components/ui/TelemetryHUD';

function App() {
  const { isCaptureModalOpen, setCaptureModalOpen } = useGraphStore();
  return (
    <ApolloProvider client={apolloClient}>
      <div className="w-screen h-screen bg-background overflow-hidden relative select-none">
        <UniverseScene />
      <Navigation />
        <GestureHUD />
        <TelemetryHUD />
        <InsightsPanel />
      <NodeInspector />
        <CaptureModal 
          isOpen={isCaptureModalOpen} 
          onClose={() => setCaptureModalOpen(false)} 
        />
      </div>
    </ApolloProvider>
  );
}

export default App;
