import { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree, extend } from '@react-three/fiber';
import * as THREE from 'three';
// @ts-ignore
import { MeshBasicNodeMaterial } from 'three/webgpu';
import { createGalaxyCompute, GALAXY_PARTICLES } from '../../shaders/galaxyCompute';

extend({ MeshBasicNodeMaterial });

export const GalaxySystem = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { gl } = useThree();

  const { initNode, updateNode, positionNode } = useMemo(() => createGalaxyCompute(), []);

  useEffect(() => {
    // Initialize particles on GPU
    const init = async () => {
      if (typeof (gl as any).computeAsync === 'function') {
        await (gl as any).computeAsync(initNode);
      }
    };
    init();
  }, [gl, initNode]);

  useFrame(() => {
    // Dispatch compute shader every frame
    if (typeof (gl as any).compute === 'function') {
      (gl as any).compute(updateNode);
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, GALAXY_PARTICLES]}>
      <sphereGeometry args={[0.05, 4, 4]} />
      <primitive object={new MeshBasicNodeMaterial({ positionNode, color: new THREE.Color('#aaddff') })} attach="material" />
    </instancedMesh>
  );
};
