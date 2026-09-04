import { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Sparkles, Hand, Lock, ZoomIn, Target, Info } from 'lucide-react';
import { useGestureStore, type GestureType } from '../../store/useGestureStore';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],       // Index
  [0, 9], [9, 10], [10, 11], [11, 12],  // Middle
  [0, 13], [13, 14], [14, 15], [15, 16],// Ring
  [0, 17], [17, 18], [18, 19], [19, 20],// Pinky
  [5, 9], [9, 13], [13, 17]             // Palm base
];

const gestureInfo: Record<GestureType, { label: string; icon: any; color: string; desc: string }> = {
  NONE: {
    label: 'SEARCHING FOR HAND...',
    icon: Hand,
    color: 'text-white/40',
    desc: 'Raise your hand in front of the camera'
  },
  ORBIT: {
    label: 'ORBITING SPACETIME',
    icon: Hand,
    color: 'text-blue-400',
    desc: 'Move open palm to orbit around the black hole'
  },
  PINCH_ZOOM: {
    label: 'WARP ZOOMING',
    icon: ZoomIn,
    color: 'text-amber-400',
    desc: 'Pinch thumb & index to pull/push camera depth'
  },
  FIST_LOCK: {
    label: 'GRAVITATIONAL LOCK',
    icon: Lock,
    color: 'text-red-400',
    desc: 'Clench fist to freeze and stabilize the universe'
  },
  POINTING: {
    label: 'TARGETING NODE',
    icon: Target,
    color: 'text-purple-400',
    desc: 'Point with index finger to laser-select knowledge nodes'
  }
};

export const GestureHUD = () => {
  const {
    isCameraActive,
    setCameraActive,
    currentGesture,
    handDetected,
    setModelLoaded,
    updateGesture
  } = useGestureStore();

  const [isExpanded, setIsExpanded] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);

  const prevHandPos = useRef<{ x: number; y: number } | null>(null);
  const smoothedHandPos = useRef<{ x: number; y: number; z: number }>({ x: 0.5, y: 0.5, z: 0 });
  const prevPinchDist = useRef<number | null>(null);

  // Initialize MediaPipe model
  useEffect(() => {
    let isMounted = true;

    async function initAI() {
      try {
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
      } catch (err) {
        console.warn("Retrying with CPU delegate...", err);
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
          }
        } catch (cpuErr) {
          console.error("AI Model Init failed", cpuErr);
        }
      }
    }

    initAI();

    return () => {
      isMounted = false;
      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close();
      }
    };
  }, [setModelLoaded]);

  // Handle camera stream
  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startCamera() {
      if (!isCameraActive || !videoRef.current) return;
      try {
        setCameraError(null);
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 320 },
            height: { ideal: 240 },
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
      } catch (err: any) {
        console.error("Webcam access error:", err);
        setCameraError("Camera permission denied.");
        setCameraActive(false);
      }
    }

    if (isCameraActive) {
      startCamera();
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(t => t.stop());
        videoRef.current.srcObject = null;
      }
      updateGesture({ handDetected: false, currentGesture: 'NONE' });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [isCameraActive, setCameraActive, updateGesture]);

  // Processing loop
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
              const landmarks = results.landmarks[0];

              const wrist = landmarks[0];
              const thumbTip = landmarks[4];
              const indexTip = landmarks[8];
              const middleTip = landmarks[12];
              const ringTip = landmarks[16];
              const pinkyTip = landmarks[20];
              const palmCenter = landmarks[9];

              // 1. Pinch distance
              const pinchDist = Math.hypot(
                thumbTip.x - indexTip.x,
                thumbTip.y - indexTip.y,
                thumbTip.z - indexTip.z
              );

              // 2. Tip to wrist distances
              const dIndex = Math.hypot(indexTip.x - wrist.x, indexTip.y - wrist.y);
              const dMiddle = Math.hypot(middleTip.x - wrist.x, middleTip.y - wrist.y);
              const dRing = Math.hypot(ringTip.x - wrist.x, ringTip.y - wrist.y);
              const dPinky = Math.hypot(pinkyTip.x - wrist.x, pinkyTip.y - wrist.y);

              const isFist = dIndex < 0.28 && dMiddle < 0.28 && dRing < 0.28 && dPinky < 0.28;
              const isPointing = dIndex > 0.35 && dMiddle < 0.28 && dRing < 0.28 && dPinky < 0.28;
              const isPinching = pinchDist < 0.08;

              // Exponential smoothing (mirror X)
              const rawX = 1.0 - palmCenter.x;
              const rawY = palmCenter.y;
              const rawZ = palmCenter.z;

              const alpha = 0.35;
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

              let zoomDelta = 0;
              if (isPinching) {
                if (prevPinchDist.current !== null) {
                  zoomDelta = (pinchDist - prevPinchDist.current) * 15;
                }
                prevPinchDist.current = pinchDist;
              } else {
                prevPinchDist.current = null;
              }

              let detectedGesture: GestureType = 'ORBIT';
              if (isFist) {
                detectedGesture = 'FIST_LOCK';
              } else if (isPinching) {
                detectedGesture = 'PINCH_ZOOM';
              } else if (isPointing) {
                detectedGesture = 'POINTING';
              }

              const pointerScreenPos = {
                x: (1.0 - indexTip.x) * 2 - 1,
                y: -(indexTip.y * 2 - 1)
              };

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

              // --- Draw Sci-Fi Skeleton on Canvas ---
              ctx.save();
              ctx.translate(canvas.width, 0);
              ctx.scale(-1, 1);

              // 1. Draw Skeleton Lines
              ctx.lineWidth = 2.5;
              HAND_CONNECTIONS.forEach(([sIdx, eIdx]) => {
                const s = landmarks[sIdx];
                const e = landmarks[eIdx];

                ctx.beginPath();
                ctx.moveTo(s.x * canvas.width, s.y * canvas.height);
                ctx.lineTo(e.x * canvas.width, e.y * canvas.height);

                if (detectedGesture === 'PINCH_ZOOM') {
                  ctx.strokeStyle = 'rgba(245, 166, 35, 0.85)';
                } else if (detectedGesture === 'FIST_LOCK') {
                  ctx.strokeStyle = 'rgba(255, 75, 75, 0.85)';
                } else if (detectedGesture === 'POINTING') {
                  ctx.strokeStyle = 'rgba(168, 85, 247, 0.85)';
                } else {
                  ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
                }
                ctx.stroke();
              });

              // 2. Draw Joints
              landmarks.forEach((pt, idx) => {
                const px = pt.x * canvas.width;
                const py = pt.y * canvas.height;
                const isTip = [4, 8, 12, 16, 20].includes(idx);

                ctx.beginPath();
                ctx.arc(px, py, isTip ? 5 : 3, 0, 2 * Math.PI);
                ctx.fillStyle = isTip ? '#ffffff' : '#38bdf8';
                ctx.shadowColor = '#38bdf8';
                ctx.shadowBlur = isTip ? 10 : 4;
                ctx.fill();
              });

              ctx.restore();
            } else {
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

  const activeGestureData = gestureInfo[currentGesture] || gestureInfo.NONE;
  const ActiveIcon = activeGestureData.icon;

  return (
    <div className="absolute top-8 right-8 z-30 flex flex-col items-end gap-3 pointer-events-none">
      {/* HUD Header Bar */}
      <div className="flex items-center gap-2 pointer-events-auto">
        <button
          onClick={() => setCameraActive(!isCameraActive)}
          className={`flex items-center gap-2.5 px-4 py-2 rounded-full border text-xs tracking-widest uppercase font-medium transition-all backdrop-blur-xl shadow-lg ${
            isCameraActive
              ? 'bg-blue-500/20 border-blue-400/50 text-blue-300 shadow-blue-500/20'
              : 'bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          {isCameraActive ? (
            <>
              <Camera size={14} className="animate-pulse text-blue-400" />
              <span>GESTURE TRACKING ACTIVE</span>
            </>
          ) : (
            <>
              <CameraOff size={14} className="text-white/40" />
              <span>ENABLE HAND GESTURES</span>
            </>
          )}
        </button>

        {isCameraActive && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
            title="Toggle Vision Feed"
          >
            <Sparkles size={14} />
          </button>
        )}
      </div>

      {/* Vision Feed & Radar Box */}
      {isCameraActive && isExpanded && (
        <div className="w-72 bg-surface/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col gap-3 pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-300">
          {/* Video / Skeleton Canvas */}
          <div className="relative w-full aspect-video bg-black/60 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="absolute inset-0 w-full h-full object-cover -scale-x-100 opacity-40"
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-cover z-10"
            />

            {/* Target Reticle Crosshair */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-20">
              <div className="w-24 h-24 border border-dashed border-white/50 rounded-full animate-spin [animation-duration:15s]" />
              <div className="absolute w-2 h-2 bg-white rounded-full" />
            </div>

            {!handDetected && (
              <div className="absolute z-20 flex flex-col items-center gap-1.5 text-center p-2">
                <Hand size={20} className="text-white/40 animate-bounce" />
                <span className="text-[10px] tracking-widest uppercase text-white/60 font-mono">
                  Show hand to camera
                </span>
              </div>
            )}
          </div>

          {/* Real-time Gesture State Badge */}
          <div className="flex items-center justify-between bg-black/40 border border-white/5 rounded-xl px-3 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className={`p-1.5 rounded-lg bg-white/5 ${activeGestureData.color}`}>
                <ActiveIcon size={16} />
              </div>
              <div className="flex flex-col">
                <span className={`text-[11px] font-mono tracking-wider font-semibold ${activeGestureData.color}`}>
                  {activeGestureData.label}
                </span>
                <span className="text-[10px] text-white/50 font-light">
                  {activeGestureData.desc}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Gesture Guide */}
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-white/40 pt-1 border-t border-white/5">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span>Open: Orbit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Pinch: Zoom</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              <span>Fist: Freeze</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              <span>Point: Select</span>
            </div>
          </div>
        </div>
      )}

      {cameraError && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-xs px-3 py-2 rounded-xl backdrop-blur-md flex items-center gap-2 pointer-events-auto">
          <Info size={14} />
          <span>{cameraError}</span>
        </div>
      )}
    </div>
  );
};
