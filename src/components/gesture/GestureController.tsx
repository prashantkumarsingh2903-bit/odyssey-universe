import { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { useGestureStore, type GestureType } from '../../store/useGestureStore';

// Landmark connections for drawing hand skeleton
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],       // Index
  [0, 9], [9, 10], [10, 11], [11, 12],  // Middle
  [0, 13], [13, 14], [14, 15], [15, 16],// Ring
  [0, 17], [17, 18], [18, 19], [19, 20],// Pinky
  [5, 9], [9, 13], [13, 17]             // Palm base
];

export const GestureController = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    isCameraActive,
    setModelLoaded,
    updateGesture
  } = useGestureStore();

  const prevHandPos = useRef<{ x: number; y: number } | null>(null);
  const smoothedHandPos = useRef<{ x: number; y: number; z: number }>({ x: 0.5, y: 0.5, z: 0 });
  const prevPinchDist = useRef<number | null>(null);

  // Initialize MediaPipe HandLandmarker
  useEffect(() => {
    let isMounted = true;

    async function initHandLandmarker() {
      try {
        setIsLoading(true);
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        
        if (!isMounted) return;

        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });

        if (!isMounted) return;

        handLandmarkerRef.current = handLandmarker;
        setModelLoaded(true);
        setIsLoading(false);
      } catch (err) {
        console.warn("GPU delegate failed, attempting CPU fallback...", err);
        try {
          const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
          );
          const handLandmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
              delegate: "CPU"
            },
            runningMode: "VIDEO",
            numHands: 1
          });
          if (isMounted) {
            handLandmarkerRef.current = handLandmarker;
            setModelLoaded(true);
            setIsLoading(false);
          }
        } catch (cpuErr) {
          console.error("Failed to load HandLandmarker:", cpuErr);
          if (isMounted) {
            setErrorMsg("Could not load AI vision model.");
            setIsLoading(false);
          }
        }
      }
    }

    initHandLandmarker();

    return () => {
      isMounted = false;
      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close();
      }
    };
  }, [setModelLoaded]);

  // Handle webcam stream start/stop
  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startCamera() {
      if (!isCameraActive || !videoRef.current) return;
      try {
        setErrorMsg(null);
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          },
          audio: false
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
          };
        }
      } catch (err) {
        console.error("Webcam access error:", err);
        setErrorMsg("Camera permission denied or device not found.");
        updateGesture({ isCameraActive: false });
      }
    }

    if (isCameraActive) {
      startCamera();
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      updateGesture({ handDetected: false, currentGesture: 'NONE' });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCameraActive, updateGesture]);

  // Real-time detection loop
  useEffect(() => {
    let isRunning = true;

    function detectFrame() {
      if (!isRunning) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const handLandmarker = handLandmarkerRef.current;

      if (
        isCameraActive &&
        video &&
        video.readyState >= 2 &&
        handLandmarker &&
        canvas
      ) {
        if (video.currentTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = video.currentTime;
          
          const startTimeMs = performance.now();
          const results = handLandmarker.detectForVideo(video, startTimeMs);

          const ctx = canvas.getContext('2d');
          if (ctx) {
            canvas.width = video.videoWidth || 320;
            canvas.height = video.videoHeight || 240;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (results.landmarks && results.landmarks.length > 0) {
              const landmarks = results.landmarks[0]; // First detected hand

              // Landmark indices:
              // 0: Wrist, 4: Thumb Tip, 8: Index Tip, 12: Middle Tip, 16: Ring Tip, 20: Pinky Tip
              const wrist = landmarks[0];
              const thumbTip = landmarks[4];
              const indexTip = landmarks[8];
              const middleTip = landmarks[12];
              const ringTip = landmarks[16];
              const pinkyTip = landmarks[20];
              const palmCenter = landmarks[9]; // Middle MCP

              // 1. Calculate Pinch (Thumb Tip to Index Tip Distance)
              const pinchDist = Math.hypot(
                thumbTip.x - indexTip.x,
                thumbTip.y - indexTip.y,
                thumbTip.z - indexTip.z
              );

              // 2. Calculate Distances from tips to wrist (to detect Fist vs Open Hand)
              const dIndex = Math.hypot(indexTip.x - wrist.x, indexTip.y - wrist.y);
              const dMiddle = Math.hypot(middleTip.x - wrist.x, middleTip.y - wrist.y);
              const dRing = Math.hypot(ringTip.x - wrist.x, ringTip.y - wrist.y);
              const dPinky = Math.hypot(pinkyTip.x - wrist.x, pinkyTip.y - wrist.y);

              const isFist = dIndex < 0.26 && dMiddle < 0.26 && dRing < 0.26 && dPinky < 0.26;
              const isPointing = dIndex > 0.35 && dMiddle < 0.28 && dRing < 0.28 && dPinky < 0.28;
              const isPinching = pinchDist < 0.075;

              // Exponential smoothing for hand coordinates (Inverted X for mirrored camera feel)
              const rawX = 1.0 - palmCenter.x;
              const rawY = palmCenter.y;
              const rawZ = palmCenter.z;

              const alpha = 0.25; // smoothing factor
              smoothedHandPos.current.x += (rawX - smoothedHandPos.current.x) * alpha;
              smoothedHandPos.current.y += (rawY - smoothedHandPos.current.y) * alpha;
              smoothedHandPos.current.z += (rawZ - smoothedHandPos.current.z) * alpha;

              let deltaX = 0;
              let deltaY = 0;
              if (prevHandPos.current) {
                deltaX = rawX - prevHandPos.current.x;
                deltaY = rawY - prevHandPos.current.y;
              }
              prevHandPos.current = { x: rawX, y: rawY };

              // Calculate zoom delta during pinch
              let zoomDelta = 0;
              if (isPinching) {
                if (prevPinchDist.current !== null) {
                  zoomDelta = (pinchDist - prevPinchDist.current) * 10;
                }
                prevPinchDist.current = pinchDist;
              } else {
                prevPinchDist.current = null;
              }

              // Determine Gesture State
              let detectedGesture: GestureType = 'ORBIT';
              if (isFist) {
                detectedGesture = 'FIST_LOCK';
              } else if (isPinching) {
                detectedGesture = 'PINCH_ZOOM';
              } else if (isPointing) {
                detectedGesture = 'POINTING';
              }

              // Pointing screen coordinates (-1 to 1 for ThreeJS raycaster)
              const pointerScreenPos = {
                x: (1.0 - indexTip.x) * 2 - 1,
                y: -(indexTip.y * 2 - 1)
              };

              // Update Global Store
              updateGesture({
                handDetected: true,
                currentGesture: detectedGesture,
                handPosition: { ...smoothedHandPos.current },
                handDelta: { x: deltaX, y: deltaY },
                pointerScreenPos,
                pinchDistance: pinchDist,
                zoomFactor: zoomDelta,
                confidence: 0.95
              });

              // --- Draw Sci-Fi Futuristic Skeleton Overlay ---
              ctx.save();
              // Mirror the canvas rendering to match user natural movement
              ctx.translate(canvas.width, 0);
              ctx.scale(-1, 1);

              // 1. Draw Skeleton Lines
              ctx.lineWidth = 2;
              HAND_CONNECTIONS.forEach(([startIdx, endIdx]) => {
                const start = landmarks[startIdx];
                const end = landmarks[endIdx];

                ctx.beginPath();
                ctx.moveTo(start.x * canvas.width, start.y * canvas.height);
                ctx.lineTo(end.x * canvas.width, end.y * canvas.height);

                if (detectedGesture === 'PINCH_ZOOM') {
                  ctx.strokeStyle = 'rgba(245, 166, 35, 0.8)'; // Golden Amber
                } else if (detectedGesture === 'FIST_LOCK') {
                  ctx.strokeStyle = 'rgba(255, 75, 75, 0.8)'; // Red Lock
                } else if (detectedGesture === 'POINTING') {
                  ctx.strokeStyle = 'rgba(144, 19, 254, 0.8)'; // Purple Ray
                } else {
                  ctx.strokeStyle = 'rgba(74, 144, 226, 0.7)'; // Cyan/Blue Orbit
                }
                ctx.stroke();
              });

              // 2. Draw Landmark Glow Nodes
              landmarks.forEach((pt, idx) => {
                const px = pt.x * canvas.width;
                const py = pt.y * canvas.height;

                ctx.beginPath();
                const isTip = [4, 8, 12, 16, 20].includes(idx);
                const radius = isTip ? 4 : 2.5;
                ctx.arc(px, py, radius, 0, 2 * Math.PI);

                if (isTip) {
                  ctx.fillStyle = '#ffffff';
                  ctx.shadowColor = '#4A90E2';
                  ctx.shadowBlur = 8;
                } else {
                  ctx.fillStyle = '#4A90E2';
                  ctx.shadowBlur = 0;
                }
                ctx.fill();
              });

              // 3. Pinch Effect Indicator
              if (isPinching) {
                const pinchX = ((thumbTip.x + indexTip.x) / 2) * canvas.width;
                const pinchY = ((thumbTip.y + indexTip.y) / 2) * canvas.height;

                ctx.beginPath();
                ctx.arc(pinchX, pinchY, 12, 0, 2 * Math.PI);
                ctx.strokeStyle = '#F5A623';
                ctx.lineWidth = 2;
                ctx.setLineDash([3, 3]);
                ctx.stroke();
              }

              ctx.restore();
            } else {
              // No hand detected in frame
              prevHandPos.current = null;
              prevPinchDist.current = null;
              updateGesture({ handDetected: false, currentGesture: 'NONE' });
            }
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(detectFrame);
    }

    animationFrameRef.current = requestAnimationFrame(detectFrame);

    return () => {
      isRunning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isCameraActive, updateGesture]);

  return (
    <div className="hidden">
      {/* Hidden processing elements */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="hidden"
      />
      {errorMsg && <div data-error={errorMsg} />}
      {isLoading && <div data-loading="true" />}
    </div>
  );
};
