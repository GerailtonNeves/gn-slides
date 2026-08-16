/* ==========================================================================
   GN SLIDES PRO 4K - USER AUTHENTICATION & ACCOUNT MANAGEMENT SYSTEM
   Client-side account registration, secure session tokens, login verification,
   account profile management & seamless integration with LicenseSystem.
   ========================================================================== */

const AuthSystem = {
  USERS_STORAGE_KEY: 'gn_slides_pro_registered_users',
  SESSION_STORAGE_KEY: 'gn_slides_pro_current_session',

  currentUser: null,

  init: function() {
    this.checkCurrentSession();
  },

  getRegisteredUsers: function() {
    try {
      const raw = localStorage.getItem(this.USERS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  saveRegisteredUsers: function(users) {
    localStorage.setItem(this.USERS_STORAGE_KEY, JSON.stringify(users));
  },

  checkCurrentSession: function() {
    try {
      const rawSession = localStorage.getItem(this.SESSION_STORAGE_KEY);
      if (rawSession) {
        const session = JSON.parse(rawSession);
        if (session && session.email) {
          const users = this.getRegisteredUsers();
          const found = users.find(u => u.email.toLowerCase() === session.email.toLowerCase());
          if (found) {
            this.currentUser = found;
            return true;
          }
        }
      }
    } catch (e) {
      console.log('Error checking session', e);
    }
    this.currentUser = null;
    return false;
  },

  registerUser: function(name, email, password) {
    if (!name || !email || !password) {
      return { success: false, message: 'Preencha todos os campos obrigatórios.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.includes('@') || cleanEmail.length < 5) {
      return { success: false, message: 'Digite um e-mail válido.' };
    }

    if (password.length < 4) {
      return { success: false, message: 'A senha deve ter pelo menos 4 caracteres.' };
    }

    const users = this.getRegisteredUsers();
    const existing = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return { success: false, message: 'Este e-mail já está cadastrado. Faça login na sua conta.' };
    }

    const newUser = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      name: name.trim(),
      email: cleanEmail,
      password: password, // client-side auth store
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    this.saveRegisteredUsers(users);
    this.createSession(newUser);

    return { success: true, message: 'Conta criada com sucesso! Seja bem-vindo ao GN SLIDES PRO.', user: newUser };
  },

  loginUser: function(email, password) {
    if (!email || !password) {
      return { success: false, message: 'Digite seu e-mail e sua senha.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    const users = this.getRegisteredUsers();
    const found = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!found) {
      return { success: false, message: 'Conta não encontrada. Verifique o e-mail ou crie uma nova conta.' };
    }

    if (found.password !== password) {
      return { success: false, message: 'Senha incorreta. Tente novamente.' };
    }

    this.createSession(found);
    return { success: true, message: `Bem-vindo de volta, ${found.name}!`, user: found };
  },

  createSession: function(user) {
    this.currentUser = user;
    const session = {
      userId: user.id,
      name: user.name,
      email: user.email,
      loginTime: new Date().toISOString()
    };
    localStorage.setItem(this.SESSION_STORAGE_KEY, JSON.stringify(session));
  },

  logout: function() {
    localStorage.removeItem(this.SESSION_STORAGE_KEY);
    this.currentUser = null;
  }
};

window.AuthSystem = AuthSystem;
