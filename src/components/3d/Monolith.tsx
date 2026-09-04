import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useAudioStore } from '../../store/useAudioStore';

export const Monolith = ({ position, size = 1 }: { position: [number, number, number], size?: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const updateMonolithProximity = useAudioStore((state) => state.updateMonolithProximity);
  const isAudioEnabled = useAudioStore((state) => state.isAudioEnabled);

  useFrame(() => {
    if (meshRef.current && isAudioEnabled) {
      // Calculate distance from camera to monolith to modulate procedural audio
      const distance = camera.position.distanceTo(meshRef.current.position);
      updateMonolithProximity(distance, size);
      
      // Slowly rotate monolith
      meshRef.current.rotation.y += 0.005;
    }
  });

  return (
    <mesh ref={meshRef} position={position} scale={[size, size * 4, size]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#222222" metalness={0.8} roughness={0.2} />
    </mesh>
  );
};
