import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { useGraphStore } from '../../store/useGraphStore';

export const Connections = () => {
  const { nodes, connections, hoveredNodeId, selectedNodeId } = useGraphStore();
  const groupRef = useRef<THREE.Group>(null);

  // Sync rotation with ParticleSystem
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.02;
    }
  });

  const lines = useMemo(() => {
    return connections.map((conn) => {
      const source = nodes.find(n => n.id === conn.sourceId);
      const target = nodes.find(n => n.id === conn.targetId);
      
      if (!source?.position || !target?.position) return null;

      // Check if this connection is highlighted
      const isHighlighted = 
        source.id === hoveredNodeId || target.id === hoveredNodeId ||
        source.id === selectedNodeId || target.id === selectedNodeId;
      
      // Calculate a curved path for the connection (gravitational bending)
      const p1 = new THREE.Vector3(...source.position);
      const p2 = new THREE.Vector3(...target.position);
      
      // Control point pulled slightly towards center (0,0,0) for curved lines
      const distance = p1.distanceTo(p2);
      const midPoint = p1.clone().lerp(p2, 0.5);
      const centerPull = midPoint.clone().normalize().multiplyScalar(midPoint.length() - distance * 0.2);
      
      const curve = new THREE.QuadraticBezierCurve3(p1, centerPull, p2);
      const points = curve.getPoints(20);

      return (
        <Line
          key={`${conn.sourceId}-${conn.targetId}`}
          points={points}
          color={isHighlighted ? '#ffffff' : '#ffffff'}
          opacity={isHighlighted ? 0.6 : 0.05}
          transparent
          lineWidth={isHighlighted ? 1.5 : 0.5}
        />
      );
    }).filter(Boolean);
  }, [nodes, connections, hoveredNodeId, selectedNodeId]);

  return (
    <group ref={groupRef}>
      {lines}
    </group>
  );
};
