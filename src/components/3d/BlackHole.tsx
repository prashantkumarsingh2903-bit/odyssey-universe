import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { ScreenQuad } from '@react-three/drei';
import * as THREE from 'three';

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float iTime;
  uniform vec2 iResolution;
  uniform vec2 iCameraRot;
  
  #define STEPS 120
  #define MAX_DIST 25.0
  #define EVENT_HORIZON 0.8
  #define MASS 0.95
  
  float hash(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
  }

  float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
      float v = 0.0;
      float a = 0.5;
      mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
      for (int i = 0; i < 6; i++) {
          v += a * noise(p);
          p = rot * p * 2.0;
          a *= 0.5;
      }
      return v;
  }

  vec3 getBackground(vec3 dir) {
      vec2 uv = vec2(atan(dir.z, dir.x), asin(dir.y));
      float n = fbm(uv * 4.0 + vec2(iTime * 0.05, 0.0));
      float starNoise = hash(uv * 150.0);
      float star = pow(starNoise, 80.0) * 3.0;
      vec3 bg = vec3(0.02, 0.03, 0.08) * n; 
      bg += vec3(0.2, 0.4, 0.7) * fbm(uv * 12.0 + 10.0) * 0.15; 
      bg += vec3(1.0, 0.9, 1.0) * star; 
      return max(bg, vec3(0.0));
  }

  vec4 accretionDisk(vec3 pos, float r) {
      float innerRad = EVENT_HORIZON + 0.3;
      float outerRad = 6.0;
      float thickness = 0.08; 
      
      if (r < innerRad || r > outerRad) return vec4(0.0);
      
      float currentThickness = thickness * (1.0 + (r - innerRad) * 0.2);
      float h = abs(pos.y);
      if (h > currentThickness) return vec4(0.0);
      
      float density = smoothstep(currentThickness, 0.0, h);
      density *= smoothstep(outerRad, outerRad - 1.5, r);
      density *= smoothstep(innerRad, innerRad + 0.3, r);
      
      float angle = atan(pos.z, pos.x);
      float speed = 2.5 / sqrt(r); 
      
      vec2 uv = vec2(r * 2.5, angle * 2.0 - iTime * speed);
      float n = fbm(uv * 3.0 + iTime * 0.1);
      
      density *= (n * 1.5 + 0.5);
      
      vec3 hot = vec3(1.0, 0.9, 0.6); 
      vec3 warm = vec3(1.0, 0.4, 0.1); 
      vec3 cool = vec3(0.4, 0.1, 0.05); 
      
      float temp = smoothstep(outerRad, innerRad, r);
      vec3 col = mix(cool, warm, smoothstep(0.0, 0.6, temp));
      col = mix(col, hot, smoothstep(0.6, 1.0, temp));
      col += vec3(1.0, 0.8, 0.5) * pow(n, 4.0) * 2.5; 
      
      vec3 tangent = vec3(-sin(angle), 0.0, cos(angle));
      vec3 viewDir = normalize(pos);
      float doppler = dot(tangent, viewDir);
      float beaming = 1.0 + 0.8 * doppler; 
      
      return vec4(col * density * beaming * 1.5, density * 0.12);
  }

  vec4 sphericalCorona(vec3 pos, float r) {
      float dist = r - EVENT_HORIZON;
      if (dist > 1.2 || dist < 0.0) return vec4(0.0);
      
      float density = smoothstep(1.2, 0.0, dist);
      density = pow(density, 4.0); 
      
      vec3 norm = normalize(pos);
      float angle = iTime * 0.5;
      
      float s = sin(angle), c = cos(angle);
      mat2 rotMap = mat2(c, -s, s, c);
      vec3 rotPos = pos;
      rotPos.xz *= rotMap;
      rotPos.xy *= rotMap; 
      
      float n = fbm(rotPos * 3.0 - iTime * 0.2);
      density *= (n * 1.5 + 0.5);
      
      vec3 col = vec3(1.0, 0.6, 0.1); 
      return vec4(col * density * 2.0, density * 0.015);
  }

  mat2 rot(float a) {
      float s = sin(a), c = cos(a);
      return mat2(c, -s, s, c);
  }

  void main() {
      vec2 uv = (gl_FragCoord.xy - 0.5 * iResolution.xy) / iResolution.y;
      
      float pitch = iCameraRot.y; 
      float yaw = iCameraRot.x; 

      vec3 ro = vec3(0.0, 0.0, -10.0); 
      ro.yz *= rot(-pitch);
      ro.xz *= rot(-yaw);
      
      vec3 rd = normalize(vec3(uv.x, uv.y, 1.2)); 
      rd.yz *= rot(-pitch);
      rd.xz *= rot(-yaw);

      vec3 col = vec3(0.0);
      
      vec3 pos = ro;
      vec3 dir = rd;
      float dt = 0.05; 
      vec4 diskCol = vec4(0.0);
      
      for(int i = 0; i < STEPS; i++) {
          float r = length(pos);
          
          if (r < EVENT_HORIZON) break; 
          
          if (r > MAX_DIST) {
              col = getBackground(dir);
              break; 
          }
          
          float force = MASS / (r * r);
          dir = normalize(dir - normalize(pos) * force * dt);
          
          vec4 sampleCol = accretionDisk(pos, r);
          vec4 coronaCol = sphericalCorona(pos, r);
          
          sampleCol.rgb += coronaCol.rgb;
          sampleCol.a += coronaCol.a;
          
          diskCol.rgb += sampleCol.rgb * (1.0 - diskCol.a);
          diskCol.a += sampleCol.a;
          
          if(diskCol.a >= 0.99) break;
          pos += dir * dt;
      }
      
      col = mix(col, diskCol.rgb, min(diskCol.a, 1.0));
      
      float exposure = 1.2;
      col *= exposure;
      col = (col * (2.51 * col + 0.03)) / (col * (2.43 * col + 0.59) + 0.14);
      col = pow(col, vec3(1.0/2.2));
      
      float vignette = length(uv);
      col *= 1.0 - vignette * 0.25;

      gl_FragColor = vec4(col, 1.0);
  }
`;

export const BlackHole = () => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { size } = useThree();

  const uniforms = useMemo(() => ({
    iTime: { value: 0 },
    iResolution: { value: new THREE.Vector2(size.width, size.height) },
    iCameraRot: { value: new THREE.Vector2(0.5, -0.4) }
  }), []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.iTime.value = state.clock.getElapsedTime();
      materialRef.current.uniforms.iResolution.value.set(size.width, size.height);
      
      const camPos = state.camera.position;
      const r = camPos.length();
      const yaw = Math.atan2(camPos.x, camPos.z);
      const pitch = Math.asin(camPos.y / r);
      
      materialRef.current.uniforms.iCameraRot.value.set(yaw, pitch);
    }
  });

  return (
    <ScreenQuad>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthWrite={false}
        depthTest={false}
      />
    </ScreenQuad>
  );
};
