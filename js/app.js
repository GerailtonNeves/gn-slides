/* ==========================================================================
   GN SLIDES PRO 4K - MAIN APPLICATION CONTROLLER (COMMERCIAL ENGINE)
   Binds AuthSystem, Time-based License System (5 Min, 24h, 1 Mês, 6 Meses,
   1 Ano, Vitalício), Slide Duration Controls (1.5s, 2s, 3s, 5s, Custom),
   Single Device Binding (1 License = 1 Hardware Fingerprint), Guest Lock,
   PRO Unlocked Mode for Paid Licensed Clients, Secret Owner CRM Panel
   (Protected by PIN 11985897774: Generate, Block, 1-Click Unblock, Renew, Reset Devices, WhatsApp Direct),
   Mobile 1-Tap Copy & Paste Clipboard Handlers, Custom Expiration & Blocked
   Overlay with Phone Contact (11) 98589-7774 & 4K Exporter.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  // Global Project State
  const AppState = {
    projectId: 'project_' + Date.now(),
    resolution: '4K',
    exportResolution: '4K',
    aspectRatio: '16:9',
    introEnabled: true,
    introTag: 'EDIÇÃO ESPECIAL DE FOTOS',
    introPresenter: 'Apresenta',
    introTitle: 'CAPELA SANTA INÊS',
    introSubtitle: 'Um Filme Especial de Fotos e Música',
    introDuration: 3.5,
    outroEnabled: true,
    outroIcon: '♥',
    outroTitle: 'Obrigado por Assistir!',
    outroSubtitle: 'Guardado para Sempre no Coração',
    outroDuration: 3.5,
    title: 'CAPELA SANTA INÊS',
    subtitle: 'Um Filme Especial de Fotos e Música',
    slides: [],
    music: null,
    globalSlideDuration: 3.5,
    globalTransition: 'random',
    transitionDuration: 1.2,
    kenBurnsEnabled: true,
    imageFitMode: 'contain-blur',
    photoFilter: 'orange-blue',
    textPosition: 'center',
    textStyle: 'orange-glow',
    textDisplay: 'first-4-slides',
    editingSlideIndex: -1,
    exportedBlob: null,
    exportedBlobUrl: null
  };

  // Auth System Initialization
  if (window.AuthSystem) {
    AuthSystem.init();
    updateAuthUI();
  }

  // License Engine Initialization with Expiration & Instant Block/Unblock Callbacks
  if (window.LicenseSystem) {
    LicenseSystem.init(
      (reason) => {
        // Expired or Blocked Callback
        SlideshowEngine.pause();
        AudioEngine.stop();
        updatePlayPauseButton(false);

        const modalExpired = document.getElementById('modal-license-expired');
        const headerTitle = document.getElementById('expired-modal-header-title');
        const mainTitle = document.getElementById('expired-modal-main-title');
        const mainDesc = document.getElementById('expired-modal-main-desc');

        if (reason === 'blocked') {
          if (headerTitle) headerTitle.textContent = 'Licença Bloqueada pelo Administrador';
          if (mainTitle) mainTitle.textContent = 'Sua licença foi BLOQUEADA pelo administrador!';
          if (mainDesc) mainDesc.innerHTML = 'Entre em contato pelo telefone <strong style="color:var(--orange-main); font-size:18px; display:block; margin-top:6px;"><i class="fa-brands fa-whatsapp text-green"></i> (11) 98589-7774</strong> para regularizar e liberar o seu acesso.';
          showToast('ATENÇÃO: Sua licença foi bloqueada pelo administrador! Contato: (11) 98589-7774', 'danger');
        } else {
          if (headerTitle) headerTitle.textContent = 'Licença Vencida - Acesso Bloqueado';
          if (mainTitle) mainTitle.textContent = 'Sua licença está vencida!';
          if (mainDesc) mainDesc.innerHTML = 'Entre em contato pelo telefone <strong style="color:var(--orange-main); font-size:18px; display:block; margin-top:6px;"><i class="fa-brands fa-whatsapp text-green"></i> (11) 98589-7774</strong> para adicionar sua nova licença e desbloquear o sistema.';
          showToast('Sua licença está vencida! Entre em contato pelo telefone (11) 98589-7774 para renovar.', 'danger');
        }

        if (modalExpired) modalExpired.classList.remove('hidden');
        updateLicenseUI();
      },
      () => {
        // Unblocked Callback
        const modalExpired = document.getElementById('modal-license-expired');
        if (modalExpired) modalExpired.classList.add('hidden');
        updateLicenseUI();
        if (!AppState.music) loadStockAudioTrack();
        SlideshowEngine.requestRender();
        showToast('Sua licença foi DESBLOQUEADA pelo administrador! Sistema liberado.', 'success');
      }
    );
    updateLicenseUI();
  }

  // Canvas Engine Initialization
  const canvas = document.getElementById('slideshow-canvas');
  SlideshowEngine.init(canvas);

  // Sync Engine callbacks for time display & playback sync
  SlideshowEngine.onTimeUpdate = (currentTime, totalTime) => {
    updateTimeDisplay(currentTime, totalTime);
    updateScrubberProgress(currentTime, totalTime);
  };

  SlideshowEngine.onEnded = () => {
    AudioEngine.stop();
    updatePlayPauseButton(false);
  };

  // --- INITIALIZATION & DEMO LOAD ---
  await ProjectStorage.init();
  loadDemoProject('church');

  // --- SLIDE DURATION CONTROLS (SELETOR DE SEGUNDOS POR FOTO) ---
  const selectSlideDurationPreset = document.getElementById('select-slide-duration-preset');
  const customSlideDurationBox = document.getElementById('custom-slide-duration-box');
  const inputCustomSlideDurationVal = document.getElementById('input-custom-slide-duration-val');
  const btnApplyDurationAll = document.getElementById('btn-apply-duration-all');

  if (selectSlideDurationPreset) {
    selectSlideDurationPreset.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val === 'custom') {
        if (customSlideDurationBox) customSlideDurationBox.classList.remove('hidden');
      } else {
        if (customSlideDurationBox) customSlideDurationBox.classList.add('hidden');
        const seconds = parseFloat(val);
        applyNewSlideDurationToAll(seconds);
      }
    });
  }

  if (inputCustomSlideDurationVal) {
    inputCustomSlideDurationVal.addEventListener('input', (e) => {
      const seconds = parseFloat(e.target.value) || 3.5;
      applyNewSlideDurationToAll(seconds);
    });
  }

  if (btnApplyDurationAll) {
    btnApplyDurationAll.addEventListener('click', () => {
      const presetVal = selectSlideDurationPreset.value;
      let seconds = 3.5;
      if (presetVal === 'custom') {
        seconds = parseFloat(inputCustomSlideDurationVal.value) || 3.5;
      } else {
        seconds = parseFloat(presetVal);
      }
      applyNewSlideDurationToAll(seconds);
      showToast(`Tempo de ${seconds}s aplicado a TODAS as fotos!`, 'success');
    });
  }

  function applyNewSlideDurationToAll(seconds) {
    AppState.globalSlideDuration = seconds;
    document.getElementById('input-global-slide-duration').value = seconds;
    if (AppState.slides && AppState.slides.length > 0) {
      AppState.slides.forEach(s => s.duration = seconds);
      syncProjectToEngine();
    }
  }

  // --- AUTH SYSTEM CONTROLLER & HANDLERS ---
  const modalAuth = document.getElementById('modal-auth');
  const btnOpenAuth = document.getElementById('btn-open-auth');
  const btnLogout = document.getElementById('btn-logout');
  const tabAuthLogin = document.getElementById('tab-auth-login');
  const tabAuthRegister = document.getElementById('tab-auth-register');
  const formAuthLogin = document.getElementById('form-auth-login');
  const formAuthRegister = document.getElementById('form-auth-register');
  const btnSubmitLogin = document.getElementById('btn-submit-login');
  const btnSubmitRegister = document.getElementById('btn-submit-register');
  const btnGuestBypass = document.getElementById('btn-guest-bypass');

  if (btnOpenAuth) {
    btnOpenAuth.addEventListener('click', () => {
      modalAuth.classList.remove('hidden');
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      AuthSystem.logout();
      updateAuthUI();
      if (!LicenseSystem.isLicensed) {
        AudioEngine.removeMusic();
        AppState.music = null;
        updateMusicUI(null);
      }
      showToast('Sessão encerrada com sucesso.', 'info');
    });
  }

  if (tabAuthLogin && tabAuthRegister) {
    tabAuthLogin.addEventListener('click', () => {
      tabAuthLogin.classList.add('active');
      tabAuthRegister.classList.remove('active');
      formAuthLogin.classList.remove('hidden');
      formAuthRegister.classList.add('hidden');
    });

    tabAuthRegister.addEventListener('click', () => {
      tabAuthRegister.classList.add('active');
      tabAuthLogin.classList.remove('active');
      formAuthRegister.classList.remove('hidden');
      formAuthLogin.classList.add('hidden');
    });
  }

  if (btnSubmitLogin) {
    btnSubmitLogin.addEventListener('click', () => {
      const email = document.getElementById('input-login-email').value;
      const pass = document.getElementById('input-login-password').value;

      const res = AuthSystem.loginUser(email, pass);
      if (res.success) {
        updateAuthUI();
        modalAuth.classList.add('hidden');
        if (isFullFeatureUnlocked() && !AppState.music) {
          loadStockAudioTrack();
        }
        showToast(res.message, 'success');
      } else {
        showToast(res.message, 'danger');
      }
    });
  }

  if (btnSubmitRegister) {
    btnSubmitRegister.addEventListener('click', () => {
      const name = document.getElementById('input-register-name').value;
      const email = document.getElementById('input-register-email').value;
      const pass = document.getElementById('input-register-password').value;

      const res = AuthSystem.registerUser(name, email, pass);
      if (res.success) {
        updateAuthUI();
        modalAuth.classList.add('hidden');
        if (isFullFeatureUnlocked() && !AppState.music) {
          loadStockAudioTrack();
        }
        showToast(res.message, 'success');
      } else {
        showToast(res.message, 'danger');
      }
    });
  }

  if (btnGuestBypass) {
    btnGuestBypass.addEventListener('click', () => {
      modalAuth.classList.add('hidden');
      if (!LicenseSystem.isLicensed) {
        AudioEngine.removeMusic();
        AppState.music = null;
        updateMusicUI(null);
        showToast('Modo Visitante: Você pode criar vídeos com fotos. Para colocar música e remover a marca d\'água, ative uma licença PRO!', 'warning');
      }
    });
  }

  function updateAuthUI() {
    const userNameDisplay = document.getElementById('user-name-display');
    const btnOpenAuth = document.getElementById('btn-open-auth');
    const btnLogout = document.getElementById('btn-logout');

    if (AuthSystem.currentUser) {
      if (userNameDisplay) userNameDisplay.textContent = AuthSystem.currentUser.name;
      if (btnOpenAuth) btnOpenAuth.classList.add('hidden');
      if (btnLogout) btnLogout.classList.remove('hidden');
    } else {
      if (userNameDisplay) userNameDisplay.textContent = 'Visitante';
      if (btnOpenAuth) btnOpenAuth.classList.remove('hidden');
      if (btnLogout) btnLogout.classList.add('hidden');
    }
  }

  // --- STRICT PERMISSION CHECK: LICENSE OR REGISTERED USER UNLOCKS ALL FEATURES ---
  function isFullFeatureUnlocked() {
    return LicenseSystem.isLicensed || AuthSystem.currentUser !== null;
  }

  // --- UNIVERSAL MODAL CLOSE SYSTEM (X BUTTON, BACKDROP & ESC KEY) ---
  function closeAllModals() {
    const modals = document.querySelectorAll('.modal-overlay:not(#modal-license-expired)');
    modals.forEach(modal => modal.classList.add('hidden'));
    const videoPlayerElem = document.getElementById('exported-video-player');
    if (videoPlayerElem) videoPlayerElem.pause();
  }

  // 1. Close buttons X click handler
  document.querySelectorAll('.btn-close-modal').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const parentModal = btn.closest('.modal-overlay');
      if (parentModal && parentModal.id !== 'modal-license-expired') {
        parentModal.classList.add('hidden');
      }
      const videoPlayerElem = document.getElementById('exported-video-player');
      if (videoPlayerElem) videoPlayerElem.pause();
    });
  });

  // 2. Backdrop click handler (clicking outside modal card)
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay && overlay.id !== 'modal-license-expired') {
        overlay.classList.add('hidden');
        const videoPlayerElem = document.getElementById('exported-video-player');
        if (videoPlayerElem) videoPlayerElem.pause();
      }
    });
  });

  // 3. Escape key handler
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllModals();
    }
  });

  // --- MOBILE 1-TAP COPY & PASTE CLIPBOARD HANDLERS ---
  const btnPasteLicenseKey = document.getElementById('btn-paste-license-key');
  const btnPasteExpiredKey = document.getElementById('btn-paste-expired-key');
  const btnCopyGeneratedKey = document.getElementById('btn-copy-generated-key');

  if (btnPasteLicenseKey) {
    btnPasteLicenseKey.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          document.getElementById('input-license-key').value = text.trim().toUpperCase();
          showToast('Chave colada com sucesso!', 'success');
        } else {
          showToast('Nenhum texto encontrado na área de transferência.', 'warning');
        }
      } catch (err) {
        showToast('Toque e segure no campo para colar a chave.', 'info');
      }
    });
  }

  if (btnPasteExpiredKey) {
    btnPasteExpiredKey.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          document.getElementById('input-expired-new-key').value = text.trim().toUpperCase();
          showToast('Chave colada com sucesso!', 'success');
        } else {
          showToast('Nenhum texto encontrado na área de transferência.', 'warning');
        }
      } catch (err) {
        showToast('Toque e segure no campo para colar a chave.', 'info');
      }
    });
  }

  if (btnCopyGeneratedKey) {
    btnCopyGeneratedKey.addEventListener('click', () => {
      const val = document.getElementById('admin-generated-key-output').value;
      if (val) {
        navigator.clipboard.writeText(val);
        showToast('Chave de licença copiada!', 'success');
      }
    });
  }

  // --- SECRET OWNER ADMIN CRM PANEL (PIN 11985897774 / ADMIN) ---
  const modalClientsCRM = document.getElementById('modal-clients-crm');
  const btnOpenClientsCRM = document.getElementById('btn-open-clients-crm');
  const btnSecretAdminLogo = document.getElementById('btn-secret-admin-logo');

  let logoClickCount = 0;
  let logoClickTimer = null;

  if (btnSecretAdminLogo) {
    btnSecretAdminLogo.addEventListener('click', () => {
      logoClickCount++;
      if (logoClickTimer) clearTimeout(logoClickTimer);
      logoClickTimer = setTimeout(() => { logoClickCount = 0; }, 3000);

      if (logoClickCount >= 5) {
        logoClickCount = 0;
        unlockOwnerAdminPanel();
      }
    });
  }

  if (btnOpenClientsCRM) {
    btnOpenClientsCRM.addEventListener('click', () => {
      unlockOwnerAdminPanel();
    });
  }

  function unlockOwnerAdminPanel() {
    const isUnlocked = sessionStorage.getItem('gn_slides_owner_unlocked');
    if (isUnlocked === 'true') {
      btnOpenClientsCRM.classList.remove('hidden');
      renderCRMClientTable();
      modalClientsCRM.classList.remove('hidden');
      return;
    }

    const pin = prompt('🔐 DIGITE A SENHA DO DONO DO SISTEMA PARA ACESSAR O PAINEL DE LICENÇAS:');
    if (pin === '11985897774' || pin === 'admin') {
      sessionStorage.setItem('gn_slides_owner_unlocked', 'true');
      btnOpenClientsCRM.classList.remove('hidden');
      renderCRMClientTable();
      modalClientsCRM.classList.remove('hidden');
      showToast('Painel Exclusivo do Dono Desbloqueado!', 'success');
    } else if (pin !== null) {
      showToast('Senha de administrador incorreta.', 'danger');
    }
  }

  function renderCRMClientTable() {
    const container = document.getElementById('crm-clients-table-container');
    const clients = LicenseSystem.getAllClients();

    if (!clients || clients.length === 0) {
      container.innerHTML = `
        <div class="empty-state padding-lg" style="text-align:center;">
          <i class="fa-solid fa-users text-orange" style="font-size:36px; margin-bottom:10px;"></i>
          <h4>Nenhum Cliente Cadastrado Ainda</h4>
          <p class="info-text">Use a caixa acima para gerar e cadastrar chaves para seus clientes!</p>
        </div>`;
      return;
    }

    container.innerHTML = `
      <table style="width:100%; border-collapse:collapse; text-align:left; font-size:13px;">
        <thead>
          <tr style="border-bottom: 2px solid var(--glass-border-blue); color:var(--text-muted); font-size:11px; text-transform:uppercase; letter-spacing:0.5px;">
            <th style="padding:10px;">Cliente / E-mail</th>
            <th style="padding:10px;">Plano Contratado</th>
            <th style="padding:10px;">Chave de Licença</th>
            <th style="padding:10px;">Aparelho Vinculado</th>
            <th style="padding:10px;">Status / Validade</th>
            <th style="padding:10px; text-align:right;">Ações do Dono</th>
          </tr>
        </thead>
        <tbody>
          ${clients.map(cli => {
            const isExpired = cli.expiresAt && Date.now() > cli.expiresAt;
            const isRevoked = cli.status === 'revoked';
            
            let statusBadge = '<span class="quality-badge" style="background:rgba(16,185,129,0.2); color:#10b981;">🟢 Ativo</span>';
            if (isRevoked) {
              statusBadge = '<span class="quality-badge" style="background:rgba(239,68,68,0.2); color:#ef4444;">🔴 Bloqueado</span>';
            } else if (isExpired) {
              statusBadge = '<span class="quality-badge" style="background:rgba(245,158,11,0.2); color:#f59e0b;">⏳ Expirado</span>';
            }

            let expStr = 'Vitalício';
            if (cli.expiresAt) {
              expStr = new Date(cli.expiresAt).toLocaleDateString('pt-BR') + ' ' + new Date(cli.expiresAt).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
            }

            return `
              <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
                <td style="padding:12px 10px;">
                  <strong style="color:var(--text-main); display:block;">${cli.name}</strong>
                  <span style="font-size:11px; color:var(--text-muted);">${cli.email || 'Sem e-mail'}</span>
                </td>
                <td style="padding:12px 10px;">
                  <span class="photo-duration-badge"><i class="fa-solid fa-crown text-yellow"></i> ${cli.planName}</span>
                </td>
                <td style="padding:12px 10px; font-family:var(--font-mono); font-size:11px; color:var(--orange-main); font-weight:700;">
                  ${cli.key}
                </td>
                <td style="padding:12px 10px; font-family:var(--font-mono); font-size:11px;">
                  ${cli.deviceId ? `<span style="color:#38bdf8;"><i class="fa-solid fa-laptop"></i> ${cli.deviceId}</span>` : '<span style="color:var(--text-muted); font-style:italic;">Nenhum (Livre)</span>'}
                </td>
                <td style="padding:12px 10px;">
                  ${statusBadge}
                  <span style="font-size:11px; display:block; color:var(--text-muted); margin-top:2px;">Vence: ${expStr}</span>
                </td>
                <td style="padding:12px 10px; text-align:right;">
                  <div style="display:flex; gap:4px; justify-content:flex-end; flex-wrap:wrap;">
                    <button class="btn btn-xs btn-blue-outline btn-send-wa" data-name="${cli.name}" data-key="${cli.key}" title="Enviar Chave pelo WhatsApp">
                      <i class="fa-brands fa-whatsapp" style="color:#25D366;"></i> WhatsApp
                    </button>
                    <button class="btn btn-xs btn-secondary btn-reset-dev" data-id="${cli.id}" title="Desvincular Aparelho Antigo">
                      <i class="fa-solid fa-rotate-left"></i> Liberar PC
                    </button>
                    <button class="btn btn-xs btn-orange btn-renew-cli" data-id="${cli.id}" data-name="${cli.name}" title="Renovar / Alterar Licença">
                      <i class="fa-solid fa-repeat"></i> Renovar
                    </button>
                    ${isRevoked ? `
                      <button class="btn btn-xs btn-success btn-unrevoke-cli" data-id="${cli.id}" title="Desbloquear Licença do Cliente">
                        <i class="fa-solid fa-lock-open"></i> Desbloquear
                      </button>
                    ` : `
                      <button class="btn btn-xs btn-danger-outline btn-revoke-cli" data-id="${cli.id}" title="Bloquear Licença do Cliente">
                        <i class="fa-solid fa-ban"></i> Bloquear
                      </button>
                    `}
                    <button class="btn btn-xs btn-icon-danger btn-del-cli" data-id="${cli.id}" title="Excluir Registro">
                      <i class="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;

    // Bind CRM action buttons with WhatsApp code backticks format for 1-tap mobile copying
    container.querySelectorAll('.btn-send-wa').forEach(b => {
      b.addEventListener('click', () => {
        const name = b.getAttribute('data-name');
        const key = b.getAttribute('data-key');
        const text = encodeURIComponent(`Olá ${name}! Segue sua Chave de Licença do GN SLIDES PRO 4K:\n\n🔑 *Sua Chave PRO:* \`${key}\`\n\n👉 *Como ativar:* Toque e segure no código acima para copiar, depois abra o aplicativo e clique no botão "📋 Colar"!\n\nSuporte WhatsApp: (11) 98589-7774`);
        window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
      });
    });

    container.querySelectorAll('.btn-reset-dev').forEach(b => {
      b.addEventListener('click', () => {
        const id = b.getAttribute('data-id');
        const res = LicenseSystem.resetClientDevice(id);
        renderCRMClientTable();
        showToast(res.message, 'success');
      });
    });

    container.querySelectorAll('.btn-renew-cli').forEach(b => {
      b.addEventListener('click', () => {
        const id = b.getAttribute('data-id');
        const name = b.getAttribute('data-name');
        const newPlan = prompt(`Escolha o novo plano para o cliente ${name}:\n\nDigite: 1MES, 6MESES, 1ANO ou VITALICIO`, '1ANO');
        if (newPlan) {
          const res = LicenseSystem.renewClientLicense(id, newPlan.trim().toUpperCase());
          renderCRMClientTable();
          updateLicenseUI();
          showToast(res.message, 'success');
        }
      });
    });

    container.querySelectorAll('.btn-revoke-cli').forEach(b => {
      b.addEventListener('click', () => {
        const id = b.getAttribute('data-id');
        if (confirm('Tem certeza que deseja BLOQUEAR a licença deste cliente?')) {
          const res = LicenseSystem.revokeClientLicense(id);
          renderCRMClientTable();
          updateLicenseUI();
          showToast(res.message, 'info');
        }
      });
    });

    container.querySelectorAll('.btn-unrevoke-cli').forEach(b => {
      b.addEventListener('click', () => {
        const id = b.getAttribute('data-id');
        const res = LicenseSystem.unrevokeClientLicense(id);
        renderCRMClientTable();
        updateLicenseUI();
        showToast(res.message, 'success');
      });
    });

    container.querySelectorAll('.btn-del-cli').forEach(b => {
      b.addEventListener('click', () => {
        const id = b.getAttribute('data-id');
        if (confirm('Excluir permanentemente este registro de cliente?')) {
          const res = LicenseSystem.deleteClientRecord(id);
          renderCRMClientTable();
          showToast(res.message, 'info');
        }
      });
    });
  }

  // --- LICENSE SYSTEM UI & HANDLERS ---
  const modalLicense = document.getElementById('modal-license');
  const btnActivateLicense = document.getElementById('btn-activate-license');
  const btnSubmitActivateKey = document.getElementById('btn-submit-activate-key');
  const btnAdminGenerateKey = document.getElementById('btn-admin-generate-key');
  const btnSubmitExpiredKey = document.getElementById('btn-submit-expired-key');

  if (btnActivateLicense) {
    btnActivateLicense.addEventListener('click', () => {
      updateLicenseModalInfo();
      modalLicense.classList.remove('hidden');
    });
  }

  if (btnSubmitActivateKey) {
    btnSubmitActivateKey.addEventListener('click', () => {
      const keyVal = document.getElementById('input-license-key').value;
      const emailVal = document.getElementById('input-license-email').value;

      const res = LicenseSystem.activateLicense(keyVal, emailVal);
      if (res.success) {
        updateLicenseUI();
        modalLicense.classList.add('hidden');
        loadStockAudioTrack();
        SlideshowEngine.requestRender();
        showToast(res.message, 'success');
      } else {
        showToast(res.message, 'danger');
      }
    });
  }

  if (btnSubmitExpiredKey) {
    btnSubmitExpiredKey.addEventListener('click', () => {
      const keyVal = document.getElementById('input-expired-new-key').value;
      const res = LicenseSystem.activateLicense(keyVal);
      if (res.success) {
        updateLicenseUI();
        document.getElementById('modal-license-expired').classList.add('hidden');
        loadStockAudioTrack();
        SlideshowEngine.requestRender();
        showToast('Sistema desbloqueado com sucesso!', 'success');
      } else {
        showToast(res.message, 'danger');
      }
    });
  }

  if (btnAdminGenerateKey) {
    btnAdminGenerateKey.addEventListener('click', () => {
      const name = document.getElementById('admin-client-name').value || 'CLIENTE';
      const email = document.getElementById('admin-client-email').value || '';
      const plan = document.getElementById('admin-select-plan-duration').value || '1ANO';

      const key = LicenseSystem.generateValidKey(name, plan);
      document.getElementById('admin-generated-key-output').value = key;
      
      // Auto register generated key in CRM DB
      LicenseSystem.registerClientRecord(name, email, plan, key);
      renderCRMClientTable();

      showToast(`Chave gerada e cadastrada para o cliente ${name}!`, 'info');
    });
  }

  function updateLicenseUI() {
    const badgeText = document.getElementById('license-badge-text');
    const proHeaderBadge = document.getElementById('pro-header-badge');

    if (LicenseSystem.isLicensed) {
      if (badgeText) badgeText.textContent = 'PRO Ativado';
      if (proHeaderBadge) proHeaderBadge.textContent = 'PRO 4K (LICENCIADO)';
    } else {
      if (badgeText) badgeText.textContent = 'Ativar PRO';
      if (proHeaderBadge) proHeaderBadge.textContent = 'PRO 4K';
    }
  }

  function updateLicenseModalInfo() {
    const title = document.getElementById('license-status-title');
    const desc = document.getElementById('license-status-desc');
    const deviceTag = document.getElementById('license-device-id-info');

    if (deviceTag) {
      deviceTag.textContent = `Dispositivo Atual Registrado: ${LicenseSystem.getDeviceFingerprint()}`;
    }

    if (LicenseSystem.isLicensed) {
      const remainingStr = LicenseSystem.getTimeRemainingString();
      if (title) title.textContent = `Status: ${LicenseSystem.licenseData.planName || 'Licença PRO Ativa'}`;
      if (desc) desc.textContent = `Sua licença está ativa neste dispositivo (${remainingStr}). Sem marca d'água em 4K e músicas liberadas.`;
    } else {
      if (title) title.textContent = 'Status: Versão de Demonstração (Grátis)';
      if (desc) desc.textContent = 'Digite sua Chave de Licença PRO para remover a marca d\'água e liberar músicas e exportação 4K ilimitada!';
    }
  }

  // --- TAB NAVIGATION SYSTEM ---
  const tabButtons = document.querySelectorAll('.sidebar-tabs .tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(targetTab).classList.add('active');
    });
  });

  // --- THEMED STOCK PRESETS SELECTOR ---
  const selectPresetTemplate = document.getElementById('select-preset-template');
  if (selectPresetTemplate) {
    selectPresetTemplate.addEventListener('change', (e) => {
      loadDemoProject(e.target.value);
    });
  }

  // --- UPLOAD HANDLERS: ZERO-RAM MOBILE PHOTO LOADER ---
  const inputPhotos = document.getElementById('input-upload-photos');
  const dropZonePhotos = document.getElementById('drop-zone-photos');

  dropZonePhotos.addEventListener('click', () => inputPhotos.click());

  ['dragenter', 'dragover'].forEach(eventName => {
    dropZonePhotos.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZonePhotos.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZonePhotos.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZonePhotos.classList.remove('dragover');
    });
  });

  dropZonePhotos.addEventListener('drop', (e) => {
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) handlePhotoFilesUpload(files);
  });

  inputPhotos.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) handlePhotoFilesUpload(files);
  });

  // Ultra-safe mobile photo loader: Uses Blob URLs + immediate revocation + max 1280px canvas resize
  function compressAndResizePhoto(file, maxWidth = 1280, maxHeight = 1280, quality = 0.80) {
    return new Promise((resolve) => {
      const blobUrl = URL.createObjectURL(file);
      const img = new Image();
      
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

        // Immediate memory cleanup
        URL.revokeObjectURL(blobUrl);
        img.onload = null;
        img.onerror = null;
        img.src = '';

        resolve(compressedDataUrl);
      };

      img.onerror = () => {
        URL.revokeObjectURL(blobUrl);
        resolve(null);
      };

      img.src = blobUrl;
    });
  }

  async function handlePhotoFilesUpload(files) {
    if (!files || files.length === 0) return;
    showToast(`Processando ${files.length} foto(s)...`, 'info');

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const dataUrl = await compressAndResizePhoto(file);
      if (dataUrl) {
        const newSlide = {
          id: 'slide_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          title: file.name || `Foto ${AppState.slides.length + 1}`,
          caption: '',
          duration: AppState.globalSlideDuration,
          transition: 'default',
          dataUrl: dataUrl
        };
        AppState.slides.push(newSlide);
      }
      await new Promise(r => setTimeout(r, 60));
    }

    if (inputPhotos) inputPhotos.value = '';

    await syncProjectToEngine();
    syncPhotoCaptionsToInputs();
    showToast(`${files.length} foto(s) adicionada(s) com sucesso!`, 'success');
  }

  // --- UPLOAD HANDLERS: MUSIC ---
  const inputMusic = document.getElementById('input-upload-music');
  const dropZoneMusic = document.getElementById('drop-zone-music');
  const btnLoadStockAudio = document.getElementById('btn-load-stock-audio');

  if (dropZoneMusic) {
    dropZoneMusic.addEventListener('click', () => {
      if (!isFullFeatureUnlocked()) {
        showToast('🔒 Ative sua licença PRO para colocar músicas no seu slide!', 'warning');
        modalLicense.classList.remove('hidden');
        return;
      }
      inputMusic.click();
    });
  }

  if (inputMusic) {
    inputMusic.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) handleAudioFileUpload(file);
    });
  }

  if (btnLoadStockAudio) {
    btnLoadStockAudio.addEventListener('click', () => {
      if (!isFullFeatureUnlocked()) {
        showToast('🔒 Ative sua licença PRO para usar a biblioteca de músicas!', 'warning');
        modalLicense.classList.remove('hidden');
        return;
      }
      loadStockAudioTrack();
    });
  }

  async function handleAudioFileUpload(file) {
    if (!isFullFeatureUnlocked()) {
      showToast('🔒 Ative sua licença PRO para adicionar músicas aos slides.', 'warning');
      modalLicense.classList.remove('hidden');
      return;
    }

    showToast('Carregando áudio HQ...', 'info');
    try {
      const metadata = await AudioEngine.loadAudioFile(file);
      AppState.music = metadata;
      updateMusicUI(metadata);
      showToast('Música em alta qualidade adicionada com sucesso!', 'success');
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }

  function loadStockAudioTrack() {
    showToast('Carregando trilha de áudio HQ...', 'info');
    const musicData = DemoAssets.getDemoAudioTrack();
    AudioEngine.loadAudioFromBuffer(musicData.blob, musicData.name);

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    fetch(musicData.dataUrl)
      .then(res => res.arrayBuffer())
      .then(ab => audioContext.decodeAudioData(ab))
      .then(decoded => {
        AudioEngine.activeBuffer = decoded;
        AppState.music = { name: musicData.name, duration: decoded.duration };
        updateMusicUI(AppState.music);
        showToast('Trilha musical adicionada!', 'success');
      })
      .catch(err => console.log('Stock audio loaded'));
  }

  document.getElementById('btn-remove-music').addEventListener('click', () => {
    AudioEngine.removeMusic();
    AppState.music = null;
    updateMusicUI(null);
    showToast('Música removida.', 'info');
  });

  document.getElementById('slider-music-volume').addEventListener('input', (e) => {
    const vol = parseInt(e.target.value) / 100;
    AudioEngine.setVolume(vol);
    document.getElementById('val-music-volume').textContent = `${e.target.value}%`;
  });

  document.getElementById('check-sync-duration').addEventListener('change', (e) => {
    if (e.target.checked && AppState.music && AppState.slides.length > 0) {
      const perSlideDur = Math.max(1, AppState.music.duration / AppState.slides.length);
      AppState.slides.forEach(s => s.duration = parseFloat(perSlideDur.toFixed(1)));
      syncProjectToEngine();
      showToast(`Duração dos slides ajustada para ${perSlideDur.toFixed(1)}s cada.`, 'info');
    }
  });

  // --- RESOLUTION & EFFECT CONTROLS ---
  document.getElementById('select-video-resolution').addEventListener('change', (e) => {
    const res = e.target.value || '4K';
    AppState.resolution = res;
    AppState.exportResolution = res;
    SlideshowEngine.setResolutionAndAspect(res, AppState.aspectRatio);
    document.querySelector('.quality-badge').textContent = (res === '4K') ? '4K Ultra HD' : 'Full HD 1080p';
    showToast(`Resolução ajustada para ${res}!`, 'info');
  });

  document.getElementById('select-global-transition').addEventListener('change', (e) => {
    AppState.globalTransition = e.target.value;
    SlideshowEngine.globalTransition = e.target.value;
    SlideshowEngine.requestRender();
  });

  document.getElementById('slider-transition-duration').addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    AppState.transitionDuration = val;
    SlideshowEngine.transitionDuration = val;
    document.getElementById('val-transition-duration').textContent = `${val.toFixed(1)}s`;
  });

  document.getElementById('select-ken-burns').addEventListener('change', (e) => {
    const enabled = e.target.value === 'enabled';
    AppState.kenBurnsEnabled = enabled;
    SlideshowEngine.kenBurnsEnabled = enabled;
    SlideshowEngine.requestRender();
  });

  document.getElementById('select-image-fit').addEventListener('change', (e) => {
    AppState.imageFitMode = e.target.value;
    SlideshowEngine.imageFitMode = e.target.value;
    SlideshowEngine.requestRender();
  });

  document.getElementById('select-photo-filter').addEventListener('change', (e) => {
    AppState.photoFilter = e.target.value;
    SlideshowEngine.photoFilter = e.target.value;
    SlideshowEngine.requestRender();
  });

  // --- INSTANT DEBOUNCED TEXT INPUT HANDLERS (0ms LAG) ---
  let debounceTimeout = null;
  function updateTextDebounced(updateFn) {
    updateFn();
    if (debounceTimeout) clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      SlideshowEngine.requestRender();
    }, 60);
  }

  // 1. INTRO SCREEN CONTROLS
  document.getElementById('check-enable-intro').addEventListener('change', (e) => {
    AppState.introEnabled = e.target.checked;
    SlideshowEngine.introEnabled = e.target.checked;
    SlideshowEngine.calculateTotalDuration();
    updateTimeDisplay(SlideshowEngine.currentTime, SlideshowEngine.totalDuration);
    SlideshowEngine.requestRender();
  });

  document.getElementById('input-intro-tag').addEventListener('input', (e) => {
    updateTextDebounced(() => {
      AppState.introTag = e.target.value;
      SlideshowEngine.introTag = e.target.value;
    });
  });

  document.getElementById('input-intro-presenter').addEventListener('input', (e) => {
    updateTextDebounced(() => {
      AppState.introPresenter = e.target.value;
      SlideshowEngine.introPresenter = e.target.value;
    });
  });

  document.getElementById('input-intro-title').addEventListener('input', (e) => {
    updateTextDebounced(() => {
      AppState.introTitle = e.target.value;
      SlideshowEngine.introTitle = e.target.value;
      SlideshowEngine.titleText = e.target.value;
    });
  });

  document.getElementById('input-intro-subtitle').addEventListener('input', (e) => {
    updateTextDebounced(() => {
      AppState.introSubtitle = e.target.value;
      SlideshowEngine.introSubtitle = e.target.value;
      SlideshowEngine.subtitleText = e.target.value;
    });
  });

  document.getElementById('input-intro-duration').addEventListener('input', (e) => {
    const val = parseFloat(e.target.value) || 3.5;
    AppState.introDuration = val;
    SlideshowEngine.introDuration = val;
    SlideshowEngine.calculateTotalDuration();
    updateTimeDisplay(SlideshowEngine.currentTime, SlideshowEngine.totalDuration);
    SlideshowEngine.requestRender();
  });

  // 2. OUTRO SCREEN CONTROLS
  document.getElementById('check-enable-outro').addEventListener('change', (e) => {
    AppState.outroEnabled = e.target.checked;
    SlideshowEngine.outroEnabled = e.target.checked;
    SlideshowEngine.calculateTotalDuration();
    updateTimeDisplay(SlideshowEngine.currentTime, SlideshowEngine.totalDuration);
    SlideshowEngine.requestRender();
  });

  document.getElementById('select-outro-icon').addEventListener('change', (e) => {
    AppState.outroIcon = e.target.value;
    SlideshowEngine.outroIcon = e.target.value;
    SlideshowEngine.requestRender();
  });

  document.getElementById('input-outro-title').addEventListener('input', (e) => {
    updateTextDebounced(() => {
      AppState.outroTitle = e.target.value;
      SlideshowEngine.outroTitle = e.target.value;
    });
  });

  document.getElementById('input-outro-subtitle').addEventListener('input', (e) => {
    updateTextDebounced(() => {
      AppState.outroSubtitle = e.target.value;
      SlideshowEngine.outroSubtitle = e.target.value;
    });
  });

  document.getElementById('input-outro-duration').addEventListener('input', (e) => {
    const val = parseFloat(e.target.value) || 3.5;
    AppState.outroDuration = val;
    SlideshowEngine.outroDuration = val;
    SlideshowEngine.calculateTotalDuration();
    updateTimeDisplay(SlideshowEngine.currentTime, SlideshowEngine.totalDuration);
    SlideshowEngine.requestRender();
  });

  // 3. SLIDE OVERLAY TEXT CONTROLS
  document.getElementById('select-text-display').addEventListener('change', (e) => {
    AppState.textDisplay = e.target.value;
    SlideshowEngine.textDisplay = e.target.value;
    SlideshowEngine.requestRender();
  });

  document.getElementById('select-text-position').addEventListener('change', (e) => {
    AppState.textPosition = e.target.value;
    SlideshowEngine.textPosition = e.target.value;
    SlideshowEngine.requestRender();
  });

  document.getElementById('select-text-style').addEventListener('change', (e) => {
    AppState.textStyle = e.target.value;
    SlideshowEngine.textStyle = e.target.value;
    SlideshowEngine.requestRender();
  });

  // 4. INDIVIDUAL SLIDE CAPTION INPUT HANDLERS (SLIDES 1 TO 4)
  [1, 2, 3, 4].forEach(slideNum => {
    const inputElem = document.getElementById(`input-slide-caption-${slideNum}`);
    if (inputElem) {
      inputElem.addEventListener('input', (e) => {
        const idx = slideNum - 1;
        if (AppState.slides[idx]) {
          updateTextDebounced(() => {
            AppState.slides[idx].caption = e.target.value;
            SlideshowEngine.slides[idx].caption = e.target.value;
          });
        }
      });
    }
  });

  function syncPhotoCaptionsToInputs() {
    [1, 2, 3, 4].forEach(slideNum => {
      const inputElem = document.getElementById(`input-slide-caption-${slideNum}`);
      const idx = slideNum - 1;
      if (inputElem && AppState.slides[idx]) {
        inputElem.value = AppState.slides[idx].caption || '';
      } else if (inputElem) {
        inputElem.value = '';
      }
    });
  }

  // --- ASPECT RATIO SWITCHER ---
  const aspectButtons = document.querySelectorAll('.aspect-btn');
  aspectButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      aspectButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const ratio = btn.getAttribute('data-aspect');
      AppState.aspectRatio = ratio;
      SlideshowEngine.setResolutionAndAspect(AppState.resolution, ratio);

      const playerScreen = document.getElementById('player-screen');
      playerScreen.className = `player-screen ratio-${ratio.replace(':', '-')}`;
    });
  });

  // --- PLAYER CONTROLS ---
  const btnPlayPause = document.getElementById('btn-play-pause');
  const canvasPlayOverlay = document.getElementById('canvas-overlay-play');
  const btnStop = document.getElementById('btn-stop-preview');
  const videoScrubber = document.getElementById('video-scrubber');
  const btnToggleMute = document.getElementById('btn-toggle-mute');

  btnPlayPause.addEventListener('click', togglePlayPause);
  canvasPlayOverlay.addEventListener('click', togglePlayPause);

  function togglePlayPause() {
    if (SlideshowEngine.isPlaying) {
      SlideshowEngine.pause();
      AudioEngine.stop();
      updatePlayPauseButton(false);
    } else {
      SlideshowEngine.play();
      if (AudioEngine.activeBuffer && isFullFeatureUnlocked()) {
        AudioEngine.play(SlideshowEngine.currentTime, true, document.getElementById('check-music-loop').checked);
      }
      updatePlayPauseButton(true);
    }
  }

  function updatePlayPauseButton(isPlaying) {
    btnPlayPause.innerHTML = isPlaying ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
    canvasPlayOverlay.style.display = isPlaying ? 'none' : 'flex';
  }

  btnStop.addEventListener('click', () => {
    SlideshowEngine.pause();
    AudioEngine.stop();
    SlideshowEngine.seek(0);
    updatePlayPauseButton(false);
  });

  videoScrubber.addEventListener('input', (e) => {
    const time = (parseFloat(e.target.value) / 100) * SlideshowEngine.totalDuration;
    SlideshowEngine.seek(time);
    if (AudioEngine.isPlaying && AudioEngine.activeBuffer && isFullFeatureUnlocked()) {
      AudioEngine.play(time);
    }
  });

  btnToggleMute.addEventListener('click', () => {
    const isMuted = AudioEngine.toggleMute();
    btnToggleMute.innerHTML = isMuted ? '<i class="fa-solid fa-volume-xmark"></i>' : '<i class="fa-solid fa-volume-high"></i>';
  });

  document.getElementById('btn-fullscreen').addEventListener('click', () => {
    const elem = document.getElementById('player-screen');
    if (!document.fullscreenElement) {
      elem.requestFullscreen().catch(err => console.log(err));
    } else {
      document.exitFullscreen();
    }
  });

  // --- TIMELINE & SLIDE LIST RENDERING ---
  async function syncProjectToEngine() {
    await SlideshowEngine.setSlides(AppState.slides);
    renderPhotosSidebarGrid();
    renderTimelineSlidesTrack();
    updateTimeDisplay(SlideshowEngine.currentTime, SlideshowEngine.totalDuration);
  }

  function renderPhotosSidebarGrid() {
    const grid = document.getElementById('photos-grid-list');
    document.getElementById('photos-count-text').textContent = AppState.slides.length;
    document.getElementById('photo-count-badge').textContent = AppState.slides.length;

    if (AppState.slides.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <i class="fa-regular fa-image text-cyan"></i>
          <p>Nenhuma foto adicionada ainda.</p>
          <span>Faça upload de imagens acima ou use o botão "Exemplo Pronto".</span>
        </div>`;
      return;
    }

    grid.innerHTML = AppState.slides.map((slide, idx) => `
      <div class="photo-item-card" data-index="${idx}">
        <div class="photo-thumb-container">
          <img src="${slide.dataUrl}" alt="Slide ${idx + 1}">
          <span class="slide-number-tag">#${idx + 1}</span>
          <div class="photo-overlay-actions">
            <button class="btn-icon-md btn-edit-slide" data-index="${idx}" title="Editar Foto & Legenda">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="btn-icon-danger btn-delete-slide" data-index="${idx}" title="Excluir">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
        <div class="photo-card-info">
          <span class="photo-duration-badge"><i class="fa-solid fa-clock text-orange"></i> ${slide.duration || 3.5}s</span>
          <span class="photo-duration-badge"><i class="fa-solid fa-font text-cyan"></i> ${slide.caption ? slide.caption.substring(0, 10) + '...' : (idx < 4 ? 'Texto Abertura' : 'Sem Texto')}</span>
        </div>
      </div>
    `).join('');

    grid.querySelectorAll('.btn-edit-slide').forEach(b => {
      b.addEventListener('click', (e) => {
        const idx = parseInt(b.getAttribute('data-index'));
        openEditSlideModal(idx);
      });
    });

    grid.querySelectorAll('.btn-delete-slide').forEach(b => {
      b.addEventListener('click', (e) => {
        const idx = parseInt(b.getAttribute('data-index'));
        AppState.slides.splice(idx, 1);
        syncProjectToEngine();
        syncPhotoCaptionsToInputs();
        showToast('Foto excluída.', 'info');
      });
    });
  }

  function renderTimelineSlidesTrack() {
    const container = document.getElementById('timeline-slides-container');
    if (AppState.slides.length === 0) {
      container.innerHTML = `
        <div class="empty-timeline-hint">
          <i class="fa-regular fa-images"></i>
          <span>Adicione fotos na barra lateral para visualizar os slides aqui.</span>
        </div>`;
      return;
    }

    container.innerHTML = AppState.slides.map((slide, idx) => `
      <div class="tl-slide-block ${idx === 0 ? 'active' : ''}" data-index="${idx}">
        <img src="${slide.dataUrl}" alt="Thumb ${idx + 1}">
        <span class="tl-slide-idx">${idx + 1}</span>
        <span class="tl-slide-dur">${slide.duration || 3.5}s</span>
      </div>
    `).join('');

    container.querySelectorAll('.tl-slide-block').forEach(block => {
      block.addEventListener('click', () => {
        const idx = parseInt(block.getAttribute('data-index'));
        container.querySelectorAll('.tl-slide-block').forEach(b => b.classList.remove('active'));
        block.classList.add('active');

        let startTime = (AppState.introEnabled && (AppState.introTitle || AppState.introPresenter || AppState.introTag)) ? (AppState.introDuration || 3.5) : 0;
        for (let i = 0; i < idx; i++) startTime += AppState.slides[i].duration || 3.5;
        SlideshowEngine.seek(startTime);
      });
    });
  }

  document.getElementById('btn-clear-photos').addEventListener('click', () => {
    if (AppState.slides.length === 0) return;
    if (confirm('Tem certeza que deseja remover todas as fotos?')) {
      AppState.slides = [];
      syncProjectToEngine();
      syncPhotoCaptionsToInputs();
      showToast('Todas as fotos foram removidas.', 'info');
    }
  });

  document.getElementById('btn-apply-all-duration').addEventListener('click', () => {
    const dur = parseFloat(document.getElementById('input-global-slide-duration').value);
    AppState.globalSlideDuration = dur;
    AppState.slides.forEach(s => s.duration = dur);
    syncProjectToEngine();
    showToast(`Duração de ${dur}s aplicada a todas as fotos!`, 'success');
  });

  // --- EDIT SINGLE SLIDE MODAL ---
  const modalEditSlide = document.getElementById('modal-edit-slide');

  function openEditSlideModal(idx) {
    AppState.editingSlideIndex = idx;
    const slide = AppState.slides[idx];
    document.getElementById('edit-slide-img').src = slide.dataUrl;
    document.getElementById('edit-slide-duration').value = slide.duration || 3.5;
    document.getElementById('edit-slide-transition').value = slide.transition || 'default';
    document.getElementById('edit-slide-caption').value = slide.caption || '';
    modalEditSlide.classList.remove('hidden');
  }

  document.getElementById('btn-save-slide-changes').addEventListener('click', () => {
    const idx = AppState.editingSlideIndex;
    if (idx >= 0 && idx < AppState.slides.length) {
      AppState.slides[idx].duration = parseFloat(document.getElementById('edit-slide-duration').value);
      AppState.slides[idx].transition = document.getElementById('edit-slide-transition').value;
      AppState.slides[idx].caption = document.getElementById('edit-slide-caption').value;
      syncProjectToEngine();
      syncPhotoCaptionsToInputs();
      showToast('Texto e opções da foto salvos!', 'success');
    }
    modalEditSlide.classList.add('hidden');
  });

  document.getElementById('btn-delete-current-slide').addEventListener('click', () => {
    const idx = AppState.editingSlideIndex;
    if (idx >= 0 && idx < AppState.slides.length) {
      AppState.slides.splice(idx, 1);
      syncProjectToEngine();
      syncPhotoCaptionsToInputs();
      showToast('Foto excluída.', 'info');
    }
    modalEditSlide.classList.add('hidden');
  });

  // --- PROJECT MANAGEMENT ---
  document.getElementById('btn-new-project').addEventListener('click', () => {
    if (confirm('Criar um novo projeto? As alterações não salvas serão descartadas.')) {
      AppState.projectId = 'project_' + Date.now();
      AppState.slides = [];
      AppState.music = null;
      AudioEngine.removeMusic();
      updateMusicUI(null);
      syncProjectToEngine();
      syncPhotoCaptionsToInputs();
      showToast('Novo projeto criado!', 'success');
    }
  });

  document.getElementById('btn-save-project').addEventListener('click', async () => {
    try {
      showToast('Salvando projeto...', 'info');
      await ProjectStorage.saveProject(AppState);
      showToast('Projeto salvo com sucesso!', 'success');
    } catch (e) {
      showToast('Erro ao salvar projeto.', 'danger');
    }
  });

  document.getElementById('btn-load-project').addEventListener('click', async () => {
    const projects = await ProjectStorage.getAllProjects();
    renderProjectsListModal(projects);
    document.getElementById('modal-projects').classList.remove('hidden');
  });

  function renderProjectsListModal(projects) {
    const container = document.getElementById('projects-list-container');
    if (!projects || projects.length === 0) {
      container.innerHTML = `<p class="empty-state">Nenhum projeto salvo encontrado.</p>`;
      return;
    }

    container.innerHTML = projects.map(p => `
      <div class="photo-item-card padding-md" style="padding:12px;">
        <h4>${p.title || 'Projeto Sem Título'}</h4>
        <span class="info-text">${p.slides ? p.slides.length : 0} Fotos • ${new Date(p.updatedAt).toLocaleDateString('pt-BR')}</span>
        <div class="margin-top-sm" style="display:flex; gap:6px; margin-top:8px;">
          <button class="btn btn-orange btn-xs btn-open-project" data-id="${p.id}">Abrir</button>
          <button class="btn btn-danger-outline btn-xs btn-del-project" data-id="${p.id}">Excluir</button>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.btn-open-project').forEach(b => {
      b.addEventListener('click', async () => {
        const id = b.getAttribute('data-id');
        const proj = await ProjectStorage.getProjectById(id);
        if (proj) {
          Object.assign(AppState, proj);
          await syncProjectToEngine();
          syncPhotoCaptionsToInputs();
          document.getElementById('modal-projects').classList.add('hidden');
          showToast(`Projeto "${proj.title}" carregado!`, 'success');
        }
      });
    });

    container.querySelectorAll('.btn-del-project').forEach(b => {
      b.addEventListener('click', async () => {
        const id = b.getAttribute('data-id');
        await ProjectStorage.deleteProject(id);
        const updated = await ProjectStorage.getAllProjects();
        renderProjectsListModal(updated);
        showToast('Projeto excluído.', 'info');
      });
    });
  }

  document.getElementById('btn-export-json-file').addEventListener('click', () => {
    ProjectStorage.exportProjectJSON(AppState);
    showToast('Arquivo de projeto .JSON exportado!', 'success');
  });

  document.getElementById('input-import-json').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const imported = await ProjectStorage.importProjectJSON(file);
        Object.assign(AppState, imported);
        await syncProjectToEngine();
        syncPhotoCaptionsToInputs();
        document.getElementById('modal-projects').classList.add('hidden');
        showToast('Projeto importado com sucesso!', 'success');
      } catch (err) {
        showToast(err.message, 'danger');
      }
    }
  });

  // --- DEMO PROJECT & THEMED STOCK TEMPLATES LOAD ---
  const btnDemoProject = document.getElementById('btn-demo-project');
  if (btnDemoProject) {
    btnDemoProject.addEventListener('click', () => {
      loadDemoProject('church');
    });
  }

  function loadDemoProject(presetKey = 'church') {
    const preset = DemoAssets.templates[presetKey] || DemoAssets.templates.church;
    showToast(`Carregando modelo ${preset.name}...`, 'info');

    AppState.slides = DemoAssets.getDemoSlides(presetKey);
    AppState.introTag = preset.introTag;
    AppState.introPresenter = preset.introPresenter;
    AppState.introTitle = preset.introTitle;
    AppState.introSubtitle = preset.introSubtitle;
    AppState.outroTitle = preset.outroTitle;
    AppState.outroSubtitle = preset.outroSubtitle;
    AppState.title = AppState.introTitle;
    AppState.subtitle = AppState.introSubtitle;

    document.getElementById('input-intro-tag').value = AppState.introTag;
    document.getElementById('input-intro-presenter').value = AppState.introPresenter;
    document.getElementById('input-intro-title').value = AppState.introTitle;
    document.getElementById('input-intro-subtitle').value = AppState.introSubtitle;
    document.getElementById('input-outro-title').value = AppState.outroTitle;
    document.getElementById('input-outro-subtitle').value = AppState.outroSubtitle;

    if (isFullFeatureUnlocked()) {
      loadStockAudioTrack();
    } else {
      AudioEngine.removeMusic();
      AppState.music = null;
      updateMusicUI(null);
    }

    syncProjectToEngine();
    syncPhotoCaptionsToInputs();
    showToast(`Modelo "${preset.name}" pronto!`, 'success');
  }

  // --- EXPORT MP4 VIDEO WORKFLOW ---
  const modalExport = document.getElementById('modal-export');
  const btnExport = document.getElementById('btn-export-video');
  const btnDownloadMp4Now = document.getElementById('btn-download-mp4-now');
  const btnDownloadWebmNow = document.getElementById('btn-download-webm-now');
  const btnPlayExportedVideo = document.getElementById('btn-play-exported-video');
  const btnCancelExport = document.getElementById('btn-cancel-export');
  const exportLiveBox = document.getElementById('export-live-box');
  const exportPlayerBox = document.getElementById('export-player-box');
  const videoPlayerElem = document.getElementById('exported-video-player');

  btnExport.addEventListener('click', () => {
    if (AppState.slides.length === 0 && !AppState.introEnabled) {
      showToast('Adicione pelo menos 1 foto antes de exportar o vídeo.', 'warning');
      return;
    }

    const res = AppState.exportResolution || AppState.resolution || '4K';

    modalExport.classList.remove('hidden');
    exportLiveBox.classList.remove('hidden');
    exportPlayerBox.classList.add('hidden');
    btnDownloadMp4Now.classList.add('hidden');
    btnDownloadWebmNow.classList.add('hidden');
    btnPlayExportedVideo.classList.add('hidden');
    btnCancelExport.classList.remove('hidden');
    document.getElementById('export-progress-fill').style.width = '0%';
    document.getElementById('export-percent-text').textContent = '0%';
    document.getElementById('export-modal-title').textContent = 'Gerando seu Vídeo MP4...';
    document.getElementById('export-resolution-val').textContent = (res === '4K') ? '3840x2160 (4K Ultra HD)' : '1920x1080 (Full HD)';
    
    const titleForName = AppState.introTitle || 'Video';
    const sanitizedTitle = VideoExporter.sanitizeFilename(titleForName);
    const cleanFilename = `GNSlides_${res}_${sanitizedTitle}.mp4`;
    document.getElementById('export-filename-val').textContent = 'Tabela de Frames Indexada';
    document.getElementById('export-status-text').textContent = 'Codificando quadros H.264 e gerando arquivo ISO MP4...';

    SlideshowEngine.resolution = res;
    SlideshowEngine.updateResolution();

    VideoExporter.exportToMP4({
      slideshowEngine: SlideshowEngine,
      audioEngine: AudioEngine,
      onProgress: (percent, currentFrame, totalFrames, currentTime, totalDuration) => {
        document.getElementById('export-progress-fill').style.width = `${percent}%`;
        document.getElementById('export-percent-text').textContent = `${percent}%`;
        document.getElementById('export-frame-count').textContent = `${currentFrame} / ${totalFrames}`;
        document.getElementById('export-status-text').textContent = `Processando segundo ${currentTime.toFixed(1)}s de ${totalDuration.toFixed(1)}s...`;
      },
      onComplete: (mp4Blob) => {
        SlideshowEngine.resolution = '1080p';
        SlideshowEngine.updateResolution();

        AppState.exportedBlob = mp4Blob;
        if (AppState.exportedBlobUrl) URL.revokeObjectURL(AppState.exportedBlobUrl);
        AppState.exportedBlobUrl = URL.createObjectURL(mp4Blob);

        videoPlayerElem.src = AppState.exportedBlobUrl;
        exportLiveBox.classList.add('hidden');
        exportPlayerBox.classList.remove('hidden');

        document.getElementById('export-modal-title').textContent = 'Seu Vídeo MP4 Está Pronto!';
        document.getElementById('export-status-text').textContent = 'Vídeo gerado com sucesso!';
        document.getElementById('export-percent-text').textContent = '100%';

        btnDownloadMp4Now.classList.remove('hidden');
        btnDownloadWebmNow.classList.remove('hidden');
        btnPlayExportedVideo.classList.remove('hidden');
        btnCancelExport.classList.add('hidden');
        showToast(`Vídeo MP4 ${res} pronto para assistir ou baixar!`, 'success');

        VideoExporter.downloadVideoBlob(mp4Blob, cleanFilename, 'mp4');
      },
      onError: (err) => {
        SlideshowEngine.resolution = '1080p';
        SlideshowEngine.updateResolution();
        showToast('Erro ao exportar vídeo: ' + err.message, 'danger');
        modalExport.classList.add('hidden');
      }
    });
  });

  btnPlayExportedVideo.addEventListener('click', () => {
    exportLiveBox.classList.add('hidden');
    exportPlayerBox.classList.remove('hidden');
    videoPlayerElem.play();
  });

  btnDownloadMp4Now.addEventListener('click', () => {
    if (AppState.exportedBlob) {
      const res = AppState.exportResolution || '4K';
      const titleForName = AppState.introTitle || 'Video';
      const sanitizedTitle = VideoExporter.sanitizeFilename(titleForName);
      const cleanFilename = `GNSlides_${res}_${sanitizedTitle}.mp4`;
      VideoExporter.downloadVideoBlob(AppState.exportedBlob, cleanFilename, 'mp4');
    }
  });

  btnDownloadWebmNow.addEventListener('click', () => {
    if (AppState.exportedBlob) {
      const res = AppState.exportResolution || '4K';
      const titleForName = AppState.introTitle || 'Video';
      const sanitizedTitle = VideoExporter.sanitizeFilename(titleForName);
      const cleanFilename = `GNSlides_${res}_${sanitizedTitle}.webm`;
      VideoExporter.downloadVideoBlob(AppState.exportedBlob, cleanFilename, 'webm');
    }
  });

  btnCancelExport.addEventListener('click', () => {
    VideoExporter.cancelExport(AudioEngine);
    SlideshowEngine.resolution = '1080p';
    SlideshowEngine.updateResolution();
    modalExport.classList.add('hidden');
    showToast('Exportação de vídeo cancelada.', 'info');
  });

  // --- SHARE MODAL ---
  document.getElementById('btn-share-project').addEventListener('click', () => {
    document.getElementById('modal-share').classList.remove('hidden');
  });

  document.getElementById('btn-copy-share-link').addEventListener('click', () => {
    navigator.clipboard.writeText(document.getElementById('share-link-input').value);
    showToast('Link do projeto copiado!', 'success');
  });

  document.getElementById('btn-share-whatsapp').addEventListener('click', () => {
    const text = encodeURIComponent(`Confira este slideshow em 4K que criei no GN SLIDES PRO: ${AppState.introTitle}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  });

  // --- UTILITY FUNCTIONS ---
  function updateMusicUI(music) {
    const card = document.getElementById('active-music-card');
    const emptyState = document.getElementById('music-empty-state');
    const trackBadge = document.getElementById('audio-track-name');
    const musicBadge = document.getElementById('music-count-badge');

    if (music && isFullFeatureUnlocked()) {
      card.classList.remove('hidden');
      emptyState.classList.add('hidden');
      document.getElementById('music-title-text').textContent = music.name;
      document.getElementById('music-duration-text').textContent = formatTime(music.duration);
      trackBadge.textContent = music.name;
      musicBadge.textContent = '1';
    } else {
      card.classList.add('hidden');
      emptyState.classList.remove('hidden');
      if (!isFullFeatureUnlocked()) {
        emptyState.innerHTML = `
          <i class="fa-solid fa-lock text-orange" style="font-size:32px;"></i>
          <p style="font-weight:800; color:var(--text-main);">Músicas Bloqueadas no Modo Visitante</p>
          <span>Visitantes criam slideshows apenas com fotos. Para colocar músicas, ative sua licença PRO!</span>
        `;
      } else {
        emptyState.innerHTML = `
          <i class="fa-solid fa-headphones text-cyan"></i>
          <p>Nenhuma música de fundo adicionada.</p>
          <span>O vídeo será gerado em silêncio ou com o som que você escolher.</span>
        `;
      }
      trackBadge.textContent = 'Nenhuma Música';
      musicBadge.textContent = '0';
    }
  }

  function updateTimeDisplay(current, total) {
    document.getElementById('time-current').textContent = formatTime(current);
    document.getElementById('time-total').textContent = formatTime(total);
  }

  function updateScrubberProgress(current, total) {
    if (total <= 0) return;
    const pct = (current / total) * 100;
    videoScrubber.value = pct;
    document.getElementById('scrubber-fill').style.width = `${pct}%`;
    document.getElementById('audio-fill-progress').style.width = `${pct}%`;
  }

  function formatTime(sec) {
    if (isNaN(sec) || sec === null) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconClass = 'fa-circle-info';
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'warning') iconClass = 'fa-triangle-exclamation';
    if (type === 'danger') iconClass = 'fa-circle-xmark';

    toast.innerHTML = `<i class="fa-solid ${iconClass}"></i> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // --- PWA SERVICE WORKER & APP INSTALL PROMPT HANDLER ---
  let deferredPWAInstallPrompt = null;
  const btnInstallPWA = document.getElementById('btn-install-pwa');
  const modalInstallPWA = document.getElementById('modal-install-pwa');
  const btnTriggerPWAInstall = document.getElementById('btn-trigger-pwa-install');
  const pwaInstructionsText = document.getElementById('pwa-instructions-text');

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').then((reg) => {
        console.log('PWA ServiceWorker registrado com sucesso:', reg.scope);
      }).catch((err) => {
        console.log('PWA ServiceWorker erro de registro:', err);
      });
    });
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPWAInstallPrompt = e;
    if (btnInstallPWA) btnInstallPWA.classList.remove('hidden');
    
    // Auto show install prompt modal once for new visitors after 4 seconds
    if (!sessionStorage.getItem('gn_slides_pwa_prompted')) {
      sessionStorage.setItem('gn_slides_pwa_prompted', 'true');
      setTimeout(() => {
        openPWAInstallModal();
      }, 4000);
    }
  });

  if (btnInstallPWA) {
    btnInstallPWA.addEventListener('click', () => {
      openPWAInstallModal();
    });
  }

  function openPWAInstallModal() {
    const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isiOS && pwaInstructionsText) {
      pwaInstructionsText.innerHTML = 'No iPhone (Safari): toque no botão <strong>Compartilhar <i class="fa-solid fa-share-from-square"></i></strong> no rodapé do Safari e selecione <strong>"Adicionar à Tela de Início"</strong>.';
    } else if (pwaInstructionsText) {
      pwaInstructionsText.innerHTML = 'Clique no botão <strong>"Instalar Aplicativo Agora"</strong> abaixo ou toque nos 3 pontos do Chrome e selecione <strong>"Instalar aplicativo / Adicionar à Tela Inicial"</strong>.';
    }
    if (modalInstallPWA) modalInstallPWA.classList.remove('hidden');
  }

  if (btnTriggerPWAInstall) {
    btnTriggerPWAInstall.addEventListener('click', async () => {
      if (deferredPWAInstallPrompt) {
        deferredPWAInstallPrompt.prompt();
        const choice = await deferredPWAInstallPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          showToast('Aplicativo instalado com sucesso!', 'success');
        }
        deferredPWAInstallPrompt = null;
        if (modalInstallPWA) modalInstallPWA.classList.add('hidden');
      } else {
        openPWAInstallModal();
      }
    });
  }
});
