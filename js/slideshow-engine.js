/* ==========================================================================
   BLUE-YELLOW STUDIO PRO - HIGH-PERFORMANCE SLIDESHOW CANVAS ENGINE
   Electric Royal Blue & Sunburst Gold Degradê Luxury Theme Edition
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
    const is4K = (this.resolution === '4K');
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
      oCtx.filter = 'blur(12px) brightness(0.65)';
      
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
    if (this.slides.length === 0 && !this.introEnabled && !this.outroEnabled) return;
    if (this.currentTime >= this.totalDuration) {
      this.currentTime = 0;
    }
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

  seek: function(timeSec) {
    this.currentTime = Math.max(0, Math.min(this.totalDuration, timeSec));
    this.requestRender();
    if (this.onTimeUpdate) {
      this.onTimeUpdate(this.currentTime, this.totalDuration);
    }
  },

  loop: function() {
    if (!this.isPlaying) return;

    const now = performance.now();
    const dt = (now - this.lastTimestamp) / 1000.0;
    this.lastTimestamp = now;

    this.currentTime += dt;

    if (this.currentTime >= this.totalDuration) {
      this.currentTime = this.totalDuration;
      this.renderFrame(this.currentTime);
      this.pause();
      if (this.onEnded) this.onEnded();
      return;
    }

    this.renderFrame(this.currentTime);
    if (this.onTimeUpdate) {
      this.onTimeUpdate(this.currentTime, this.totalDuration);
    }

    this.animFrameId = requestAnimationFrame(() => this.loop());
  },

  renderFrame: function(timeSec) {
    if (!this.ctx) return;

    // 1. Intro Screen Check
    const introTime = (this.introEnabled && (this.introTitle || this.introPresenter || this.introTag)) ? (this.introDuration || 3.5) : 0;
    if (timeSec < introTime) {
      this.renderCinematicIntro(timeSec, introTime);
      return;
    }

    // 2. Outro Screen Check
    const slidesTotalTime = this.slides.reduce((acc, s) => acc + (s.duration || 3.5), 0);
    const outroTime = (this.outroEnabled && (this.outroTitle || this.outroSubtitle)) ? (this.outroDuration || 3.5) : 0;
    const slidesEndTime = introTime + slidesTotalTime;

    if (timeSec >= slidesEndTime && outroTime > 0) {
      const timeInOutro = timeSec - slidesEndTime;
      this.renderCinematicOutro(timeInOutro, outroTime);
      return;
    }

    // 3. Photo Slides Rendering
    const slidesTime = timeSec - introTime;

    if (this.slides.length === 0) {
      this.renderEmptyState();
      return;
    }

    let accumulatedTime = 0;
    let currentSlideIdx = 0;
    let slideStartTime = 0;

    for (let i = 0; i < this.slides.length; i++) {
      const slideDur = this.slides[i].duration || 3.5;
      if (slidesTime >= accumulatedTime && slidesTime <= accumulatedTime + slideDur) {
        currentSlideIdx = i;
        slideStartTime = accumulatedTime;
        break;
      }
      accumulatedTime += slideDur;
      if (i === this.slides.length - 1) {
        currentSlideIdx = i;
        slideStartTime = accumulatedTime - slideDur;
      }
    }

    const currentSlide = this.slides[currentSlideIdx];
    const currentSlideDur = currentSlide.duration || 3.5;
    const timeInSlide = slidesTime - slideStartTime;

    const transDur = Math.min(this.transitionDuration, currentSlideDur * 0.5);
    const nextSlideIdx = (currentSlideIdx + 1) % this.slides.length;
    const isTransitioning = (timeInSlide >= currentSlideDur - transDur) && (currentSlideIdx < this.slides.length - 1);

    this.ctx.fillStyle = '#040e22';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const img1 = this.loadedImages.get(currentSlide.id);
    if (img1) {
      this.drawSingleSlide(img1, currentSlide.id, currentSlideIdx, timeInSlide / currentSlideDur, 1.0);
    }

    if (isTransitioning) {
      const nextSlide = this.slides[nextSlideIdx];
      const img2 = this.loadedImages.get(nextSlide.id);
      if (img2) {
        const transProgress = (timeInSlide - (currentSlideDur - transDur)) / transDur;
        
        let transType = currentSlide.transition;
        if (!transType || transType === 'default' || transType === 'random') {
          const transIndex = currentSlideIdx % this.transitionList.length;
          transType = this.transitionList[transIndex];
        }

        this.drawTransition(img1, img2, currentSlide.id, nextSlide.id, currentSlideIdx, nextSlideIdx, transProgress, transType);
      }
    }

    this.applyGlobalFilter();
    this.drawTextOverlay(currentSlide, currentSlideIdx, timeInSlide);

    // Render Watermark for Free Trial Mode
    if (window.LicenseSystem) {
      window.LicenseSystem.drawWatermarkIfNeeded(this.ctx, this.width, this.height);
    }
  },

  // Electric Blue & Sunburst Yellow Cinematic Intro Opening Screen
  renderCinematicIntro: function(currentTime, introTotalTime) {
    const progress = currentTime / introTotalTime;

    this.ctx.fillStyle = '#040e22';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const radGlow = this.ctx.createRadialGradient(this.width / 2, this.height / 2, 50, this.width / 2, this.height / 2, this.width * 0.5);
    radGlow.addColorStop(0, 'rgba(0, 200, 255, 0.35)');
    radGlow.addColorStop(0.5, 'rgba(255, 215, 0, 0.3)');
    radGlow.addColorStop(1, 'rgba(0,0,0,0)');
    this.ctx.fillStyle = radGlow;
    this.ctx.fillRect(0, 0, this.width, this.height);

    let alpha = 1.0;
    if (progress < 0.2) alpha = progress / 0.2;
    if (progress > 0.8) alpha = (1.0 - progress) / 0.2;

    this.ctx.save();
    this.ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    this.ctx.textAlign = 'center';

    // 1. Top Category Tag
    if (this.introTag) {
      const tagSize = Math.round(this.height * 0.022);
      this.ctx.font = `700 ${tagSize}px 'Plus Jakarta Sans', sans-serif`;
      this.ctx.fillStyle = '#ffd700';
      this.ctx.letterSpacing = '6px';
      this.ctx.shadowColor = '#ffd700';
      this.ctx.shadowBlur = 14;
      this.ctx.fillText(this.introTag.toUpperCase(), this.width / 2, this.height * 0.32);
    }

    // 2. Presenter Tag
    if (this.introPresenter) {
      const pSize = Math.round(this.height * 0.028);
      this.ctx.font = `700 ${pSize}px 'Plus Jakarta Sans', sans-serif`;
      this.ctx.fillStyle = '#00c8ff';
      this.ctx.letterSpacing = '8px';
      this.ctx.shadowColor = '#00c8ff';
      this.ctx.shadowBlur = 14;
      this.ctx.fillText(this.introPresenter.toUpperCase(), this.width / 2, this.height * 0.39);
    }

    // 3. Main Title
    if (this.introTitle) {
      const tSize = Math.round(this.height * 0.065);
      this.ctx.font = `800 ${tSize}px 'Outfit', sans-serif`;
      this.ctx.fillStyle = '#ffffff';
      this.ctx.shadowColor = '#ffd700';
      this.ctx.shadowBlur = 25;
      this.ctx.fillText(this.introTitle, this.width / 2, this.height * 0.51);
    }

    // Glowing Divider Line
    this.ctx.strokeStyle = '#00c8ff';
    this.ctx.lineWidth = Math.round(this.height * 0.003);
    this.ctx.shadowColor = '#00c8ff';
    this.ctx.shadowBlur = 15;
    this.ctx.beginPath();
    const lineWidth = this.width * 0.3 * Math.min(1, progress * 2);
    this.ctx.moveTo(this.width / 2 - lineWidth / 2, this.height * 0.57);
    this.ctx.lineTo(this.width / 2 + lineWidth / 2, this.height * 0.57);
    this.ctx.stroke();

    // 4. Subtitle Line
    if (this.introSubtitle) {
      const sSize = Math.round(this.height * 0.035);
      this.ctx.font = `600 ${sSize}px 'Plus Jakarta Sans', sans-serif`;
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      this.ctx.shadowColor = 'rgba(0,0,0,0.8)';
      this.ctx.shadowBlur = 8;
      this.ctx.fillText(this.introSubtitle, this.width / 2, this.height * 0.66);
    }

    this.ctx.restore();
  },

  // Electric Blue & Sunburst Yellow Cinematic Outro Ending Screen
  renderCinematicOutro: function(currentTime, outroTotalTime) {
    const progress = currentTime / outroTotalTime;

    this.ctx.fillStyle = '#040e22';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const radGlow = this.ctx.createRadialGradient(this.width / 2, this.height / 2, 50, this.width / 2, this.height / 2, this.width * 0.55);
    radGlow.addColorStop(0, 'rgba(255, 215, 0, 0.38)');
    radGlow.addColorStop(0.5, 'rgba(0, 200, 255, 0.25)');
    radGlow.addColorStop(1, 'rgba(0,0,0,0)');
    this.ctx.fillStyle = radGlow;
    this.ctx.fillRect(0, 0, this.width, this.height);

    let alpha = 1.0;
    if (progress < 0.2) alpha = progress / 0.2;
    if (progress > 0.8) alpha = (1.0 - progress) / 0.2;

    this.ctx.save();
    this.ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    this.ctx.textAlign = 'center';

    const iconChar = this.outroIcon || '♥';
    const iconSize = Math.round(this.height * 0.05);
    this.ctx.font = `700 ${iconSize}px 'FontAwesome', sans-serif`;
    this.ctx.fillStyle = '#ffd700';
    this.ctx.shadowColor = '#ffd700';
    this.ctx.shadowBlur = 20;
    this.ctx.fillText(iconChar, this.width / 2, this.height * 0.38);

    if (this.outroTitle) {
      const tSize = Math.round(this.height * 0.065);
      this.ctx.font = `800 ${tSize}px 'Outfit', sans-serif`;
      this.ctx.fillStyle = '#ffffff';
      this.ctx.shadowColor = '#00c8ff';
      this.ctx.shadowBlur = 25;
      this.ctx.fillText(this.outroTitle, this.width / 2, this.height * 0.5);
    }

    if (this.outroSubtitle) {
      const sSize = Math.round(this.height * 0.035);
      this.ctx.font = `600 ${sSize}px 'Plus Jakarta Sans', sans-serif`;
      this.ctx.fillStyle = '#ffd700';
      this.ctx.shadowColor = '#ffd700';
      this.ctx.shadowBlur = 12;
      this.ctx.fillText(this.outroSubtitle, this.width / 2, this.height * 0.62);
    }

    this.ctx.restore();
  },

  drawSingleSlide: function(img, slideId, slideIdx, progress, opacity) {
    if (!img) return;

    this.ctx.save();
    this.ctx.globalAlpha = opacity;

    let scale = 1.0;
    let offsetX = 0;
    let offsetY = 0;

    if (this.kenBurnsEnabled) {
      const dir = slideIdx % 4;
      if (dir === 0) scale = 1.0 + progress * 0.1;
      else if (dir === 1) scale = 1.1 - progress * 0.1;
      else if (dir === 2) { scale = 1.08; offsetX = (progress - 0.5) * 40; }
      else if (dir === 3) { scale = 1.08; offsetX = (0.5 - progress) * 40; }
    }

    if (this.imageFitMode === 'contain-blur') {
      const cachedBlur = this.blurCache.get(slideId);
      if (cachedBlur) {
        this.ctx.drawImage(cachedBlur, 0, 0, this.width, this.height);
      } else {
        this.drawImageCover(img, scale * 1.15, offsetX, offsetY);
      }

      this.drawImageContain(img, scale);
    } else if (this.imageFitMode === 'cover') {
      this.drawImageCover(img, scale, offsetX, offsetY);
    } else {
      this.drawImageContain(img, scale);
    }

    this.ctx.restore();
  },

  drawImageCover: function(img, scale, offsetX = 0, offsetY = 0) {
    const imgRatio = img.width / img.height;
    const canvasRatio = this.width / this.height;
    let drawW, drawH;

    if (imgRatio > canvasRatio) {
      drawH = this.height * scale;
      drawW = drawH * imgRatio;
    } else {
      drawW = this.width * scale;
      drawH = drawW / imgRatio;
    }

    const drawX = (this.width - drawW) / 2 + offsetX;
    const drawY = (this.height - drawH) / 2 + offsetY;

    this.ctx.drawImage(img, drawX, drawY, drawW, drawH);
  },

  drawImageContain: function(img, scale) {
    const imgRatio = img.width / img.height;
    const canvasRatio = this.width / this.height;
    let drawW, drawH;

    if (imgRatio > canvasRatio) {
      drawW = this.width * scale;
      drawH = drawW / imgRatio;
    } else {
      drawH = this.height * scale;
      drawW = drawH * imgRatio;
    }

    const drawX = (this.width - drawW) / 2;
    const drawY = (this.height - drawH) / 2;

    this.ctx.drawImage(img, drawX, drawY, drawW, drawH);
  },

  drawTransition: function(img1, img2, id1, id2, idx1, idx2, progress, type) {
    const p = Math.max(0, Math.min(1, progress));

    if (type === 'fade' || type === 'blur') {
      this.ctx.save();
      this.ctx.globalAlpha = p;
      this.drawSingleSlide(img2, id2, idx2, 0, 1.0);
      this.ctx.restore();
    } else if (type === 'slide-left') {
      this.ctx.save();
      this.ctx.translate(-p * this.width, 0);
      this.drawSingleSlide(img1, id1, idx1, 1.0, 1.0);
      this.ctx.translate(this.width, 0);
      this.drawSingleSlide(img2, id2, idx2, 0, 1.0);
      this.ctx.restore();
    } else if (type === 'slide-right') {
      this.ctx.save();
      this.ctx.translate(p * this.width, 0);
      this.drawSingleSlide(img1, id1, idx1, 1.0, 1.0);
      this.ctx.translate(-this.width, 0);
      this.drawSingleSlide(img2, id2, idx2, 0, 1.0);
      this.ctx.restore();
    } else if (type === 'slide-up') {
      this.ctx.save();
      this.ctx.translate(0, -p * this.height);
      this.drawSingleSlide(img1, id1, idx1, 1.0, 1.0);
      this.ctx.translate(0, this.height);
      this.drawSingleSlide(img2, id2, idx2, 0, 1.0);
      this.ctx.restore();
    } else if (type === 'zoom-in') {
      this.ctx.save();
      this.ctx.globalAlpha = p;
      const zoomScale = 0.8 + p * 0.2;
      this.ctx.translate(this.width / 2, this.height / 2);
      this.ctx.scale(zoomScale, zoomScale);
      this.ctx.translate(-this.width / 2, -this.height / 2);
      this.drawSingleSlide(img2, id2, idx2, 0, 1.0);
      this.ctx.restore();
    } else if (type === 'wipe-circle') {
      this.ctx.save();
      this.ctx.beginPath();
      const maxRadius = Math.hypot(this.width, this.height) / 2;
      this.ctx.arc(this.width / 2, this.height / 2, p * maxRadius, 0, Math.PI * 2);
      this.ctx.clip();
      this.drawSingleSlide(img2, id2, idx2, 0, 1.0);
      this.ctx.restore();
    } else {
      this.ctx.save();
      this.ctx.globalAlpha = p;
      this.drawSingleSlide(img2, id2, idx2, 0, 1.0);
      this.ctx.restore();
    }
  },

  applyGlobalFilter: function() {
    if (this.photoFilter === 'none') return;

    this.ctx.save();
    if (this.photoFilter === 'orange-blue') {
      const grad = this.ctx.createLinearGradient(0, 0, this.width, this.height);
      grad.addColorStop(0, 'rgba(0, 200, 255, 0.08)');
      grad.addColorStop(1, 'rgba(255, 215, 0, 0.08)');
      this.ctx.fillStyle = grad;
      this.ctx.globalCompositeOperation = 'screen';
      this.ctx.fillRect(0, 0, this.width, this.height);
    } else if (this.photoFilter === 'warm') {
      this.ctx.fillStyle = 'rgba(255, 215, 0, 0.1)';
      this.ctx.globalCompositeOperation = 'color-burn';
      this.ctx.fillRect(0, 0, this.width, this.height);
    } else if (this.photoFilter === 'cyber') {
      this.ctx.fillStyle = 'rgba(0, 200, 255, 0.12)';
      this.ctx.globalCompositeOperation = 'screen';
      this.ctx.fillRect(0, 0, this.width, this.height);
    }
    this.ctx.restore();
  },

  drawTextOverlay: function(slide, slideIdx, timeInSlide) {
    if (this.textDisplay === 'disabled') return;
    if (this.textDisplay === 'first-slide' && slideIdx !== 0) return;
    if (this.textDisplay === 'first-4-slides' && slideIdx >= 4) return;

    const slideCaption = slide.caption;
    const globalTitle = (this.textDisplay === 'all-slides' || (this.textDisplay === 'first-4-slides' && slideIdx < 4) || (this.textDisplay === 'first-slide' && slideIdx === 0)) ? this.titleText : '';
    const globalSub = (slideIdx === 0) ? this.subtitleText : '';

    const textToDraw = slideCaption || globalTitle;
    const subTextToDraw = slideCaption ? globalTitle : globalSub;

    if (!textToDraw && !subTextToDraw) return;

    this.ctx.save();
    this.ctx.textAlign = 'center';

    let posY = this.height / 2;
    if (this.textPosition === 'bottom') posY = this.height * 0.82;
    if (this.textPosition === 'top') posY = this.height * 0.2;

    if (this.textStyle === 'dark-box') {
      this.ctx.fillStyle = 'rgba(4, 14, 34, 0.88)';
      this.ctx.fillRect(this.width * 0.12, posY - 70, this.width * 0.76, 140);
      this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.55)';
      this.ctx.lineWidth = 3;
      this.ctx.strokeRect(this.width * 0.12, posY - 70, this.width * 0.76, 140);
    }

    if (textToDraw) {
      const fontSize = Math.round(this.height * 0.054);
      this.ctx.font = `800 ${fontSize}px 'Outfit', sans-serif`;

      if (this.textStyle === 'orange-glow') {
        this.ctx.shadowColor = '#ffd700';
        this.ctx.shadowBlur = 20;
        this.ctx.fillStyle = '#ffffff';
      } else if (this.textStyle === 'blue-glow') {
        this.ctx.shadowColor = '#00c8ff';
        this.ctx.shadowBlur = 20;
        this.ctx.fillStyle = '#ffd700';
      } else if (this.textStyle === 'cyan-bright') {
        this.ctx.shadowColor = '#0284c7';
        this.ctx.shadowBlur = 15;
        this.ctx.fillStyle = '#00c8ff';
      } else if (this.textStyle === 'gold-glow') {
        this.ctx.shadowColor = '#ffd700';
        this.ctx.shadowBlur = 15;
        this.ctx.fillStyle = '#fef08a';
      } else {
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        this.ctx.shadowBlur = 10;
        this.ctx.fillStyle = '#ffffff';
      }

      this.ctx.fillText(textToDraw, this.width / 2, posY);
    }

    if (subTextToDraw) {
      const subFontSize = Math.round(this.height * 0.032);
      this.ctx.font = `700 ${subFontSize}px 'Plus Jakarta Sans', sans-serif`;
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      this.ctx.shadowBlur = 8;
      this.ctx.fillStyle = 'rgba(0, 200, 255, 0.95)';
      this.ctx.fillText(subTextToDraw, this.width / 2, posY + Math.round(this.height * 0.058));
    }

    this.ctx.restore();
  },

  renderEmptyState: function() {
    this.ctx.fillStyle = '#040e22';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.save();
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = '#00c8ff';
    this.ctx.shadowColor = '#ffd700';
    this.ctx.shadowBlur = 25;
    this.ctx.font = '800 48px "Outfit", sans-serif';
    this.ctx.fillText('GN SLIDES PRO (4K)', this.width / 2, this.height / 2 - 30);

    this.ctx.fillStyle = '#ffd700';
    this.ctx.shadowBlur = 0;
    this.ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
    this.ctx.fillText('Adicione fotos, abertura, encerramento e música para exportar seu vídeo MP4', this.width / 2, this.height / 2 + 30);
    this.ctx.restore();
  }
};
