import { useEffect, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
// @ts-ignore
import { PostProcessing } from 'three/webgpu';
import { pass, dither, mrt } from 'three/tsl';

export const PostProcessingManager = () => {
  const { gl, scene, camera } = useThree();

  const postProcessing = useMemo(() => {
    if (typeof (gl as any).isWebGPURenderer === 'undefined') return null;
    return new PostProcessing(gl);
  }, [gl]);

  useEffect(() => {
    if (!postProcessing) return;

    // Build the TSL Post Processing Graph
    const scenePass = pass(scene, camera);
    const sceneColor = scenePass.getTextureNode();
    
    // Simulate filmic grading + dither to prevent color banding in space
    const cinematicOutput = dither(sceneColor);

    postProcessing.outputNode = cinematicOutput;
  }, [postProcessing, scene, camera]);

  useFrame(() => {
    if (postProcessing) {
      postProcessing.render();
    }
  }, 1); // priority 1 ensures this runs after normal render loop and hijacks it

  return null;
};
