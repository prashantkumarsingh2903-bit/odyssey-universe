import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGestureStore } from '../../store/useGestureStore';
import { useGraphStore } from '../../store/useGraphStore';

export const GestureCameraRig = () => {
  const { isCameraActive, handDetected, currentGesture, handPosition, pointerScreenPos, zoomFactor } = useGestureStore();
  const { nodes, setHoveredNode, setSelectedNode } = useGraphStore();
  const { camera } = useThree();

  const currentSpherical = useRef({
    radius: 12,
    yaw: 0.5,
    pitch: -0.4
  });

  const targetSpherical = useRef({
    radius: 12,
    yaw: 0.5,
    pitch: -0.4
  });

  const raycaster = useRef(new THREE.Raycaster());

  // Initialize spherical coords from current camera pos
  useEffect(() => {
    const pos = camera.position;
    const r = pos.length();
    const yaw = Math.atan2(pos.x, pos.z);
    const pitch = Math.asin(pos.y / r);

    currentSpherical.current = { radius: r, yaw, pitch };
    targetSpherical.current = { radius: r, yaw, pitch };
  }, [camera]);

  useFrame((_, delta) => {
    if (!isCameraActive || !handDetected) return;

    // 1. Gesture: ORBIT (Open Hand Navigation)
    if (currentGesture === 'ORBIT') {
      // Map hand relative to screen center (0.5, 0.5) to continuous rotation velocity
      const offsetX = (handPosition.x - 0.5);
      const offsetY = (handPosition.y - 0.5);

      // Deadzone in the center
      const deadzone = 0.08;
      if (Math.abs(offsetX) > deadzone) {
        const speedX = Math.sign(offsetX) * (Math.abs(offsetX) - deadzone) * 2.5;
        targetSpherical.current.yaw -= speedX * delta;
      }

      if (Math.abs(offsetY) > deadzone) {
        const speedY = Math.sign(offsetY) * (Math.abs(offsetY) - deadzone) * 2.0;
        targetSpherical.current.pitch = THREE.MathUtils.clamp(
          targetSpherical.current.pitch + speedY * delta,
          -Math.PI / 2.3,
          Math.PI / 2.3
        );
      }
    }

    // 2. Gesture: PINCH ZOOM (Warp camera closer or further)
    if (currentGesture === 'PINCH_ZOOM') {
      const zoomSpeed = (handPosition.y - 0.5) * 12 * delta;
      targetSpherical.current.radius = THREE.MathUtils.clamp(
        targetSpherical.current.radius + zoomSpeed + zoomFactor,
        4.5,
        25.0
      );
    }

    // 3. Gesture: FIST (Gravitational Lock / Stabilize)
    if (currentGesture === 'FIST_LOCK') {
      targetSpherical.current.pitch = THREE.MathUtils.lerp(targetSpherical.current.pitch, 0, delta * 2);
    }

    // 4. Gesture: POINTING (Raycasting to Hover / Select Nodes)
    if (currentGesture === 'POINTING' && pointerScreenPos) {
      raycaster.current.setFromCamera(
        new THREE.Vector2(pointerScreenPos.x, pointerScreenPos.y),
        camera
      );

      // Find nearest knowledge node in 3D space
      let closestNodeId: string | null = null;
      let minDistance = 2.5; // Threshold radius in world units

      nodes.forEach((node) => {
        if (!node.position) return;
        const nodeVec = new THREE.Vector3(...node.position);
        
        const rayPoint = new THREE.Vector3();
        raycaster.current.ray.closestPointToPoint(nodeVec, rayPoint);
        const dist = rayPoint.distanceTo(nodeVec);

        if (dist < minDistance) {
          minDistance = dist;
          closestNodeId = node.id;
        }
      });

      if (closestNodeId) {
        setHoveredNode(closestNodeId);
        setSelectedNode(closestNodeId);
      }
    }

    // Smooth camera interpolation
    const lerpFactor = THREE.MathUtils.clamp(delta * 4.5, 0, 1);
    currentSpherical.current.yaw = THREE.MathUtils.lerp(
      currentSpherical.current.yaw,
      targetSpherical.current.yaw,
      lerpFactor
    );
    currentSpherical.current.pitch = THREE.MathUtils.lerp(
      currentSpherical.current.pitch,
      targetSpherical.current.pitch,
      lerpFactor
    );
    currentSpherical.current.radius = THREE.MathUtils.lerp(
      currentSpherical.current.radius,
      targetSpherical.current.radius,
      lerpFactor
    );

    const { radius, yaw, pitch } = currentSpherical.current;
    
    // Convert spherical to cartesian coordinates
    const x = radius * Math.sin(yaw) * Math.cos(pitch);
    const y = radius * Math.sin(pitch);
    const z = radius * Math.cos(yaw) * Math.cos(pitch);

    camera.position.set(x, y, z);
    camera.lookAt(0, 0, 0);
  });

  return null;
};
