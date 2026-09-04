import { Detailed } from '@react-three/drei';

interface AsteroidProps {
  position: [number, number, number];
  scale?: number;
}

export const Asteroid = ({ position, scale = 1 }: AsteroidProps) => {
  return (
    <Detailed distances={[0, 20, 50]} position={position} scale={scale}>
      {/* High polygon mesh (close range) */}
      <mesh>
        <icosahedronGeometry args={[1, 4]} />
        <meshStandardMaterial color="#888888" roughness={0.9} metalness={0.2} />
      </mesh>
      
      {/* Medium polygon proxy (mid range) */}
      <mesh>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#888888" roughness={0.9} metalness={0.2} />
      </mesh>
      
      {/* Low polygon proxy / Sprite equivalent (far range) */}
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#888888" />
      </mesh>
    </Detailed>
  );
};
