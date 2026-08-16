/* ==========================================================================
   ORANGEBLUE STUDIO PRO - AUDIO ENGINE (HIGH FIDELITY STEREO)
   Web Audio API sound manager with Dynamics Compressor, EQ & 48kHz audio processing
   ========================================================================== */

window.AudioEngine = {
  ctx: null,
  activeBuffer: null,
  sourceNode: null,
  gainNode: null,
  compressorNode: null,
  filterNode: null,
  destNode: null,
  isMuted: false,
  volume: 0.85,
  isPlaying: false,
  startTime: 0,
  pauseTime: 0,
  musicMetadata: null,

  init: function() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx({ sampleRate: 48000 });
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  },

  loadAudioFile: function(file) {
    this.init();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const arrayBuffer = e.target.result;
        this.ctx.decodeAudioData(arrayBuffer, (decodedBuffer) => {
          this.activeBuffer = decodedBuffer;
          this.musicMetadata = {
            name: file.name,
            size: file.size,
            type: file.type,
            duration: decodedBuffer.duration,
            arrayBuffer: arrayBuffer
          };
          resolve(this.musicMetadata);
        }, (err) => {
          reject(new Error('Formato de áudio não suportado ou corrompido.'));
        });
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  },

  loadAudioFromBuffer: function(audioBuffer, name = 'Musica.mp3') {
    this.init();
    this.activeBuffer = audioBuffer;
    this.musicMetadata = {
      name: name,
      duration: audioBuffer.duration
    };
    return this.musicMetadata;
  },

  // Play audio with dynamics compressor & subtle high-fidelity EQ
  play: function(currentTime = 0, fadeEffect = true, loop = true) {
    if (!this.activeBuffer) return;
    this.init();

    this.stop(); // Stop previous playback

    this.sourceNode = this.ctx.createBufferSource();
    this.sourceNode.buffer = this.activeBuffer;
    this.sourceNode.loop = loop;

    // Gain node for volume control
    this.gainNode = this.ctx.createGain();
    const currentVol = this.isMuted ? 0 : this.volume;
    this.gainNode.gain.setValueAtTime(currentVol, this.ctx.currentTime);

    if (fadeEffect && currentVol > 0) {
      this.gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
      this.gainNode.gain.linearRampToValueAtTime(currentVol, this.ctx.currentTime + 1.2);
    }

    // High Fidelity Audio Compressor (Prevents clipping & enhances clarity)
    this.compressorNode = this.ctx.createDynamicsCompressor();
    this.compressorNode.threshold.setValueAtTime(-18, this.ctx.currentTime);
    this.compressorNode.knee.setValueAtTime(30, this.ctx.currentTime);
    this.compressorNode.ratio.setValueAtTime(12, this.ctx.currentTime);
    this.compressorNode.attack.setValueAtTime(0.003, this.ctx.currentTime);
    this.compressorNode.release.setValueAtTime(0.25, this.ctx.currentTime);

    // Audio Equalizer (Subtle warm bass & crisp treble boost)
    this.filterNode = this.ctx.createBiquadFilter();
    this.filterNode.type = 'peaking';
    this.filterNode.frequency.setValueAtTime(3200, this.ctx.currentTime); // Treble boost
    this.filterNode.gain.setValueAtTime(2.5, this.ctx.currentTime);

    // Connect Audio Nodes Pipeline
    this.sourceNode.connect(this.gainNode);
    this.gainNode.connect(this.filterNode);
    this.filterNode.connect(this.compressorNode);
    this.compressorNode.connect(this.ctx.destination);

    // Connect to recorder destination stream if recording
    if (this.destNode) {
      this.compressorNode.connect(this.destNode);
    }

    const startOffset = currentTime % this.activeBuffer.duration;
    this.sourceNode.start(0, startOffset);
    this.isPlaying = true;
    this.startTime = this.ctx.currentTime - startOffset;
  },

  stop: function() {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
        this.sourceNode.disconnect();
      } catch (e) {}
      this.sourceNode = null;
    }
    this.isPlaying = false;
  },

  setVolume: function(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.gainNode && !this.isMuted) {
      this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  },

  toggleMute: function() {
    this.isMuted = !this.isMuted;
    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
    return this.isMuted;
  },

  getAudioStreamDestination: function() {
    this.init();
    this.destNode = this.ctx.createMediaStreamDestination();
    if (this.compressorNode) {
      this.compressorNode.connect(this.destNode);
    }
    return this.destNode.stream;
  },

  removeMusic: function() {
    this.stop();
    this.activeBuffer = null;
    this.musicMetadata = null;
  }
};
