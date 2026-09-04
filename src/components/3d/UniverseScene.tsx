import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { BlackHole } from './BlackHole';
import { ParticleSystem } from './ParticleSystem';
import { Connections } from './Connections';
import { GestureCameraRig } from './GestureCameraRig';
import { useGestureStore } from '../../store/useGestureStore';

export const UniverseScene = () => {
  const { isCameraActive, handDetected } = useGestureStore();
  const isHandControlling = isCameraActive && handDetected;

  return (
    <div className="absolute inset-0 w-full h-full z-0">
      <Canvas
        camera={{ position: [0, 2, 12], fov: 60 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        {/* The Black Hole shader renders as a background quad */}
        <BlackHole />
        
        {/* Ambient lighting for normal 3D objects */}
        <ambientLight intensity={0.2} />
        
        {/* Knowledge Nodes and Connections */}
        <ParticleSystem />
        <Connections />

        {/* Real-time Hand Gesture Camera Controller */}
        <GestureCameraRig />
        
        {/* Mouse OrbitControls when hand tracking is idle */}
        <OrbitControls 
          enabled={!isHandControlling}
          enablePan={false}
          enableZoom={true}
          minDistance={3}
          maxDistance={30}
          dampingFactor={0.05}
        />
      </Canvas>
    </div>
  );
};
