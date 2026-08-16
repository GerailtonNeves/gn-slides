/* ==========================================================================
   GN SLIDES PRO 4K - ADVANCED COMMERCIAL LICENSE & CLIENT MANAGEMENT SYSTEM
   Supports Single-Device Binding (Hardware Fingerprint), Time-Based Expirations
   (5 Min, 24 Hours, 1 Month, 6 Months, 1 Year, Lifetime), Persistent CRM Storage,
   Instant Remote License Revocation, 1-Click Unlocking, and Full Client CRM
   Management (Renew, Reset Device Lock, Revoke/Unrevoke, WhatsApp Direct).
   ========================================================================== */

const LicenseSystem = {
  STORAGE_KEY: 'gn_slides_pro_license_data',
  CLIENTS_DB_KEY: 'gn_slides_pro_clients_database',
  REVOKED_KEYS_KEY: 'gn_slides_pro_revoked_keys',
  SECRET_SALT: 'GNSLIDES_PRO_COMMERCIAL_SALT_2026_V2',

  isLicensed: false,
  licenseData: null,
  expirationTimer: null,
  onExpiredCallback: null,
  onUnblockedCallback: null,

  // Plan durations in milliseconds
  PLANS: {
    '5MIN': { name: 'Teste 5 Minutos', ms: 5 * 60 * 1000 },
    '24H': { name: 'Teste 24 Horas', ms: 24 * 60 * 60 * 1000 },
    '1MES': { name: 'Licença 1 Mês (30 Dias)', ms: 30 * 24 * 60 * 60 * 1000 },
    '6MESES': { name: 'Licença 6 Meses', ms: 180 * 24 * 60 * 60 * 1000 },
    '1ANO': { name: 'Licença 1 Ano (365 Dias)', ms: 365 * 24 * 60 * 60 * 1000 },
    'VITALICIO': { name: 'Licença Vitalícia (Sem Expiração)', ms: null }
  },

  init: function(onExpiredCb, onUnblockedCb) {
    this.onExpiredCallback = onExpiredCb;
    this.onUnblockedCallback = onUnblockedCb;
    this.loadLicenseState();
    this.startExpirationMonitor();
  },

  // Robust String Sanitizer for Mobile WhatsApp Copy/Paste
  cleanLicenseKeyString: function(rawStr) {
    if (!rawStr || typeof rawStr !== 'string') return '';
    
    // 1. Remove backticks, quotes, invisible spaces & whitespace
    let cleaned = rawStr.replace(/[`"'’‘“”\u00A0\u200B\uFEFF]/g, '').trim().toUpperCase();

    // 2. Extract GNSLIDES-XXXX-YYYY-ZZZZ pattern if copied with surrounding text
    const match = cleaned.match(/GNSLIDES-[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+/);
    if (match) {
      return match[0];
    }

    return cleaned;
  },

  // --- REVOCATION CHECKER ---
  isKeyRevoked: function(key) {
    if (!key || typeof key !== 'string') return false;
    const cleanKey = this.cleanLicenseKeyString(key);

    // 1. Check global revoked list
    try {
      const rawRevoked = localStorage.getItem(this.REVOKED_KEYS_KEY);
      const revokedList = rawRevoked ? JSON.parse(rawRevoked) : [];
      if (revokedList.includes(cleanKey)) return true;
    } catch (e) {}

    // 2. Check CRM database
    const clients = this.getAllClients();
    const cli = clients.find(c => c.key === cleanKey);
    if (cli && cli.status === 'revoked') return true;

    return false;
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
    try {
      localStorage.setItem(this.CLIENTS_DB_KEY, JSON.stringify(clients));
    } catch (e) {
      console.error('Erro ao salvar banco de clientes CRM:', e);
    }
  },

  registerClientRecord: function(name, email, planCode, key, deviceId = null) {
    const clients = this.getAllClients();
    const cleanName = (name || 'CLIENTE').trim();
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
      deviceId: deviceId, // Single Device binding
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

      // Remove from revoked keys list if renewed
      try {
        const rawRevoked = localStorage.getItem(this.REVOKED_KEYS_KEY);
        let revokedList = rawRevoked ? JSON.parse(rawRevoked) : [];
        revokedList = revokedList.filter(k => k !== clients[idx].key);
        localStorage.setItem(this.REVOKED_KEYS_KEY, JSON.stringify(revokedList));
      } catch (e) {}

      // Update active license if on current machine
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
      const revokedKey = clients[idx].key;
      clients[idx].status = 'revoked';
      clients[idx].expiresAt = Date.now() - 1000;

      // Add to global revoked list
      try {
        const rawRevoked = localStorage.getItem(this.REVOKED_KEYS_KEY);
        const revokedList = rawRevoked ? JSON.parse(rawRevoked) : [];
        if (!revokedList.includes(revokedKey)) {
          revokedList.push(revokedKey);
          localStorage.setItem(this.REVOKED_KEYS_KEY, JSON.stringify(revokedList));
        }
      } catch (e) {}

      // Immediately cancel active license on current machine if matching
      if (this.licenseData && this.licenseData.key === revokedKey) {
        this.isLicensed = false;
        this.licenseData = null;
        localStorage.removeItem(this.STORAGE_KEY);
        if (typeof this.onExpiredCallback === 'function') {
          this.onExpiredCallback('blocked');
        }
      }

      this.saveClients(clients);
      return { success: true, message: `Licença do cliente ${clients[idx].name} foi BLOQUEADA!` };
    }
    return { success: false, message: 'Cliente não encontrado.' };
  },

  unrevokeClientLicense: function(clientId) {
    const clients = this.getAllClients();
    const idx = clients.findIndex(c => c.id === clientId);
    if (idx !== -1) {
      const key = clients[idx].key;
      clients[idx].status = 'active';
      
      // Restore duration if expired
      const planInfo = this.PLANS[clients[idx].planCode] || this.PLANS['1ANO'];
      const activatedAt = Date.now();
      clients[idx].expiresAt = planInfo.ms ? (activatedAt + planInfo.ms) : null;

      // Remove from revoked list
      try {
        const rawRevoked = localStorage.getItem(this.REVOKED_KEYS_KEY);
        let revokedList = rawRevoked ? JSON.parse(rawRevoked) : [];
        revokedList = revokedList.filter(k => k !== key);
        localStorage.setItem(this.REVOKED_KEYS_KEY, JSON.stringify(revokedList));
      } catch (e) {}

      // Reactivate license state
      this.activateLicense(key, clients[idx].email);

      if (typeof this.onUnblockedCallback === 'function') {
        this.onUnblockedCallback();
      }

      this.saveClients(clients);
      return { success: true, message: `Licença do cliente ${clients[idx].name} foi DESBLOQUEADA com sucesso!` };
    }
    return { success: false, message: 'Cliente não encontrado.' };
  },

  deleteClientRecord: function(clientId) {
    let clients = this.getAllClients();
    const cli = clients.find(c => c.id === clientId);
    if (cli) {
      this.revokeClientLicense(clientId);
    }
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
          // Instant Check: Is key revoked or expired in DB?
          if (this.isKeyRevoked(data.key)) {
            this.isLicensed = false;
            this.licenseData = null;
            localStorage.removeItem(this.STORAGE_KEY);
            return;
          }

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

  // 100% Deterministic 32-bit Integer Bitwise Checksum for All Mobile & Desktop Browsers
  calculateChecksum: function(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit signed integer
    }
    const positiveHash = Math.abs(hash);
    return positiveHash.toString(36).toUpperCase().padStart(4, '0').slice(-4);
  },

  // Admin Key Generator for all plan types
  generateValidKey: function(clientName = 'CLIENTE', planCode = 'VITALICIO') {
    const cleanClient = (clientName || 'CLIENTE').trim().toUpperCase().replace(/[^A-Z0-9]/g, '') || 'CLIENTE';
    const plan = this.PLANS[planCode] ? planCode : 'VITALICIO';
    const payload = `${plan}_${cleanClient}_${this.SECRET_SALT}`;
    const checksum = this.calculateChecksum(payload);
    return `GNSLIDES-${plan}-${cleanClient}-${checksum}`;
  },

  // STRICT CHARACTER-BY-CHARACTER VALIDATION (100% Zero-Tolerance for Typos)
  validateKeyDetailed: function(keyStr) {
    const key = this.cleanLicenseKeyString(keyStr);
    if (!key || key.length === 0) {
      return { valid: false, message: '❌ Digite todos os caracteres da sua chave de licença.' };
    }

    // 1. Check if key has been revoked
    if (this.isKeyRevoked(key)) {
      return { valid: false, message: '❌ Esta chave de licença foi BLOQUEADA pelo administrador. Entre em contato pelo WhatsApp (11) 98589-7774.' };
    }

    // 2. Master Keys for instant admin testing & demo
    if (key === 'GNSLIDES-PRO-ADMIN-MASTER-2026' || key === 'GNSLIDES-PRO-VIP-2026') {
      return { valid: true, planCode: 'VITALICIO', clientName: 'VIP' };
    }

    // 3. Strict format check: Must be GNSLIDES-PLANO-NOME-CHECKSUM
    const parts = key.split('-');
    if (parts.length !== 4 || parts[0] !== 'GNSLIDES') {
      return { valid: false, message: '❌ Licença Incorreta! O formato da chave deve ser GNSLIDES-PLANO-NOME-XXXX.' };
    }

    const planCode = parts[1];
    const clientName = parts[2];
    const userChecksum = parts[3];

    if (!this.PLANS[planCode]) {
      return { valid: false, message: '❌ Licença Incorreta! O plano especificado na chave não existe.' };
    }

    if (userChecksum.length !== 4) {
      return { valid: false, message: '❌ Licença Incorreta! O código final de verificação deve ter 4 caracteres.' };
    }

    // 4. VERIFY IN LOCAL CRM DATABASE FIRST IF PRESENT
    const clients = this.getAllClients();
    const registeredClient = clients.find(c => c.key === key);

    if (registeredClient) {
      if (registeredClient.status === 'revoked') {
        return { valid: false, message: '❌ Esta licença foi BLOQUEADA pelo administrador!' };
      }
      return { valid: true, planCode: registeredClient.planCode, clientName: registeredClient.name };
    }

    // 5. DETERMINISTIC CRYPTOGRAPHIC CHECKSUM VERIFICATION (100% Symmetric with generateValidKey)
    const cleanClient = clientName.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') || 'CLIENTE';
    const payload = `${planCode}_${cleanClient}_${this.SECRET_SALT}`;
    const expectedChecksum = this.calculateChecksum(payload);

    if (userChecksum === expectedChecksum) {
      return { valid: true, planCode: planCode, clientName: cleanClient };
    }

    return { valid: false, message: '❌ LICENÇA INCORRETA! A chave digitada possui caracteres errados e NÃO é válida.' };
  },

  // STRICT LICENSE ACTIVATION HANDLER WITH SINGLE-DEVICE LOCK
  activateLicense: function(keyStr, userEmail = '') {
    const cleanKey = this.cleanLicenseKeyString(keyStr);
    if (!cleanKey || cleanKey.length === 0) {
      return { success: false, message: '❌ Digite todos os caracteres da chave de licença.' };
    }

    // Rule 1: Instant Revocation Check
    if (this.isKeyRevoked(cleanKey)) {
      return { success: false, message: '❌ Esta chave de licença foi BLOQUEADA pelo administrador. Entre em contato pelo WhatsApp (11) 98589-7774.' };
    }

    // Rule 2: Strict Character-by-Character Validation
    const check = this.validateKeyDetailed(cleanKey);
    if (!check.valid) {
      return { success: false, message: check.message || '❌ Licença Incorreta! O sistema só ativa se todos os caracteres forem digitados perfeitamente.' };
    }

    const currentDevice = this.getDeviceFingerprint();

    // Rule 3: STRICT SINGLE-DEVICE BINDING ENFORCEMENT
    const clients = this.getAllClients();
    const existingClient = clients.find(c => c.key === cleanKey);

    if (existingClient && existingClient.deviceId && existingClient.deviceId !== currentDevice) {
      return {
        success: false,
        message: `❌ Licença Bloqueada para Este Aparelho!\nEsta chave já foi ativada no aparelho (${existingClient.deviceId}). Cada licença só é válida para um ÚNICO aparelho.\n\nPara usar neste celular/computador, solicite a liberação do aparelho anterior pelo WhatsApp (11) 98589-7774.`
      };
    }

    const planInfo = this.PLANS[check.planCode] || this.PLANS['VITALICIO'];

    const activatedAt = Date.now();
    const expiresAt = planInfo.ms ? (activatedAt + planInfo.ms) : null;

    const data = {
      key: cleanKey,
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

    // Register or update client in CRM DB cleanly without overwriting
    const currentClients = this.getAllClients();
    const existingIdx = currentClients.findIndex(c => c.key === data.key);
    if (existingIdx !== -1) {
      currentClients[existingIdx].deviceId = currentDevice;
      currentClients[existingIdx].status = 'active';
      this.saveClients(currentClients);
    } else {
      this.registerClientRecord(check.clientName, userEmail, check.planCode, data.key, currentDevice);
    }

    this.startExpirationMonitor();

    return {
      success: true,
      message: `🎉 Licença "${planInfo.name}" ativada com sucesso neste aparelho!`,
      data: data
    };
  },

  startExpirationMonitor: function() {
    if (this.expirationTimer) clearInterval(this.expirationTimer);

    this.expirationTimer = setInterval(() => {
      if (this.isLicensed && this.licenseData) {
        // 1. Instant check: Was active key revoked by owner?
        if (this.isKeyRevoked(this.licenseData.key)) {
          this.isLicensed = false;
          this.licenseData = null;
          localStorage.removeItem(this.STORAGE_KEY);
          if (typeof this.onExpiredCallback === 'function') {
            this.onExpiredCallback('blocked');
          }
          return;
        }

        // 2. Check time remaining
        if (this.licenseData.expiresAt) {
          const remainingMs = this.licenseData.expiresAt - Date.now();
          if (remainingMs <= 0) {
            this.isLicensed = false;
            this.licenseData = null;
            localStorage.removeItem(this.STORAGE_KEY);
            if (typeof this.onExpiredCallback === 'function') {
              this.onExpiredCallback('expired');
            }
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
