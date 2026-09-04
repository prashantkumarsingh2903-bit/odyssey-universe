import { tslFn, instanceIndex, hash, float, vec3, storage, PI, cos, sin } from 'three/tsl';
import { StorageInstancedBufferAttribute } from 'three';

export const GALAXY_PARTICLES = 100000;

export const createGalaxyCompute = () => {
  // Allocate GPU memory for particles
  const positionBuffer = new StorageInstancedBufferAttribute(GALAXY_PARTICLES, 3);
  const velocityBuffer = new StorageInstancedBufferAttribute(GALAXY_PARTICLES, 3);

  const positionNode = storage(positionBuffer, 'vec3', positionBuffer.count);
  const velocityNode = storage(velocityBuffer, 'vec3', velocityBuffer.count);

  // Initialization compute shader
  const initGalaxyCompute = tslFn(() => {
    const id = instanceIndex;
    const h = hash(id);
    
    // Procedural distribution: 3 spiral arms
    const radius = float(h).pow(0.5).mul(50);
    const armAngle = float(id.mod(3)).mul(PI.mul(2).div(3));
    
    const scatter = hash(id.add(1000)).sub(0.5).mul(2);
    const angle = armAngle.add(scatter);
    
    const x = cos(angle).mul(radius);
    const z = sin(angle).mul(radius);
    const y = hash(id.add(2000)).sub(0.5).mul(5);
    
    const pos = vec3(x, y, z);
    positionNode.element(instanceIndex).assign(pos);
    
    // Differential rotation velocity
    const speed = float(10).div(radius.add(1));
    const velX = sin(angle).negate().mul(speed);
    const velZ = cos(angle).mul(speed);
    
    velocityNode.element(instanceIndex).assign(vec3(velX, 0.0, velZ));
  })();

  // Update compute shader
  const updateGalaxyCompute = tslFn(() => {
    const currentPos = positionNode.element(instanceIndex);
    const vel = velocityNode.element(instanceIndex);
    
    // Update position based on velocity
    currentPos.assign(currentPos.add(vel.mul(0.016))); 
  })();

  return {
    positionNode,
    initNode: initGalaxyCompute().compute(GALAXY_PARTICLES),
    updateNode: updateGalaxyCompute().compute(GALAXY_PARTICLES)
  };
};
