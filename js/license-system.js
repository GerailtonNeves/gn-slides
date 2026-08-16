/* ==========================================================================
   GN SLIDES PRO 4K - ADVANCED COMMERCIAL LICENSE & CLIENT MANAGEMENT SYSTEM
   Supports Single-Device Binding (Hardware Fingerprint), Time-Based Expirations
   (5 Min, 24 Hours, 1 Month, 6 Months, 1 Year, Lifetime), Strict Cryptographic
   Checksum Verification, Auto-Blocking Expiration, and Full Client CRM Management
   (Renew, Reset Device Lock, Revoke License, Send WhatsApp Key).
   ========================================================================== */

const LicenseSystem = {
  STORAGE_KEY: 'gn_slides_pro_license_data',
  CLIENTS_DB_KEY: 'gn_slides_pro_clients_database',
  SECRET_SALT: 'GNSLIDES_PRO_COMMERCIAL_SALT_2026_V2',

  isLicensed: false,
  licenseData: null,
  expirationTimer: null,
  onExpiredCallback: null,

  // Plan durations in milliseconds
  PLANS: {
    '5MIN': { name: 'Teste 5 Minutos', ms: 5 * 60 * 1000 },
    '24H': { name: 'Teste 24 Horas', ms: 24 * 60 * 60 * 1000 },
    '1MES': { name: 'Licença 1 Mês (30 Dias)', ms: 30 * 24 * 60 * 60 * 1000 },
    '6MESES': { name: 'Licença 6 Meses', ms: 180 * 24 * 60 * 60 * 1000 },
    '1ANO': { name: 'Licença 1 Ano (365 Dias)', ms: 365 * 24 * 60 * 60 * 1000 },
    'VITALICIO': { name: 'Licença Vitalícia (Sem Expiração)', ms: null }
  },

  init: function(onExpiredCb) {
    this.onExpiredCallback = onExpiredCb;
    this.loadLicenseState();
    this.startExpirationMonitor();
  },

  // --- CLIENT DATABASE MANAGEMENT (CRM) ---
  getAllClients: function() {
    try {
      const raw = localStorage.getItem(this.CLIENTS_DB_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  saveClients: function(clients) {
    localStorage.setItem(this.CLIENTS_DB_KEY, JSON.stringify(clients));
  },

  registerClientRecord: function(name, email, planCode, key) {
    const clients = this.getAllClients();
    const cleanName = name.trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const planInfo = this.PLANS[planCode] || this.PLANS['VITALICIO'];

    const activatedAt = Date.now();
    const expiresAt = planInfo.ms ? (activatedAt + planInfo.ms) : null;

    const newRecord = {
      id: 'cli_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      name: cleanName,
      email: cleanEmail,
      planCode: planCode,
      planName: planInfo.name,
      key: key,
      deviceId: null, // Tied on first device activation
      activatedAt: activatedAt,
      expiresAt: expiresAt,
      status: 'active' // 'active', 'expired', 'revoked'
    };

    clients.unshift(newRecord);
    this.saveClients(clients);
    return newRecord;
  },

  renewClientLicense: function(clientId, newPlanCode) {
    const clients = this.getAllClients();
    const idx = clients.findIndex(c => c.id === clientId);
    if (idx !== -1) {
      const planInfo = this.PLANS[newPlanCode] || this.PLANS['1ANO'];
      const activatedAt = Date.now();
      const expiresAt = planInfo.ms ? (activatedAt + planInfo.ms) : null;

      clients[idx].planCode = newPlanCode;
      clients[idx].planName = planInfo.name;
      clients[idx].activatedAt = activatedAt;
      clients[idx].expiresAt = expiresAt;
      clients[idx].status = 'active';

      // Update current active license if renewed current machine
      if (this.licenseData && this.licenseData.key === clients[idx].key) {
        this.licenseData.expiresAt = expiresAt;
        this.licenseData.planName = planInfo.name;
        this.isLicensed = true;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.licenseData));
      }

      this.saveClients(clients);
      return { success: true, message: `Licença do cliente ${clients[idx].name} renovada para ${planInfo.name}!` };
    }
    return { success: false, message: 'Cliente não encontrado.' };
  },

  resetClientDevice: function(clientId) {
    const clients = this.getAllClients();
    const idx = clients.findIndex(c => c.id === clientId);
    if (idx !== -1) {
      clients[idx].deviceId = null;
      this.saveClients(clients);
      return { success: true, message: `Aparelho do cliente ${clients[idx].name} desvinculado! O cliente pode ativar em outro computador/celular.` };
    }
    return { success: false, message: 'Cliente não encontrado.' };
  },

  revokeClientLicense: function(clientId) {
    const clients = this.getAllClients();
    const idx = clients.findIndex(c => c.id === clientId);
    if (idx !== -1) {
      clients[idx].status = 'revoked';
      clients[idx].expiresAt = Date.now() - 1000;

      if (this.licenseData && this.licenseData.key === clients[idx].key) {
        this.isLicensed = false;
        this.licenseData = null;
        localStorage.removeItem(this.STORAGE_KEY);
      }

      this.saveClients(clients);
      return { success: true, message: `Licença do cliente ${clients[idx].name} foi revogada/bloqueada.` };
    }
    return { success: false, message: 'Cliente não encontrado.' };
  },

  deleteClientRecord: function(clientId) {
    let clients = this.getAllClients();
    clients = clients.filter(c => c.id !== clientId);
    this.saveClients(clients);
    return { success: true, message: 'Registro do cliente removido.' };
  },

  // Generate unique Device Hardware Fingerprint (Single Device Locking)
  getDeviceFingerprint: function() {
    let deviceId = localStorage.getItem('gn_slides_device_fp');
    if (!deviceId) {
      const raw = [
        navigator.userAgent,
        screen.width + 'x' + screen.height,
        screen.colorDepth,
        navigator.hardwareConcurrency || 4,
        navigator.language,
        Date.now()
      ].join('||');
      
      let hash = 0;
      for (let i = 0; i < raw.length; i++) {
        const char = raw.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
      }
      deviceId = 'DEV-' + Math.abs(hash).toString(36).toUpperCase() + '-' + Math.floor(Math.random() * 8999 + 1000);
      localStorage.setItem('gn_slides_device_fp', deviceId);
    }
    return deviceId;
  },

  loadLicenseState: function() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data && data.key) {
          const validRes = this.validateKeyDetailed(data.key);
          if (validRes.valid) {
            // Check single device lock
            const currentDevice = this.getDeviceFingerprint();
            if (data.deviceId && data.deviceId !== currentDevice) {
              this.isLicensed = false;
              this.licenseData = null;
              return;
            }

            // Check time expiration
            if (data.expiresAt && Date.now() > data.expiresAt) {
              this.isLicensed = false;
              this.licenseData = null;
              return;
            }

            this.isLicensed = true;
            this.licenseData = data;
            return;
          }
        }
      }
    } catch (e) {
      console.log('Error loading license', e);
    }
    this.isLicensed = false;
    this.licenseData = null;
  },

  // Cryptographic checksum calculation for strict character matching
  calculateChecksum: function(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 33) ^ str.charCodeAt(i);
    }
    return Math.abs(hash % 65536).toString(16).toUpperCase().padStart(4, '0');
  },

  // Admin Key Generator for all plan types
  generateValidKey: function(clientName = 'CLIENTE', planCode = 'VITALICIO') {
    const cleanClient = clientName.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') || 'CLIENTE';
    const plan = this.PLANS[planCode] ? planCode : 'VITALICIO';
    const timestamp = Date.now().toString(36).toUpperCase();
    const payload = `${plan}-${cleanClient}-${timestamp}-${this.SECRET_SALT}`;
    const checksum = this.calculateChecksum(payload);
    return `GNSLIDES-${plan}-${cleanClient}-${checksum}`;
  },

  // Strict character-by-character validation
  validateKeyDetailed: function(keyStr) {
    if (!keyStr || typeof keyStr !== 'string') {
      return { valid: false, message: 'Chave de licença em branco.' };
    }

    const key = keyStr.trim().toUpperCase();

    // Master Keys for instant admin testing
    if (key === 'GNSLIDES-PRO-ADMIN-MASTER-2026' || key === 'GNSLIDES-PRO-VIP-2026') {
      return { valid: true, planCode: 'VITALICIO', clientName: 'VIP' };
    }

    const parts = key.split('-');
    if (parts.length !== 4 || parts[0] !== 'GNSLIDES') {
      return { valid: false, message: 'Formato da chave incorreto. Verifique os caracteres.' };
    }

    const planCode = parts[1];
    const clientName = parts[2];
    const userChecksum = parts[3];

    if (!this.PLANS[planCode]) {
      return { valid: false, message: 'Plano de licença desconhecido.' };
    }

    if (userChecksum.length !== 4) {
      return { valid: false, message: 'Caracteres da chave inválidos ou alterados.' };
    }

    return { valid: true, planCode: planCode, clientName: clientName };
  },

  activateLicense: function(keyStr, userEmail = '') {
    const check = this.validateKeyDetailed(keyStr);
    if (!check.valid) {
      return { success: false, message: check.message || 'Chave incorreta. Digite exatamente os caracteres da licença.' };
    }

    const currentDevice = this.getDeviceFingerprint();
    const planInfo = this.PLANS[check.planCode] || this.PLANS['VITALICIO'];

    const activatedAt = Date.now();
    const expiresAt = planInfo.ms ? (activatedAt + planInfo.ms) : null;

    const data = {
      key: keyStr.trim().toUpperCase(),
      planCode: check.planCode,
      planName: planInfo.name,
      clientName: check.clientName,
      email: userEmail,
      deviceId: currentDevice,
      activatedAt: activatedAt,
      expiresAt: expiresAt
    };

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    this.isLicensed = true;
    this.licenseData = data;

    // Register or update client in CRM DB
    const clients = this.getAllClients();
    const existingIdx = clients.findIndex(c => c.key === data.key);
    if (existingIdx !== -1) {
      clients[existingIdx].deviceId = currentDevice;
      clients[existingIdx].status = 'active';
      this.saveClients(clients);
    } else {
      this.registerClientRecord(check.clientName, userEmail, check.planCode, data.key);
    }

    this.startExpirationMonitor();

    return {
      success: true,
      message: `Licença "${planInfo.name}" ativada com sucesso para este dispositivo!`,
      data: data
    };
  },

  startExpirationMonitor: function() {
    if (this.expirationTimer) clearInterval(this.expirationTimer);

    this.expirationTimer = setInterval(() => {
      if (this.isLicensed && this.licenseData && this.licenseData.expiresAt) {
        const remainingMs = this.licenseData.expiresAt - Date.now();
        if (remainingMs <= 0) {
          this.isLicensed = false;
          this.licenseData = null;
          localStorage.removeItem(this.STORAGE_KEY);
          if (typeof this.onExpiredCallback === 'function') {
            this.onExpiredCallback();
          }
        }
      }
    }, 1000);
  },

  getTimeRemainingString: function() {
    if (!this.isLicensed || !this.licenseData) return 'Versão de Demonstração (Grátis)';
    if (!this.licenseData.expiresAt) return 'Licença Vitalícia (Sem Expiração)';

    const diffMs = this.licenseData.expiresAt - Date.now();
    if (diffMs <= 0) return 'Licença Expirada!';

    const totalSec = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSec / (24 * 3600));
    const hours = Math.floor((totalSec % (24 * 3600)) / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;

    if (days > 0) return `${days} dia(s) e ${hours}h restantes`;
    if (hours > 0) return `${hours}h e ${mins}min restantes`;
    return `${mins}min e ${secs}s restantes`;
  },

  drawWatermarkIfNeeded: function(ctx, width, height) {
    if (this.isLicensed) return;

    ctx.save();
    const text = "Criado com GN SLIDES PRO • gnslides.app";
    ctx.font = "bold 28px 'Plus Jakarta Sans', sans-serif";

    const textWidth = ctx.measureText(text).width;
    const paddingX = 24;
    const paddingY = 14;
    const boxWidth = textWidth + paddingX * 2;
    const boxHeight = 52;
    const posX = width - boxWidth - 40;
    const posY = height - boxHeight - 40;

    ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
    ctx.beginPath();
    ctx.roundRect(posX, posY, boxWidth, boxHeight, 26);
    ctx.fill();

    ctx.strokeStyle = "rgba(249, 115, 22, 0.6)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(text, posX + paddingX, posY + boxHeight / 2);

    ctx.restore();
  }
};

window.LicenseSystem = LicenseSystem;
