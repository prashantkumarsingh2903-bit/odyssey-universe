export class AudioEngine {
  context: AudioContext | null = null;
  masterGain: GainNode | null = null;
  delayNode: DelayNode | null = null;
  oscillator: OscillatorNode | null = null;

  init() {
    if (this.context) return;
    this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    this.masterGain = this.context.createGain();
    this.masterGain.gain.value = 0.5;
    this.masterGain.connect(this.context.destination);

    this.delayNode = this.context.createDelay(5.0);
    this.delayNode.delayTime.value = 0.5;
    
    // Feedback loop for delay
    const feedback = this.context.createGain();
    feedback.gain.value = 0.4;
    this.delayNode.connect(feedback);
    feedback.connect(this.delayNode);
    this.delayNode.connect(this.masterGain);
  }

  startDrone() {
    if (!this.context || !this.masterGain) return;
    
    this.oscillator = this.context.createOscillator();
    this.oscillator.type = 'sine';
    this.oscillator.frequency.setValueAtTime(110, this.context.currentTime); // A2
    
    const droneGain = this.context.createGain();
    droneGain.gain.setValueAtTime(0, this.context.currentTime);
    droneGain.gain.linearRampToValueAtTime(0.2, this.context.currentTime + 2);
    
    this.oscillator.connect(droneGain);
    droneGain.connect(this.masterGain);
    if (this.delayNode) droneGain.connect(this.delayNode);
    
    this.oscillator.start();
  }

  setAnomalyState(isHazardous: boolean) {
    if (!this.oscillator || !this.context) return;
    // Transpose from A major (exploration) to A minor (hazardous)
    // Actually just drop to a lower dissonant frequency
    const targetFreq = isHazardous ? 103.83 : 110; 
    this.oscillator.frequency.linearRampToValueAtTime(targetFreq, this.context.currentTime + 1);
  }

  handleMonolithProximity(distance: number, size: number) {
    if (!this.delayNode || !this.context) return;
    // Closer distance = faster delay, larger size = more feedback/reverb illusion
    const delayTime = Math.max(0.1, distance * 0.05);
    this.delayNode.delayTime.linearRampToValueAtTime(delayTime, this.context.currentTime + 0.5);
  }
}

export const audioEngine = new AudioEngine();
