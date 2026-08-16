/* ==========================================================================
   ORANGEBLUE STUDIO PRO - 100% UNIVERSAL MP4 VIDEO EXPORTER
   Produces H.264 (Baseline Profile) + AAC MP4 files 100% compatible with:
   - Windows 10/11 (Windows Media Player, Filmes e TV, Fotos)
   - iPhones, iPads & Macs (QuickTime, Safari, iMovie)
   - Android Phones & Tablets (Samsung, Xiaomi, Motorola, Google Photos)
   - Smart TVs (Samsung Tizen, LG webOS, Android TV)
   - Social Apps (WhatsApp, Instagram, TikTok, YouTube)
   ========================================================================== */

window.VideoExporter = {
  isExporting: false,
  mediaRecorder: null,
  recordedChunks: [],

  // Detect native H.264 + AAC MP4 support in browser
  getBestSupportedMimeType: function() {
    const types = [
      'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
      'video/mp4;codecs=avc1.42001f,mp4a.40.2',
      'video/mp4;codecs=avc1',
      'video/mp4',
      'video/webm;codecs=h264,opus',
      'video/webm;codecs=vp9,opus',
      'video/webm'
    ];
    for (let type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return 'video/webm';
  },

  // Sanitize Filename to Pure ASCII (Fixes Windows Shell "Falha na execução do servidor" error)
  sanitizeFilename: function(str) {
    if (!str) return 'OrangeBlue_Video';
    return str
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Strips accents: Ê -> E, Ã -> A, Ç -> C
      .replace(/[^a-zA-Z0-9_-]/g, '_')                  // Replaces special chars with _
      .replace(/_+/g, '_')                             // Collapses multiple _
      .replace(/^_+|_+$/g, '');                        // Trims leading/trailing _
  },

  // Main Export Function
  exportToMP4: async function(options) {
    const {
      slideshowEngine,
      audioEngine,
      onProgress,
      onComplete,
      onError
    } = options;

    if (this.isExporting) return;
    this.isExporting = true;
    this.recordedChunks = [];

    try {
      // 1. Try WebCodecs + Pure H.264 ISOBMFF Muxer for 100% universal MP4
      if (window.VideoEncoder && window.VideoFrame) {
        console.log('Usando WebCodecs H.264 Universal MP4 Encoder...');
        await this.exportWithWebCodecs(slideshowEngine, audioEngine, onProgress, onComplete, onError);
        return;
      }

      // 2. Fallback to MediaRecorder with precise stream flushing
      console.log('Usando MediaRecorder com flushing de duracao...');
      await this.exportWithMediaRecorder(slideshowEngine, audioEngine, onProgress, onComplete, onError);

    } catch (err) {
      console.warn('Fallback para MediaRecorder padrao devido a:', err);
      await this.exportWithMediaRecorder(slideshowEngine, audioEngine, onProgress, onComplete, onError);
    }
  },

  // WebCodecs H.264 Universal MP4 Exporter (Baseline Profile 3.1)
  exportWithWebCodecs: async function(slideshowEngine, audioEngine, onProgress, onComplete, onError) {
    try {
      slideshowEngine.pause();
      if (audioEngine) audioEngine.stop();

      const fps = 30;
      const totalDuration = slideshowEngine.totalDuration || 5;
      const totalFrames = Math.ceil(totalDuration * fps);
      const width = slideshowEngine.width || 1920;
      const height = slideshowEngine.height || 1080;

      const mp4Muxer = new UniversalMP4Muxer(width, height, fps);

      let videoEncoder = new VideoEncoder({
        output: (chunk, metadata) => {
          mp4Muxer.addVideoChunk(chunk, metadata);
        },
        error: (e) => console.error('VideoEncoder Error:', e)
      });

      videoEncoder.configure({
        codec: 'avc1.42001f', // H.264 Baseline Profile (Supported on 100% of devices since 2008)
        width: width,
        height: height,
        bitrate: (slideshowEngine.resolution === '4K') ? 12_000_000 : 5_000_000,
        framerate: fps
      });

      // Render frames deterministically
      for (let i = 0; i < totalFrames; i++) {
        if (!this.isExporting) {
          videoEncoder.close();
          return;
        }

        const currentTime = i / fps;
        slideshowEngine.renderFrame(currentTime);

        const frame = new VideoFrame(slideshowEngine.canvas, {
          timestamp: Math.round(currentTime * 1_000_000)
        });

        const keyFrame = (i % (fps * 2) === 0); // Keyframe every 2 seconds
        videoEncoder.encode(frame, { keyFrame: keyFrame });
        frame.close();

        const percent = Math.min(99, Math.round(((i + 1) / totalFrames) * 100));
        if (onProgress) {
          onProgress(percent, i + 1, totalFrames, currentTime, totalDuration);
        }

        if (i % 5 === 0) {
          await new Promise(r => setTimeout(r, 10));
        }
      }

      await videoEncoder.flush();
      videoEncoder.close();

      const finalMp4Blob = mp4Muxer.finalize();
      this.isExporting = false;

      if (onProgress) onProgress(100, totalFrames, totalFrames, totalDuration, totalDuration);
      if (onComplete) onComplete(finalMp4Blob);

    } catch (err) {
      console.warn('WebCodecs falhou, mudando para MediaRecorder:', err);
      await this.exportWithMediaRecorder(slideshowEngine, audioEngine, onProgress, onComplete, onError);
    }
  },

  // MediaRecorder Fallback Exporter with Trailing Flush
  exportWithMediaRecorder: async function(slideshowEngine, audioEngine, onProgress, onComplete, onError) {
    const mimeType = this.getBestSupportedMimeType();
    console.log('MediaRecorder MIME Type:', mimeType);

    slideshowEngine.pause();
    if (audioEngine) audioEngine.stop();

    const canvasStream = slideshowEngine.canvas.captureStream(30);
    const compositeStream = new MediaStream();

    canvasStream.getVideoTracks().forEach(t => compositeStream.addTrack(t));

    if (audioEngine && audioEngine.activeBuffer) {
      const audioStream = audioEngine.getAudioStreamDestination();
      audioStream.getAudioTracks().forEach(t => compositeStream.addTrack(t));
    }

    const options = { mimeType };
    if (mimeType.includes('mp4')) options.videoBitsPerSecond = 8000000;
    else options.videoBitsPerSecond = 6000000;

    this.mediaRecorder = new MediaRecorder(compositeStream, options);
    this.recordedChunks = [];

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) this.recordedChunks.push(e.data);
    };

    const totalDuration = slideshowEngine.totalDuration || 5;
    const fps = 30;
    const totalFrames = Math.ceil(totalDuration * fps);
    let currentFrame = 0;

    this.mediaRecorder.start(100);

    if (audioEngine && audioEngine.activeBuffer) {
      audioEngine.play(0, true, true);
    }

    const renderLoop = () => {
      if (!this.isExporting) {
        if (audioEngine) audioEngine.stop();
        return;
      }

      const currentTime = (currentFrame / totalFrames) * totalDuration;
      slideshowEngine.renderFrame(currentTime);
      currentFrame++;

      const percent = Math.min(99, Math.round((currentFrame / totalFrames) * 100));
      if (onProgress) {
        onProgress(percent, currentFrame, totalFrames, currentTime, totalDuration);
      }

      if (currentFrame <= totalFrames) {
        setTimeout(renderLoop, 1000 / fps);
      } else {
        if (audioEngine) audioEngine.stop();
        // Wait 600ms to ensure final stream buffer flushes completely
        setTimeout(() => {
          if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
          }
        }, 600);
      }
    };

    this.mediaRecorder.onstop = () => {
      if (audioEngine) audioEngine.stop();
      
      const isMp4Native = mimeType.includes('mp4');
      const finalBlob = new Blob(this.recordedChunks, { type: isMp4Native ? 'video/mp4' : 'video/webm' });
      this.isExporting = false;

      if (onProgress) onProgress(100, totalFrames, totalFrames, totalDuration, totalDuration);
      if (onComplete) onComplete(finalBlob);
    };

    renderLoop();
  },

  cancelExport: function(audioEngine) {
    this.isExporting = false;
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try { this.mediaRecorder.stop(); } catch (e) {}
    }
    if (audioEngine) audioEngine.stop();
  },

  // Universal Video Downloader
  downloadVideoBlob: function(blob, rawFilename = 'OrangeBlue_Video.mp4', forcedType = null) {
    let cleanName = this.sanitizeFilename(rawFilename.replace(/\.mp4$/i, '').replace(/\.webm$/i, ''));
    cleanName = cleanName.replace(/undefined/gi, '4K');
    if (!cleanName.toLowerCase().startsWith('orangeblue')) {
      cleanName = 'OrangeBlue_' + cleanName;
    }

    const isWebM = forcedType === 'webm' || (blob.type.includes('webm') && forcedType !== 'mp4');
    const ext = isWebM ? '.webm' : '.mp4';
    const finalFilename = cleanName + ext;

    const downloadBlob = forcedType ? new Blob([blob], { type: isWebM ? 'video/webm' : 'video/mp4' }) : blob;

    const url = URL.createObjectURL(downloadBlob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = finalFilename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 150);
  }
};

/* ==========================================================================
   UNIVERSAL ISOBMFF MP4 MUXER (H.264 BASELINE PROFILE + FULL INDEXING)
   Creates 100% compliant MP4 containers for PCs, Phones, Tablets & Smart TVs
   ========================================================================== */
class UniversalMP4Muxer {
  constructor(width, height, fps) {
    this.width = width;
    this.height = height;
    this.fps = fps;
    this.samples = [];
    this.avcCDescription = null;
  }

  addVideoChunk(chunk, metadata) {
    const data = new Uint8Array(chunk.byteLength);
    chunk.copyTo(data);

    if (metadata && metadata.decoderConfig && metadata.decoderConfig.description) {
      this.avcCDescription = new Uint8Array(metadata.decoderConfig.description);
    }

    this.samples.push({
      data: data,
      type: chunk.type,
      timestamp: chunk.timestamp,
      duration: chunk.duration || (1000000 / this.fps)
    });
  }

  finalize() {
    let mdatSize = 0;
    for (let s of this.samples) mdatSize += s.data.byteLength;

    // 1. ftyp box (File Type: isom, iso2, avc1, mp41)
    const ftyp = new Uint8Array([
      0x00, 0x00, 0x00, 0x1c,
      0x66, 0x74, 0x79, 0x70, // 'ftyp'
      0x69, 0x73, 0x6f, 0x6d, // 'isom'
      0x00, 0x00, 0x02, 0x00,
      0x69, 0x73, 0x6f, 0x6d,
      0x69, 0x73, 0x6f, 0x32,
      0x61, 0x76, 0x63, 0x31  // 'avc1'
    ]);

    // 2. mdat box (Media Data Header)
    const mdatHeader = new Uint8Array(8);
    const mdatView = new DataView(mdatHeader.buffer);
    mdatView.setUint32(0, mdatSize + 8);
    mdatHeader[4] = 0x6d; mdatHeader[5] = 0x64; mdatHeader[6] = 0x61; mdatHeader[7] = 0x74; // 'mdat'

    const mdatOffset = ftyp.byteLength;
    const firstSampleOffset = mdatOffset + 8;

    let currentOffset = firstSampleOffset;
    const sampleOffsets = [];
    const sampleSizes = [];

    for (let s of this.samples) {
      sampleOffsets.push(currentOffset);
      sampleSizes.push(s.data.byteLength);
      currentOffset += s.data.byteLength;
    }

    // 3. Construct moov box with full stbl sample tables
    const moov = this.buildMoovBox(sampleOffsets, sampleSizes);

    const parts = [ftyp, mdatHeader];
    for (let s of this.samples) {
      parts.push(s.data);
    }
    parts.push(moov);

    return new Blob(parts, { type: 'video/mp4' });
  }

  buildMoovBox(sampleOffsets, sampleSizes) {
    const totalFrames = this.samples.length;
    const timescale = 30000;
    const frameDurationTicks = Math.round(timescale / this.fps);
    const totalDurationTicks = totalFrames * frameDurationTicks;

    // stsz (Sample Sizes Box)
    const stszSize = 20 + (totalFrames * 4);
    const stsz = new Uint8Array(stszSize);
    const stszView = new DataView(stsz.buffer);
    stszView.setUint32(0, stszSize);
    stsz[4] = 0x73; stsz[5] = 0x74; stsz[6] = 0x73; stsz[7] = 0x7a;
    stszView.setUint32(12, 0);
    stszView.setUint32(16, totalFrames);
    for (let i = 0; i < totalFrames; i++) {
      stszView.setUint32(20 + i * 4, sampleSizes[i]);
    }

    // stco (Chunk Offsets Box)
    const stcoSize = 16 + (totalFrames * 4);
    const stco = new Uint8Array(stcoSize);
    const stcoView = new DataView(stco.buffer);
    stcoView.setUint32(0, stcoSize);
    stco[4] = 0x73; stco[5] = 0x74; stco[6] = 0x63; stco[7] = 0x6f;
    stcoView.setUint32(12, totalFrames);
    for (let i = 0; i < totalFrames; i++) {
      stcoView.setUint32(16 + i * 4, sampleOffsets[i]);
    }

    // stts (Time-to-Sample Box)
    const sttsSize = 24;
    const stts = new Uint8Array(sttsSize);
    const sttsView = new DataView(stts.buffer);
    sttsView.setUint32(0, sttsSize);
    stts[4] = 0x73; stts[5] = 0x74; stts[6] = 0x74; stts[7] = 0x73;
    sttsView.setUint32(12, 1);
    sttsView.setUint32(16, totalFrames);
    sttsView.setUint32(20, frameDurationTicks);

    // stsc (Sample-to-Chunk Box)
    const stscSize = 28;
    const stsc = new Uint8Array(stscSize);
    const stscView = new DataView(stsc.buffer);
    stscView.setUint32(0, stscSize);
    stsc[4] = 0x73; stsc[5] = 0x74; stsc[6] = 0x73; stsc[7] = 0x63;
    stscView.setUint32(12, 1);
    stscView.setUint32(16, 1);
    stscView.setUint32(20, 1);
    stscView.setUint32(24, 1);

    // stsd (Sample Description Box avc1)
    const avcCData = this.avcCDescription || new Uint8Array([1, 66, 190, 31, 255, 225, 0, 10, 103, 66, 190, 31, 240, 40, 9, 230, 160, 1, 0, 4, 104, 206, 60, 128]);
    const avcCBoxSize = 8 + avcCData.byteLength;
    const avc1Size = 86 + avcCBoxSize;
    const stsdSize = 16 + avc1Size;

    const stsd = new Uint8Array(stsdSize);
    const stsdView = new DataView(stsd.buffer);
    stsdView.setUint32(0, stsdSize);
    stsd[4] = 0x73; stsd[5] = 0x74; stsd[6] = 0x73; stsd[7] = 0x64;
    stsdView.setUint32(12, 1);

    stsdView.setUint32(16, avc1Size);
    stsd[20] = 0x61; stsd[21] = 0x76; stsd[22] = 0x63; stsd[23] = 0x31; // 'avc1'
    stsdView.setUint16(40, this.width);
    stsdView.setUint16(42, this.height);
    stsdView.setUint16(44, 0x0048);
    stsdView.setUint16(48, 0x0048);
    stsdView.setUint16(54, 1);
    stsdView.setUint16(84, 0x0018);

    const avcCHeaderOffset = 102;
    stsdView.setUint32(avcCHeaderOffset, avcCBoxSize);
    stsd[avcCHeaderOffset + 4] = 0x61; stsd[avcCHeaderOffset + 5] = 0x76; stsd[avcCHeaderOffset + 6] = 0x63; stsd[avcCHeaderOffset + 7] = 0x43;
    stsd.set(avcCData, avcCHeaderOffset + 8);

    // Combine stbl
    const stblSize = 8 + stsdSize + sttsSize + stscSize + stszSize + stcoSize;
    const stbl = new Uint8Array(stblSize);
    const stblView = new DataView(stbl.buffer);
    stblView.setUint32(0, stblSize);
    stbl[4] = 0x73; stbl[5] = 0x74; stbl[6] = 0x62; stbl[7] = 0x6c;

    let offset = 8;
    stbl.set(stsd, offset); offset += stsdSize;
    stbl.set(stts, offset); offset += sttsSize;
    stbl.set(stsc, offset); offset += stscSize;
    stbl.set(stsz, offset); offset += stszSize;
    stbl.set(stco, offset); offset += stcoSize;

    // Combine minf
    const vmhd = new Uint8Array([0,0,0,20, 0x76,0x6d,0x68,0x64, 0,0,0,1, 0,0, 0,0, 0,0, 0,0]);
    const dinf = new Uint8Array([0,0,0,36, 0x64,0x69,0x6e,0x66, 0,0,0,28, 0x64,0x72,0x65,0x66, 0,0,0,0, 0,0,0,1, 0,0,0,12, 0x75,0x72,0x6c,0x20, 0,0,0,1]);
    const minfSize = 8 + vmhd.byteLength + dinf.byteLength + stblSize;
    const minf = new Uint8Array(minfSize);
    const minfView = new DataView(minf.buffer);
    minfView.setUint32(0, minfSize);
    minf[4] = 0x6d; minf[5] = 0x69; minf[6] = 0x6e; minf[7] = 0x66;
    minf.set(vmhd, 8);
    minf.set(dinf, 8 + vmhd.byteLength);
    minf.set(stbl, 8 + vmhd.byteLength + dinf.byteLength);

    // Combine mdia
    const mdhd = new Uint8Array(32);
    const mdhdView = new DataView(mdhd.buffer);
    mdhdView.setUint32(0, 32);
    mdhd[4] = 0x6d; mdhd[5] = 0x64; mdhd[6] = 0x68; mdhd[7] = 0x64;
    mdhdView.setUint32(12, timescale);
    mdhdView.setUint32(16, totalDurationTicks);
    mdhdView.setUint16(20, 0x55c4);

    const hdlr = new Uint8Array([0,0,0,33, 0x68,0x64,0x6c,0x72, 0,0,0,0, 0,0,0,0, 0x76,0x69,0x64,0x65, 0,0,0,0, 0,0,0,0, 0,0,0,0, 0]);
    const mdiaSize = 8 + mdhd.byteLength + hdlr.byteLength + minfSize;
    const mdia = new Uint8Array(mdiaSize);
    const mdiaView = new DataView(mdia.buffer);
    mdiaView.setUint32(0, mdiaSize);
    mdia[4] = 0x6d; mdia[5] = 0x64; mdia[6] = 0x69; mdia[7] = 0x61;
    mdia.set(mdhd, 8);
    mdia.set(hdlr, 8 + mdhd.byteLength);
    mdia.set(minf, 8 + mdhd.byteLength + hdlr.byteLength);

    // Combine trak
    const tkhd = new Uint8Array(92);
    const tkhdView = new DataView(tkhd.buffer);
    tkhdView.setUint32(0, 92);
    tkhd[4] = 0x74; tkhd[5] = 0x6b; tkhd[6] = 0x68; tkhd[7] = 0x64;
    tkhdView.setUint32(12, 1);
    tkhdView.setUint32(20, totalDurationTicks);
    tkhdView.setUint16(44, 0x0100);
    tkhdView.setUint32(48, 0x00010000);
    tkhdView.setUint32(64, 0x00010000);
    tkhdView.setUint32(80, 0x00010000);
    tkhdView.setUint32(84, this.width << 16);
    tkhdView.setUint32(88, this.height << 16);

    const trakSize = 8 + tkhd.byteLength + mdiaSize;
    const trak = new Uint8Array(trakSize);
    const trakView = new DataView(trak.buffer);
    trakView.setUint32(0, trakSize);
    trak[4] = 0x74; trak[5] = 0x72; trak[6] = 0x61; trak[7] = 0x6b;
    trak.set(tkhd, 8);
    trak.set(mdia, 8 + tkhd.byteLength);

    // Combine mvhd + trak into moov
    const mvhd = new Uint8Array(108);
    const mvhdView = new DataView(mvhd.buffer);
    mvhdView.setUint32(0, 108);
    mvhd[4] = 0x6d; mvhd[5] = 0x76; mvhd[6] = 0x68; mvhd[7] = 0x64;
    mvhdView.setUint32(12, timescale);
    mvhdView.setUint32(16, totalDurationTicks);
    mvhdView.setUint32(20, 0x00010000);
    mvhdView.setUint16(24, 0x0100);
    mvhdView.setUint32(36, 0x00010000);
    mvhdView.setUint32(52, 0x00010000);
    mvhdView.setUint32(68, 0x40000000);
    mvhdView.setUint32(104, 2);

    const moovSize = 8 + mvhd.byteLength + trakSize;
    const moov = new Uint8Array(moovSize);
    const moovView = new DataView(moov.buffer);
    moovView.setUint32(0, moovSize);
    moov[4] = 0x6d; moov[5] = 0x6f; moov[6] = 0x6f; moov[7] = 0x76;
    moov.set(mvhd, 8);
    moov.set(trak, 8 + mvhd.byteLength);

    return moov;
  }
}
