/* ==========================================================================
   GREENSLEDE STUDIO PRO - PROJECT STORAGE & PERSISTENCE ENGINE
   IndexedDB & LocalStorage integration for saving, restoring, exporting JSON
   ========================================================================== */

window.ProjectStorage = {
  dbName: 'GreenSlideStudioDB',
  dbVersion: 1,
  storeName: 'projects',
  db: null,

  init: function() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };

      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(this.db);
      };

      request.onerror = (e) => {
        console.error('IndexedDB Error:', e);
        reject(e);
      };
    });
  },

  // Save project object into IndexedDB
  saveProject: async function(project) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      project.updatedAt = new Date().toISOString();
      const req = store.put(project);

      req.onsuccess = () => resolve(project);
      req.onerror = (err) => reject(err);
    });
  },

  // Get list of all saved projects
  getAllProjects: async function() {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = (err) => reject(err);
    });
  },

  // Get single project by ID
  getProjectById: async function(id) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const req = store.get(id);

      req.onsuccess = () => resolve(req.result);
      req.onerror = (err) => reject(err);
    });
  },

  // Delete project by ID
  deleteProject: async function(id) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const req = store.delete(id);

      req.onsuccess = () => resolve(true);
      req.onerror = (err) => reject(err);
    });
  },

  // Download project structure as a JSON file
  exportProjectJSON: function(project) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(project, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `GreenSlide_${project.title.replace(/\s+/g, '_')}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },

  // Read imported JSON file
  importProjectJSON: function(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const project = JSON.parse(e.target.result);
          resolve(project);
        } catch (err) {
          reject(new Error('Arquivo JSON inválido ou corrompido.'));
        }
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo.'));
      reader.readAsText(file);
    });
  }
};
