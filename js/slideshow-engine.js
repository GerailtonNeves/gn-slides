/* ==========================================================================
   GN SLIDES PRO 4K - HIGH-PERFORMANCE CANVAS SLIDESHOW ENGINE
   Optimized for Desktop, Mobile & Tablet Browsers (Zero Memory Crash)
   Supports Full-Photo Fit (100% Complete Photos), Rich Cinematic Transitions
   (Glitch/Falhando, Cross-Zoom, Circle Reveal, Blur Glitch, Slide Push, Cube Rotate),
   Ultra-Vibrant 4K Overlay Text Rendering & Dynamic Ken Burns Motion.
   ========================================================================== */

window.SlideshowEngine = {
  canvas: null,
  ctx: null,
  slides: [],
  loadedImages: new Map(),
  blurCache: new Map(),
  
  // Resolution Settings
  resolution: '1080p',
  exportResolution: '4K',
  aspectRatio: '16:9',
  width: 1920,
  height: 1080,
  
  // Transition Settings
  globalTransition: 'random',
  transitionDuration: 1.2,
  kenBurnsEnabled: true,
  imageFitMode: 'contain-blur', // Default: 100% Full Photo with Blurred Background
  photoFilter: 'orange-blue',

  // Cinematic Intro Opening Screen Settings (100% Customizable)
  introEnabled: true,
  introTag: 'EDIÇÃO ESPECIAL DE FOTOS',
  introPresenter: 'Apresenta',
  introTitle: 'Nossas Memórias Inesquecíveis',
  introSubtitle: 'Um Filme Especial de Fotos e Música',
  introDuration: 3.5,

  // Cinematic Outro Ending Screen Settings (100% Customizable)
  outroEnabled: true,
  outroIcon: '♥',
  outroTitle: 'Obrigado por Assistir!',
  outroSubtitle: 'Guardado para Sempre no Coração',
  outroDuration: 3.5,

  // Text Settings on Slides
  titleText: '',
  subtitleText: '',
  textPosition: 'center',
  textStyle: 'orange-glow',
  textDisplay: 'first-4-slides',

  // Animation Loop & Render Throttling State
  isPlaying: false,
  currentTime: 0,
  totalDuration: 0,
  animFrameId: null,
  lastTimestamp: null,
  renderPending: false,

  // Callbacks
  onTimeUpdate: null,
  onEnded: null,

  // Expanded Catalog of Ultra-Modern Transitions
  transitionList: [
    'glitch-flash', 
    'cross-zoom', 
    'circle-reveal', 
    'blur-glitch', 
    'fade', 
    'slide-left', 
    'slide-right', 
    'slide-up', 
    'zoom-in'
  ],

  isMobileDevice: function() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (window.innerWidth <= 768);
  },

  init: function(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d', { alpha: false, desynchronized: true });
    this.updateResolution();
  },

  setResolutionAndAspect: function(resMode, ratioStr) {
    this.exportResolution = resMode || '4K';
    this.aspectRatio = ratioStr || '16:9';
    this.updateResolution();
  },

  updateResolution: function() {
    const isMobile = this.isMobileDevice();
    const is4K = !isMobile && (this.resolution === '4K');
    const baseWidth = is4K ? 3840 : 1920;
    const baseHeight = is4K ? 2160 : 1080;

    if (this.aspectRatio === '16:9') {
      this.width = baseWidth; this.height = baseHeight;
    } else if (this.aspectRatio === '9:16') {
      this.width = is4K ? 2160 : 1080; this.height = is4K ? 3840 : 1920;
    } else if (this.aspectRatio === '1:1') {
      this.width = is4K ? 2160 : 1080; this.height = is4K ? 2160 : 1080;
    } else if (this.aspectRatio === '4:5') {
      this.width = is4K ? 2160 : 1080; this.height = is4K ? 2700 : 1350;
    }

    if (this.canvas) {
      this.canvas.width = this.width;
      this.canvas.height = this.height;
    }
    this.requestRender();
  },

  setSlides: async function(slideDataList) {
    this.slides = slideDataList;
    this.calculateTotalDuration();

    // Clean up unused cached images to prevent mobile RAM leaks
    const currentSlideIds = new Set(slideDataList.map(s => s.id));
    for (let id of this.loadedImages.keys()) {
      if (!currentSlideIds.has(id)) {
        this.loadedImages.delete(id);
        this.blurCache.delete(id);
      }
    }
    
    const loadPromises = slideDataList.map((slide) => {
      return new Promise((resolve) => {
        if (this.loadedImages.has(slide.id)) {
          resolve(this.loadedImages.get(slide.id));
          return;
        }
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
          this.loadedImages.set(slide.id, img);
          this.generateBlurCache(slide.id, img);
          resolve(img);
        };
        img.onerror = () => {
          console.warn('Erro ao carregar imagem:', slide.id);
          resolve(null);
        };
        img.src = slide.dataUrl || slide.url;
      });
    });

    await Promise.all(loadPromises);
    this.requestRender();
  },

  generateBlurCache: function(slideId, img) {
    try {
      const offscreen = document.createElement('canvas');
      offscreen.width = 480;
      offscreen.height = 270;
      const oCtx = offscreen.getContext('2d');
      oCtx.filter = 'blur(16px) brightness(0.65) saturate(1.4)';
      
      const imgRatio = img.width / img.height;
      const oRatio = 480 / 270;
      let drawW, drawH;

      if (imgRatio > oRatio) {
        drawH = 270; drawW = drawH * imgRatio;
      } else {
        drawW = 480; drawH = drawW / imgRatio;
      }
      const drawX = (480 - drawW) / 2;
      const drawY = (270 - drawH) / 2;

      oCtx.drawImage(img, drawX, drawY, drawW, drawH);
      this.blurCache.set(slideId, offscreen);
    } catch (e) {
      console.warn('Blur cache error:', e);
    }
  },

  calculateTotalDuration: function() {
    let dur = this.slides.reduce((acc, slide) => acc + (slide.duration || 3.5), 0);
    if (this.introEnabled && (this.introTitle || this.introPresenter || this.introTag)) {
      dur += (this.introDuration || 3.5);
    }
    if (this.outroEnabled && (this.outroTitle || this.outroSubtitle)) {
      dur += (this.outroDuration || 3.5);
    }
    this.totalDuration = dur;
    return this.totalDuration;
  },

  requestRender: function() {
    if (this.isPlaying || this.renderPending) return;
    this.renderPending = true;
    requestAnimationFrame(() => {
      this.renderPending = false;
      this.renderFrame(this.currentTime);
    });
  },

  play: function() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.lastTimestamp = performance.now();
    this.loop();
  },

  pause: function() {
    this.isPlaying = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  },

  seek: function(timeInSeconds) {
    this.currentTime = Math.max(0, Math.min(timeInSeconds, this.totalDuration));
    if (this.onTimeUpdate) {
      this.onTimeUpdate(this.currentTime, this.totalDuration);
    }
    this.requestRender();
  },

  loop: function() {
    if (!this.isPlaying) return;

    const now = performance.now();
    const delta = (now - this.lastTimestamp) / 1000;
    this.lastTimestamp = now;

    this.currentTime += delta;

    if (this.currentTime >= this.totalDuration) {
      this.currentTime = this.totalDuration;
      this.pause();
      if (this.onTimeUpdate) this.onTimeUpdate(this.currentTime, this.totalDuration);
      if (this.onEnded) this.onEnded();
      return;
    }

    if (this.onTimeUpdate) {
      this.onTimeUpdate(this.currentTime, this.totalDuration);
    }

    this.renderFrame(this.currentTime);
    this.animFrameId = requestAnimationFrame(() => this.loop());
  },

  renderFrame: function(time) {
    if (!this.ctx) return;
    const w = this.width;
    const h = this.height;

    // Deep luxury dark background
    this.ctx.fillStyle = '#060a12';
    this.ctx.fillRect(0, 0, w, h);

    const introDur = (this.introEnabled && (this.introTitle || this.introPresenter || this.introTag)) ? (this.introDuration || 3.5) : 0;
    const outroDur = (this.outroEnabled && (this.outroTitle || this.outroSubtitle)) ? (this.outroDuration || 3.5) : 0;
    const photosTotalDur = this.slides.reduce((acc, s) => acc + (s.duration || 3.5), 0);

    // 1. INTRO SCREEN RENDER
    if (introDur > 0 && time < introDur) {
      this.renderIntroScreen(time, introDur);
      if (window.LicenseSystem) window.LicenseSystem.drawWatermarkIfNeeded(this.ctx, w, h);
      return;
    }

    // 2. OUTRO SCREEN RENDER
    const outroStartTime = introDur + photosTotalDur;
    if (outroDur > 0 && time >= outroStartTime) {
      const outroRelTime = time - outroStartTime;
      this.renderOutroScreen(outroRelTime, outroDur);
      if (window.LicenseSystem) window.LicenseSystem.drawWatermarkIfNeeded(this.ctx, w, h);
      return;
    }

    // 3. PHOTO SLIDES RENDER WITH VARIED TRANSITIONS & FULL PHOTO FITTING
    if (this.slides.length === 0) {
      this.renderEmptyStateScreen();
      if (window.LicenseSystem) window.LicenseSystem.drawWatermarkIfNeeded(this.ctx, w, h);
      return;
    }

    let photoTime = time - introDur;
    let currentIdx = 0;
    let accumulatedTime = 0;

    for (let i = 0; i < this.slides.length; i++) {
      const slideDur = this.slides[i].duration || 3.5;
      if (photoTime >= accumulatedTime && photoTime < accumulatedTime + slideDur) {
        currentIdx = i;
        break;
      }
      accumulatedTime += slideDur;
    }

    if (currentIdx >= this.slides.length) currentIdx = this.slides.length - 1;

    const currentSlide = this.slides[currentIdx];
    const slideDur = currentSlide.duration || 3.5;
    const slideProgressTime = photoTime - accumulatedTime;
    const isLastSlide = (currentIdx === this.slides.length - 1);

    const transDur = this.transitionDuration;
    const isInTransition = (!isLastSlide && slideProgressTime >= (slideDur - transDur));

    if (isInTransition) {
      const nextIdx = currentIdx + 1;
      const nextSlide = this.slides[nextIdx];
      const progress = (slideProgressTime - (slideDur - transDur)) / transDur;

      const transType = (currentSlide.transition && currentSlide.transition !== 'default') 
        ? currentSlide.transition 
        : this.getTransitionTypeForIndex(currentIdx);

      this.renderTransition(currentSlide, nextSlide, progress, transType, slideProgressTime, slideDur);
    } else {
      const img = this.loadedImages.get(currentSlide.id);
      this.renderSingleSlide(currentSlide, img, slideProgressTime, slideDur, 1.0);
    }

    // Overlay caption or title
    this.renderSlideOverlayText(currentIdx, currentSlide);

    // Commercial License Watermark (for Guest Mode)
    if (window.LicenseSystem) {
      window.LicenseSystem.drawWatermarkIfNeeded(this.ctx, w, h);
    }
  },

  getTransitionTypeForIndex: function(idx) {
    if (this.globalTransition !== 'random') return this.globalTransition;
    return this.transitionList[idx % this.transitionList.length];
  },

  renderIntroScreen: function(time, duration) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    const fade = Math.min(1, Math.min(time / 0.8, (duration - time) / 0.8));
    ctx.save();
    ctx.globalAlpha = Math.max(0, fade);

    const grad = ctx.createRadialGradient(w/2, h/2, 100, w/2, h/2, w*0.8);
    grad.addColorStop(0, '#0c1e3d');
    grad.addColorStop(0.6, '#071124');
    grad.addColorStop(1, '#020612');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Neon Accent Frame
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 4;
    ctx.strokeRect(60, 60, w - 120, h - 120);

    const tag = (this.introTag || 'EDIÇÃO ESPECIAL DE FOTOS').toUpperCase();
    ctx.font = "700 32px 'Plus Jakarta Sans', sans-serif";
    ctx.fillStyle = "#38bdf8";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(tag, w/2, h/2 - 130);

    ctx.font = "500 28px 'Outfit', sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText(this.introPresenter || 'Apresenta', w/2, h/2 - 70);

    const title = this.introTitle || 'MEMÓRIAS INESQUECÍVEIS';
    ctx.font = "900 76px 'Plus Jakarta Sans', sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(249, 115, 22, 0.9)";
    ctx.shadowBlur = 35;
    ctx.fillText(title, w/2, h/2 + 15);

    ctx.shadowBlur = 0;
    ctx.font = "500 34px 'Outfit', sans-serif";
    ctx.fillStyle = "#fbbf24";
    ctx.fillText(this.introSubtitle || 'Um Filme Especial de Fotos e Música', w/2, h/2 + 110);

    ctx.restore();
  },

  renderOutroScreen: function(time, duration) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    const fade = Math.min(1, Math.min(time / 0.8, (duration - time) / 0.8));
    ctx.save();
    ctx.globalAlpha = Math.max(0, fade);

    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#020612');
    grad.addColorStop(0.5, '#0d1f3c');
    grad.addColorStop(1, '#020612');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const icon = this.outroIcon || '♥';
    ctx.font = "88px 'Outfit', sans-serif";
    ctx.fillStyle = "#f97316";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(249, 115, 22, 0.95)";
    ctx.shadowBlur = 45;
    ctx.fillText(icon, w/2, h/2 - 100);

    ctx.shadowBlur = 0;
    ctx.font = "800 70px 'Plus Jakarta Sans', sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(this.outroTitle || 'Obrigado por Assistir!', w/2, h/2 + 20);

    ctx.font = "500 34px 'Outfit', sans-serif";
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText(this.outroSubtitle || 'Guardado para Sempre no Coração', w/2, h/2 + 105);

    ctx.restore();
  },

  renderEmptyStateScreen: function() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, w, h);

    ctx.font = "800 40px 'Plus Jakarta Sans', sans-serif";
    ctx.fillStyle = "#38bdf8";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("GN SLIDES PRO 4K", w/2, h/2 - 30);

    ctx.font = "400 24px 'Outfit', sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText("Adicione fotos no menu à esquerda para visualizar o slideshow aqui.", w/2, h/2 + 30);
  },

  // 100% COMPLETE PHOTO RENDERER (NO CROPPING / FOTO INTEIRA PERFEITA)
  renderSingleSlide: function(slide, img, progressTime, totalSlideDur, alpha = 1.0) {
    if (!img) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.save();
    ctx.globalAlpha = alpha;

    // 1. Render Blurred Ambient Background (Full Fill)
    if (this.imageFitMode === 'contain-blur') {
      const blurImg = this.blurCache.get(slide.id);
      if (blurImg) {
        ctx.drawImage(blurImg, 0, 0, w, h);
      } else {
        ctx.fillStyle = '#060a12';
        ctx.fillRect(0, 0, w, h);
      }
      
      // Vignette Overlay for Depth
      const vigGrad = ctx.createRadialGradient(w/2, h/2, w*0.3, w/2, h/2, w*0.75);
      vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0.1)');
      vigGrad.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
      ctx.fillStyle = vigGrad;
      ctx.fillRect(0, 0, w, h);

    } else if (this.imageFitMode === 'contain-black') {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);
    }

    // 2. Calculate Ken Burns Motion & 100% Full Photo Bounds
    let scale = 1.0;
    if (this.kenBurnsEnabled) {
      const progress = progressTime / totalSlideDur;
      scale = 1.0 + (progress * 0.07); // Gentle 7% smooth zoom
    }

    const imgRatio = img.width / img.height;
    const screenRatio = w / h;
    let drawW, drawH, drawX, drawY;

    if (this.imageFitMode === 'cover') {
      if (imgRatio > screenRatio) {
        drawH = h * scale; drawW = drawH * imgRatio;
      } else {
        drawW = w * scale; drawH = drawW / imgRatio;
      }
    } else {
      // DEFAULT: FULL PHOTO 100% CONTAINED (Zero Cuts!)
      if (imgRatio > screenRatio) {
        drawW = w * scale; drawH = drawW / imgRatio;
      } else {
        drawH = h * scale; drawW = drawH * imgRatio;
      }
    }

    drawX = (w - drawW) / 2;
    drawY = (h - drawH) / 2;

    // Drop shadow behind main photo
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 10;

    ctx.drawImage(img, drawX, drawY, drawW, drawH);

    ctx.shadowBlur = 0;

    // Color Glow Overlay Filter
    if (this.photoFilter === 'orange-blue') {
      ctx.fillStyle = 'rgba(2, 132, 199, 0.04)';
      ctx.fillRect(0, 0, w, h);
    }

    ctx.restore();
  },

  // HIGH-IMPACT CINEMATIC & GLITCH TRANSITIONS SYSTEM
  renderTransition: function(slideA, slideB, progress, transType, progressTime, slideDur) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    const imgA = this.loadedImages.get(slideA.id);
    const imgB = this.loadedImages.get(slideB.id);

    // --- EFEITO 1: GLITCH FLASH (FALHANDO / CYBERPUNK) ---
    if (transType === 'glitch-flash') {
      ctx.save();
      // Step A: Draw Slide A with color shift & glitch horizontal displacement
      const glitchIntensity = Math.sin(progress * Math.PI);
      const shiftX = (Math.random() - 0.5) * 60 * glitchIntensity;

      ctx.save();
      ctx.globalAlpha = 1.0 - progress;
      ctx.translate(shiftX, 0);
      this.renderSingleSlide(slideA, imgA, progressTime, slideDur, 1.0);
      ctx.restore();

      // Step B: Draw Slide B with inverse shift
      ctx.save();
      ctx.globalAlpha = progress;
      ctx.translate(-shiftX, 0);
      this.renderSingleSlide(slideB, imgB, 0, slideB.duration || 3.5, 1.0);
      ctx.restore();

      // Scanline & RGB Color Flash Effect during mid-transition
      if (glitchIntensity > 0.3) {
        ctx.fillStyle = `rgba(56, 189, 248, ${0.25 * glitchIntensity})`;
        ctx.fillRect(0, Math.random() * h, w, Math.random() * 40 + 10);

        ctx.fillStyle = `rgba(249, 115, 22, ${0.25 * glitchIntensity})`;
        ctx.fillRect(0, Math.random() * h, w, Math.random() * 30 + 10);
      }
      ctx.restore();

    // --- EFEITO 2: CROSS-ZOOM (ZOOM CINEMÁTICO RÁPIDO) ---
    } else if (transType === 'cross-zoom') {
      ctx.save();
      const zoomA = 1.0 + (progress * 0.4);
      ctx.translate(w/2, h/2);
      ctx.scale(zoomA, zoomA);
      ctx.translate(-w/2, -h/2);
      this.renderSingleSlide(slideA, imgA, progressTime, slideDur, 1.0 - progress);
      ctx.restore();

      ctx.save();
      const zoomB = 1.4 - (progress * 0.4);
      ctx.translate(w/2, h/2);
      ctx.scale(zoomB, zoomB);
      ctx.translate(-w/2, -h/2);
      this.renderSingleSlide(slideB, imgB, 0, slideB.duration || 3.5, progress);
      ctx.restore();

    // --- EFEITO 3: CIRCLE REVEAL (REVELAÇÃO CIRCULAR SUAVE) ---
    } else if (transType === 'circle-reveal') {
      this.renderSingleSlide(slideA, imgA, progressTime, slideDur, 1.0);

      ctx.save();
      const maxRadius = Math.sqrt(w*w + h*h) / 2;
      const currentRadius = progress * maxRadius;

      ctx.beginPath();
      ctx.arc(w/2, h/2, Math.max(0, currentRadius), 0, Math.PI * 2);
      ctx.clip();

      this.renderSingleSlide(slideB, imgB, 0, slideB.duration || 3.5, 1.0);
      ctx.restore();

    // --- EFEITO 4: BLUR-GLITCH (DESFOQUE COM DESLOCAMENTO COLORIDO) ---
    } else if (transType === 'blur-glitch') {
      const alphaA = Math.max(0, 1.0 - (progress * 1.2));
      this.renderSingleSlide(slideA, imgA, progressTime, slideDur, alphaA);

      ctx.save();
      ctx.globalAlpha = Math.min(1, progress * 1.2);
      const glitchY = (Math.random() - 0.5) * 30 * Math.sin(progress * Math.PI);
      ctx.translate(0, glitchY);
      this.renderSingleSlide(slideB, imgB, 0, slideB.duration || 3.5, 1.0);
      ctx.restore();

    // --- EFEITO 5: SLIDE UP (DESLIZAR PARA CIMA) ---
    } else if (transType === 'slide-up') {
      this.renderSingleSlide(slideA, imgA, progressTime, slideDur, 1.0);

      ctx.save();
      ctx.translate(0, h * (1.0 - progress));
      this.renderSingleSlide(slideB, imgB, 0, slideB.duration || 3.5, 1.0);
      ctx.restore();

    // --- EFEITO 6: SLIDE LEFT ---
    } else if (transType === 'slide-left') {
      this.renderSingleSlide(slideA, imgA, progressTime, slideDur, 1.0);

      ctx.save();
      ctx.translate(w * (1.0 - progress), 0);
      this.renderSingleSlide(slideB, imgB, 0, slideB.duration || 3.5, 1.0);
      ctx.restore();

    // --- EFEITO 7: SLIDE RIGHT ---
    } else if (transType === 'slide-right') {
      this.renderSingleSlide(slideA, imgA, progressTime, slideDur, 1.0);

      ctx.save();
      ctx.translate(-w * (1.0 - progress), 0);
      this.renderSingleSlide(slideB, imgB, 0, slideB.duration || 3.5, 1.0);
      ctx.restore();

    // --- EFEITO 8: ZOOM IN CROSSFADE ---
    } else if (transType === 'zoom-in') {
      this.renderSingleSlide(slideA, imgA, progressTime, slideDur, 1.0 - progress);
      ctx.save();
      ctx.globalAlpha = progress;
      this.renderSingleSlide(slideB, imgB, 0, slideB.duration || 3.5, progress);
      ctx.restore();

    // --- DEFAULT FADE ---
    } else {
      this.renderSingleSlide(slideA, imgA, progressTime, slideDur, 1.0 - progress);
      this.renderSingleSlide(slideB, imgB, 0, slideB.duration || 3.5, progress);
    }
  },

  renderSlideOverlayText: function(idx, slide) {
    const textToShow = slide.caption || (idx < 4 ? this.titleText : '');
    if (!textToShow || this.textDisplay === 'disabled') return;
    if (this.textDisplay === 'first-slide' && idx > 0) return;

    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.save();
    ctx.font = "800 52px 'Plus Jakarta Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    let posY = h / 2;
    if (this.textPosition === 'top') posY = 180;
    if (this.textPosition === 'bottom') posY = h - 180;

    // Glowing Pill Background Box for Maximum Readability
    const textWidth = ctx.measureText(textToShow).width;
    const boxW = textWidth + 60;
    const boxH = 74;

    ctx.fillStyle = "rgba(7, 11, 20, 0.75)";
    ctx.beginPath();
    ctx.roundRect(w/2 - boxW/2, posY - boxH/2, boxW, boxH, 37);
    ctx.fill();

    ctx.strokeStyle = "rgba(56, 189, 248, 0.6)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(249, 115, 22, 0.9)";
    ctx.shadowBlur = 24;
    ctx.fillText(textToShow, w/2, posY);

    ctx.restore();
  }
};

window.SlideshowEngine = SlideshowEngine;
