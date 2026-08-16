/* ==========================================================================
   GN SLIDES PRO 4K - HIGH-PERFORMANCE CANVAS SLIDESHOW ENGINE
   Optimized for Desktop, Mobile & Tablet Browsers (Zero Memory Crash)
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
  imageFitMode: 'contain-blur',
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

  transitionList: ['fade', 'slide-left', 'slide-right', 'slide-up', 'zoom-in', 'wipe-circle', 'blur'],

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
    // On mobile devices, force 1080p preview canvas to prevent Mobile Chrome RAM crashes ("Ah, não!")
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
      offscreen.width = 360;
      offscreen.height = 202;
      const oCtx = offscreen.getContext('2d');
      oCtx.filter = 'blur(10px) brightness(0.65)';
      
      const imgRatio = img.width / img.height;
      const oRatio = 360 / 202;
      let drawW, drawH;

      if (imgRatio > oRatio) {
        drawH = 202; drawW = drawH * imgRatio;
      } else {
        drawW = 360; drawH = drawW / imgRatio;
      }
      const drawX = (360 - drawW) / 2;
      const drawY = (202 - drawH) / 2;

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

    // Clear background with dark luxury ocean blue
    this.ctx.fillStyle = '#090f1e';
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

    // 3. PHOTO SLIDES RENDER WITH AUTOMATIC VARIED CINEMATIC TRANSITIONS
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
    grad.addColorStop(0, '#0c1a36');
    grad.addColorStop(1, '#020617');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(2, 132, 199, 0.4)';
    ctx.lineWidth = 4;
    ctx.strokeRect(60, 60, w - 120, h - 120);

    const tag = (this.introTag || 'EDIÇÃO ESPECIAL').toUpperCase();
    ctx.font = "600 32px 'Plus Jakarta Sans', sans-serif";
    ctx.fillStyle = "#0284c7";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(tag, w/2, h/2 - 120);

    ctx.font = "400 28px 'Outfit', sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText(this.introPresenter || 'Apresenta', w/2, h/2 - 60);

    const title = this.introTitle || 'CAPELA SANTA INÊS';
    ctx.font = "800 72px 'Plus Jakarta Sans', sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(249, 115, 22, 0.8)";
    ctx.shadowBlur = 30;
    ctx.fillText(title, w/2, h/2 + 20);

    ctx.shadowBlur = 0;
    ctx.font = "500 34px 'Outfit', sans-serif";
    ctx.fillStyle = "#e2e8f0";
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
    grad.addColorStop(0, '#020617');
    grad.addColorStop(0.5, '#07162c');
    grad.addColorStop(1, '#020617');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const icon = this.outroIcon || '♥';
    ctx.font = "84px 'Outfit', sans-serif";
    ctx.fillStyle = "#f97316";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(249, 115, 22, 0.9)";
    ctx.shadowBlur = 40;
    ctx.fillText(icon, w/2, h/2 - 100);

    ctx.shadowBlur = 0;
    ctx.font = "800 68px 'Plus Jakarta Sans', sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(this.outroTitle || 'Obrigado por Assistir!', w/2, h/2 + 20);

    ctx.font = "500 32px 'Outfit', sans-serif";
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText(this.outroSubtitle || 'Guardado para Sempre no Coração', w/2, h/2 + 100);

    ctx.restore();
  },

  renderEmptyStateScreen: function() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    ctx.font = "600 36px 'Plus Jakarta Sans', sans-serif";
    ctx.fillStyle = "#0284c7";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("GN SLIDES PRO 4K", w/2, h/2 - 30);

    ctx.font = "400 24px 'Outfit', sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText("Adicione fotos no menu à esquerda para visualizar o vídeo aqui.", w/2, h/2 + 30);
  },

  renderSingleSlide: function(slide, img, progressTime, totalSlideDur, alpha = 1.0) {
    if (!img) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.save();
    ctx.globalAlpha = alpha;

    // 1. Draw Blurred Background if contain-blur mode
    if (this.imageFitMode === 'contain-blur') {
      const blurImg = this.blurCache.get(slide.id);
      if (blurImg) {
        ctx.drawImage(blurImg, 0, 0, w, h);
      } else {
        ctx.fillStyle = '#090f1e';
        ctx.fillRect(0, 0, w, h);
      }
    } else if (this.imageFitMode === 'contain-black') {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);
    }

    // 2. Compute Fit & Ken Burns Movement
    let scale = 1.0;
    let dx = 0, dy = 0;

    if (this.kenBurnsEnabled) {
      const progress = progressTime / totalSlideDur;
      scale = 1.0 + (progress * 0.08); // Suave 8% zoom
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
      // contain mode
      if (imgRatio > screenRatio) {
        drawW = w * scale; drawH = drawW / imgRatio;
      } else {
        drawH = h * scale; drawW = drawH * imgRatio;
      }
    }

    drawX = (w - drawW) / 2;
    drawY = (h - drawH) / 2;

    ctx.drawImage(img, drawX, drawY, drawW, drawH);

    // Apply Filter if selected
    if (this.photoFilter === 'orange-blue') {
      ctx.fillStyle = 'rgba(2, 132, 199, 0.05)';
      ctx.fillRect(0, 0, w, h);
    }

    ctx.restore();
  },

  renderTransition: function(slideA, slideB, progress, transType, progressTime, slideDur) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    const imgA = this.loadedImages.get(slideA.id);
    const imgB = this.loadedImages.get(slideB.id);

    if (transType === 'fade') {
      this.renderSingleSlide(slideA, imgA, progressTime, slideDur, 1.0 - progress);
      this.renderSingleSlide(slideB, imgB, 0, slideB.duration || 3.5, progress);
    } else if (transType === 'slide-left') {
      ctx.save();
      this.renderSingleSlide(slideA, imgA, progressTime, slideDur, 1.0);
      ctx.restore();

      ctx.save();
      ctx.translate(w * (1.0 - progress), 0);
      this.renderSingleSlide(slideB, imgB, 0, slideB.duration || 3.5, 1.0);
      ctx.restore();
    } else if (transType === 'slide-right') {
      ctx.save();
      this.renderSingleSlide(slideA, imgA, progressTime, slideDur, 1.0);
      ctx.restore();

      ctx.save();
      ctx.translate(-w * (1.0 - progress), 0);
      this.renderSingleSlide(slideB, imgB, 0, slideB.duration || 3.5, 1.0);
      ctx.restore();
    } else if (transType === 'zoom-in') {
      this.renderSingleSlide(slideA, imgA, progressTime, slideDur, 1.0 - progress);
      ctx.save();
      ctx.globalAlpha = progress;
      this.renderSingleSlide(slideB, imgB, 0, slideB.duration || 3.5, progress);
      ctx.restore();
    } else {
      // Default Smooth Crossfade
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
    ctx.font = "800 48px 'Plus Jakarta Sans', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    let posY = h / 2;
    if (this.textPosition === 'top') posY = 180;
    if (this.textPosition === 'bottom') posY = h - 180;

    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(249, 115, 22, 0.9)";
    ctx.shadowBlur = 24;
    ctx.fillText(textToShow, w/2, posY);

    ctx.restore();
  }
};

window.SlideshowEngine = SlideshowEngine;
