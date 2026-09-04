import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Instances, Instance, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useGraphStore, type NodeType } from '../../store/useGraphStore';
import { MOCK_NODES, MOCK_CONNECTIONS } from '../../data/mockData';

const typeColors: Record<NodeType, string> = {
  IDEA: '#F5A623',
  KNOWLEDGE: '#4A90E2',
  ACTIVITY: '#7ED321',
  REFLECTION: '#F8E71C',
  GOAL: '#ffffff',
  PROJECT: '#ff4444',
  LEARNING: '#9013FE'
};

export const ParticleSystem = () => {
  const { nodes, setNodes, setConnections, setSelectedNode, setHoveredNode, hoveredNodeId } = useGraphStore();
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    // Load mock data on mount
    setNodes(MOCK_NODES);
    setConnections(MOCK_CONNECTIONS);
  }, [setNodes, setConnections]);

  useFrame((state) => {
    // Slowly rotate the entire particle system
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.02;
    }
  });

  return (
    <group ref={groupRef}>
      <Instances limit={1000} range={nodes.length}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial toneMapped={false} />
        
        {nodes.map((node) => {
          const color = typeColors[node.type] || '#ffffff';
          const isHovered = hoveredNodeId === node.id;
          const scale = isHovered ? 1.5 : (node.gravityScore / 100) * 0.5 + 0.5;

          return (
            <Instance
              key={node.id}
              position={node.position}
              scale={scale}
              color={color}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHoveredNode(node.id);
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={() => {
                setHoveredNode(null);
                document.body.style.cursor = 'auto';
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedNode(node.id);
              }}
            >
              {isHovered && (
                <Html distanceFactor={10} center>
                  <div className="bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap border border-white/20 backdrop-blur-md font-sans tracking-wide">
                    <span className="opacity-50 text-[10px] uppercase block mb-0.5">{node.type}</span>
                    {node.title}
                  </div>
                </Html>
              )}
            </Instance>
          );
        })}
      </Instances>
    </group>
  );
};
