/* ==========================================================================
   GN SLIDES PRO 4K - DEMO ASSETS & THEMED TEMPLATE PRESETS GENERATOR
   Creates 3840x2160 4K scenic artwork, themed presets (Igreja, Casamento,
   Aniversário, Homenagem, Comercial) & high-fidelity audio tracks.
   ========================================================================== */

window.DemoAssets = {
  // Built-in Stock Templates List
  templates: {
    church: {
      name: 'Capela & Eventos de Igreja',
      introTag: 'MINISTÉRIO & FÉ',
      introPresenter: 'Apresenta',
      introTitle: 'CAPELA SANTA INÊS',
      introSubtitle: 'Um Filme Especial de Fotos e Oração',
      outroTitle: 'Deus Abençoe a Todos!',
      outroSubtitle: 'Guardado para Sempre no Coração',
      captions: ['Momentos Inesquecíveis', 'União & Fé', 'A Magia da Natureza', 'Paz & Gratidão']
    },
    wedding: {
      name: 'Casamento & Amor Inesquecível',
      introTag: 'NOSSO CASAMENTO',
      introPresenter: 'Com Amor',
      introTitle: 'GABRIEL & MARIANA',
      introSubtitle: 'Para Sempre Juntos',
      outroTitle: 'Obrigado por Fazer Parte!',
      outroSubtitle: 'Um Amor Para a Vida Inteira',
      captions: ['O Início da Nossa História', 'Promessa de Amor Eterno', 'Alegrados com Amigos', 'Para Sempre Nós']
    },
    birthday: {
      name: 'Aniversário & Celebração',
      introTag: 'FESTA ESPECIAL',
      introPresenter: 'Celebração de',
      introTitle: 'MEU ANIVERSÁRIO DE 15 ANOS',
      introSubtitle: 'Momentos Mágicos com Amigos e Família',
      outroTitle: 'Viva Esse Dia Especial!',
      outroSubtitle: 'Com Muita Alegria e Carinho',
      captions: ['Chegada Inesquecível', 'Com Minha Família', 'Amigos de Sempre', 'Doces Lembranças']
    },
    memorial: {
      name: 'Homenagem Póstuma & Saudades',
      introTag: 'HOMENAGEM ESPECIAL',
      introPresenter: 'Em Memória de',
      introTitle: 'LEMBRANÇAS ETERNAS',
      introSubtitle: 'Sua História Continuará Viva Entre Nós',
      outroTitle: 'Saudades Eternas',
      outroSubtitle: 'Guardado com Muito Amor no Coração',
      captions: ['Seu Sorriso Marcante', 'Momentos de Alegria', 'Legado de Amor', 'Para Sempre Lembrado']
    },
    business: {
      name: 'Comercial, Lojas & Imóveis',
      introTag: 'OFERTA EXCLUSIVA',
      introPresenter: 'Confira os',
      introTitle: 'LANÇAMENTOS DE IMÓVEIS 4K',
      introSubtitle: 'As Melhores Oportunidades do Mercado',
      outroTitle: 'Entre em Contato Conosco!',
      outroSubtitle: 'Atendimento via WhatsApp (00) 99999-9999',
      captions: ['Design Moderno & Luxo', 'Localização Privilegiada', 'Acabamento Premium', 'Garanta a Sua Unidade']
    }
  },

  getDemoSlides: function(presetKey = 'church') {
    const preset = this.templates[presetKey] || this.templates.church;
    return [
      {
        id: 'demo-slide-1',
        title: 'Pôr do Sol Dourado (4K)',
        caption: preset.captions[0] || 'Momentos Inesquecíveis',
        duration: 4.0,
        transition: 'fade',
        dataUrl: this.createScenicCanvas4K('orange-sunset')
      },
      {
        id: 'demo-slide-2',
        title: 'Oceano Azul Elétrico (4K)',
        caption: preset.captions[1] || 'Novas Aventuras & Viagens',
        duration: 4.0,
        transition: 'zoom-in',
        dataUrl: this.createScenicCanvas4K('cyan-ocean')
      },
      {
        id: 'demo-slide-3',
        title: 'Aurora Laranja & Azul (4K)',
        caption: preset.captions[2] || 'A Magia da Natureza',
        duration: 4.0,
        transition: 'slide-left',
        dataUrl: this.createScenicCanvas4K('orange-aurora')
      },
      {
        id: 'demo-slide-4',
        title: 'Cyber Horizonte (4K)',
        caption: preset.captions[3] || 'Guardado para Sempre no Coração',
        duration: 4.0,
        transition: 'wipe-circle',
        dataUrl: this.createScenicCanvas4K('cyber-city')
      }
    ];
  },

  createScenicCanvas4K: function(type) {
    const canvas = document.createElement('canvas');
    canvas.width = 3840;
    canvas.height = 2160;
    const ctx = canvas.getContext('2d');

    if (type === 'orange-sunset') {
      const skyGradient = ctx.createLinearGradient(0, 0, 0, 2160);
      skyGradient.addColorStop(0, '#060a17');
      skyGradient.addColorStop(0.3, '#0f172a');
      skyGradient.addColorStop(0.6, '#ea580c');
      skyGradient.addColorStop(0.85, '#f97316');
      skyGradient.addColorStop(1, '#ff6b00');
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, 3840, 2160);

      const sunGlow = ctx.createRadialGradient(1920, 1040, 20, 1920, 1040, 650);
      sunGlow.addColorStop(0, '#ffffff');
      sunGlow.addColorStop(0.2, '#fef08a');
      sunGlow.addColorStop(0.6, '#ff6b00');
      sunGlow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = sunGlow;
      ctx.fillRect(0, 0, 3840, 2160);

      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.moveTo(0, 1450);
      ctx.lineTo(800, 960);
      ctx.lineTo(1700, 1300);
      ctx.lineTo(2700, 840);
      ctx.lineTo(3840, 1400);
      ctx.lineTo(3840, 2160);
      ctx.lineTo(0, 2160);
      ctx.closePath();
      ctx.fill();

    } else if (type === 'cyan-ocean') {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 2160);
      skyGrad.addColorStop(0, '#0284c7');
      skyGrad.addColorStop(0.5, '#00e5ff');
      skyGrad.addColorStop(1, '#060a17');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, 3840, 2160);

      const seaGrad = ctx.createLinearGradient(0, 1200, 0, 2160);
      seaGrad.addColorStop(0, '#0369a1');
      seaGrad.addColorStop(0.5, '#0284c7');
      seaGrad.addColorStop(1, '#075985');
      ctx.fillStyle = seaGrad;
      ctx.fillRect(0, 1200, 3840, 960);

      ctx.strokeStyle = 'rgba(249, 115, 22, 0.65)';
      ctx.lineWidth = 6;
      for (let y = 1240; y < 2160; y += 60) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(960, y - 20, 1920, y + 20, 2880, y - 10);
        ctx.lineTo(3840, y);
        ctx.stroke();
      }

    } else if (type === 'orange-aurora') {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 2160);
      skyGrad.addColorStop(0, '#060a17');
      skyGrad.addColorStop(0.8, '#1e1b4b');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, 3840, 2160);

      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 120; i++) {
        const x = (Math.sin(i * 77) * 0.5 + 0.5) * 3840;
        const y = (Math.cos(i * 44) * 0.5 + 0.5) * 1100;
        ctx.beginPath();
        ctx.arc(x, y, Math.random() * 3 + 1, 0, Math.PI * 2);
        ctx.fill();
      }

      const auroraGrad = ctx.createLinearGradient(0, 200, 3840, 1000);
      auroraGrad.addColorStop(0, 'rgba(249, 115, 22, 0.85)');
      auroraGrad.addColorStop(0.5, 'rgba(0, 229, 255, 0.9)');
      auroraGrad.addColorStop(1, 'rgba(255, 107, 0, 0.65)');
      ctx.fillStyle = auroraGrad;
      ctx.beginPath();
      ctx.moveTo(0, 400);
      ctx.bezierCurveTo(960, 100, 1920, 700, 2880, 200);
      ctx.lineTo(3840, 600);
      ctx.lineTo(3840, 1300);
      ctx.bezierCurveTo(2880, 900, 1920, 1400, 960, 800);
      ctx.lineTo(0, 1200);
      ctx.closePath();
      ctx.fill();

    } else if (type === 'cyber-city') {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 2160);
      skyGrad.addColorStop(0, '#0f172a');
      skyGrad.addColorStop(0.5, '#431407');
      skyGrad.addColorStop(1, '#7c2d12');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, 3840, 2160);

      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(0, 1300); ctx.lineTo(3840, 1300);
      ctx.stroke();
    }

    return canvas.toDataURL('image/jpeg', 0.95);
  },

  getDemoAudioTrack: function(trackType = 'piano') {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 48000 });
    const durationSec = 16.0;
    const sampleRate = audioContext.sampleRate;
    const totalFrames = sampleRate * durationSec;
    
    const audioBuffer = audioContext.createBuffer(2, totalFrames, sampleRate);
    const leftChannel = audioBuffer.getChannelData(0);
    const rightChannel = audioBuffer.getChannelData(1);

    const notes = [261.63, 329.63, 392.00, 523.25, 440.00, 349.23, 392.00, 293.66];

    for (let i = 0; i < totalFrames; i++) {
      const t = i / sampleRate;
      const noteIndex = Math.floor(t * 1.5) % notes.length;
      const freq = notes[noteIndex];

      let val = Math.sin(2 * Math.PI * freq * t) * 0.25;
      val += Math.sin(2 * Math.PI * freq * 2.005 * t) * 0.1;

      const noteTime = (t * 1.5) % 1;
      const env = Math.exp(-noteTime * 3.5);
      const pad = Math.sin(2 * Math.PI * 130.81 * t) * 0.08;

      const sample = (val * env + pad) * 0.45;
      leftChannel[i] = sample;
      rightChannel[i] = sample;
    }

    const wavBlob = this.audioBufferToWavBlob(audioBuffer);
    return {
      name: 'Melodia_GNSlides_4K.mp3',
      duration: durationSec,
      blob: wavBlob,
      dataUrl: URL.createObjectURL(wavBlob)
    };
  },

  audioBufferToWavBlob: function(buffer) {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const out = new DataView(new ArrayBuffer(length));
    let channels = [], sample = 0, offset = 0, pos = 0;

    function setUint16(data) { out.setUint16(pos, data, true); pos += 2; }
    function setUint32(data) { out.setUint32(pos, data, true); pos += 4; }

    setUint32(0x46464952);
    setUint32(length - 8);
    setUint32(0x45564157);
    setUint32(0x20746d66);
    setUint32(16);
    setUint16(1);
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2);
    setUint16(16);
    setUint32(0x61746164);
    setUint32(length - pos - 4);

    for (let i = 0; i < buffer.numberOfChannels; i++) channels.push(buffer.getChannelData(i));

    while (offset < buffer.length) {
      for (let i = 0; i < numOfChan; i++) {
        sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
        out.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return new Blob([out], { type: 'audio/wav' });
  }
};
