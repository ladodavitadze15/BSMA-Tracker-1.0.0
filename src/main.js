const { app, BrowserWindow, ipcMain, safeStorage, Notification, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const api = require('./api');
const { SyllabusService } = require('./syllabus');

const LEGACY_SESSION_FILE = path.join(app.getPath('userData'), 'session.json');
const VAULT_FILE = path.join(app.getPath('userData'), 'auth-vault.json');
const syllabusService = new SyllabusService(path.join(app.getPath('userData'), 'syllabus-cache'));
let currentToken = null;
let currentUsername = null;
let currentPassword = null;
let rememberCurrentSession = false;
let reauthPromise = null;
let mainWindow = null;

function encryptSecret(secret) {
  if (!secret || !safeStorage.isEncryptionAvailable()) return null;
  return safeStorage.encryptString(String(secret)).toString('base64');
}

function decryptSecret(b64) {
  if (!b64 || !safeStorage.isEncryptionAvailable()) return null;
  try {
    return safeStorage.decryptString(Buffer.from(b64, 'base64'));
  } catch {
    return null;
  }
}

function readVault() {
  try {
    if (fs.existsSync(VAULT_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(VAULT_FILE, 'utf8'));
      return {
        activeUsername: parsed?.activeUsername || null,
        accounts: parsed?.accounts && typeof parsed.accounts === 'object' ? parsed.accounts : {},
      };
    }

    // One-time migration from legacy single-account session.json
    if (fs.existsSync(LEGACY_SESSION_FILE)) {
      const legacy = JSON.parse(fs.readFileSync(LEGACY_SESSION_FILE, 'utf8'));
      const uname = String(legacy?.username || '').trim();
      const migrated = { activeUsername: uname || null, accounts: {} };
      if (uname) {
        migrated.accounts[uname] = {
          username: uname,
          studentId: uname,
          fullName: '',
          programName: '',
          lastLoginAt: new Date().toISOString(),
          encryptedToken: legacy.encryptedToken || null,
          encryptedPassword: legacy.encryptedPassword || null,
          tokenFallback: legacy.token || null,
        };
      }
      writeVault(migrated);
      try {
        fs.unlinkSync(LEGACY_SESSION_FILE);
      } catch {
        // Ignore cleanup errors
      }
      return migrated;
    }
  } catch (err) {
    console.error('Failed to read auth vault:', err);
  }
  return { activeUsername: null, accounts: {} };
}

function writeVault(vault) {
  try {
    fs.writeFileSync(VAULT_FILE, JSON.stringify(vault, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write auth vault:', err);
  }
}

function extractEntrySecrets(entry) {
  if (!entry) return { token: null, password: null };
  const token = entry.encryptedToken
    ? decryptSecret(entry.encryptedToken)
    : (entry.tokenFallback || null);
  const password = entry.encryptedPassword ? decryptSecret(entry.encryptedPassword) : null;
  return { token, password };
}

function listSavedAccounts(vaultArg = null) {
  const vault = vaultArg || readVault();
  return Object.values(vault.accounts || {})
    .map((acc) => ({
      username: acc.username,
      studentId: acc.studentId || acc.username,
      fullName: acc.fullName || '',
      programName: acc.programName || '',
      lastLoginAt: acc.lastLoginAt || '',
      hasSavedCredentials: Boolean(acc.encryptedToken || acc.encryptedPassword || acc.tokenFallback),
    }))
    .sort((a, b) => String(b.lastLoginAt).localeCompare(String(a.lastLoginAt)));
}

function upsertAccountInVault(username, { token, password, fullName, studentId, programName, setActive = true } = {}) {
  const clean = String(username || '').trim();
  if (!clean) return;
  const vault = readVault();
  const prev = vault.accounts[clean] || { username: clean, studentId: clean, fullName: '', programName: '' };
  const next = {
    ...prev,
    username: clean,
    studentId: studentId || prev.studentId || clean,
    fullName: fullName !== undefined ? fullName : prev.fullName,
    programName: programName !== undefined ? programName : prev.programName,
    lastLoginAt: new Date().toISOString(),
  };

  if (token !== undefined) {
    if (safeStorage.isEncryptionAvailable()) {
      next.encryptedToken = token ? encryptSecret(token) : null;
      delete next.tokenFallback;
    } else {
      next.tokenFallback = token || null;
    }
  }
  if (password !== undefined) {
    if (safeStorage.isEncryptionAvailable()) {
      next.encryptedPassword = password ? encryptSecret(password) : null;
    }
  }

  vault.accounts[clean] = next;
  if (setActive) {
    vault.activeUsername = clean;
  }
  writeVault(vault);
}

function clearRuntimeSession() {
  currentToken = null;
  currentUsername = null;
  currentPassword = null;
  rememberCurrentSession = false;
}

function clearActiveSessionInVault({ removeAccount = false } = {}) {
  const targetUser = currentUsername;
  clearRuntimeSession();
  const vault = readVault();
  vault.activeUsername = null;
  if (removeAccount && targetUser && vault.accounts[targetUser]) {
    delete vault.accounts[targetUser];
  } else if (targetUser && vault.accounts[targetUser] && !removeAccount) {
    // Keep account metadata/credentials if user chose Switch Account
  }
  writeVault(vault);
  return vault;
}

function getAssetPath(fileName) {
  if (app.isPackaged) {
    const unpacked = path.join(process.resourcesPath, 'app.asar.unpacked', 'assets', fileName);
    if (fs.existsSync(unpacked)) return unpacked;
  }
  return path.join(__dirname, '..', 'assets', fileName);
}

function createWindow() {
  const iconFile = process.platform === 'win32' ? 'icon.ico' : 'icon.png';
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 660,
    show: false,
    backgroundColor: '#0b0f17',
    autoHideMenuBar: true,
    title: 'BSMA Student Tracker',
    icon: getAssetPath(iconFile),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
      backgroundThrottling: true,
    },
  });

  mainWindow.once('ready-to-show', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

const gotInstanceLock = app.requestSingleInstanceLock();
if (!gotInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      createWindow();
      return;
    }
    if (mainWindow.isMinimized()) mainWindow.restore();
    if (!mainWindow.isVisible()) mainWindow.show();
    mainWindow.focus();
  });
}

app.whenReady().then(() => {
  if (!gotInstanceLock) return;
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.bsma.studenttracker');
  }
  const vault = readVault();
  if (vault.activeUsername && vault.accounts[vault.activeUsername]) {
    const entry = vault.accounts[vault.activeUsername];
    const { token, password } = extractEntrySecrets(entry);
    if (token || password) {
      currentToken = token;
      currentUsername = entry.username;
      currentPassword = password;
      rememberCurrentSession = true;
    }
  }
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

async function refreshSessionToken() {
  if (!currentUsername || !currentPassword) {
    const err = new Error('Session expired. Please sign in again.');
    err.code = 'TOKEN_EXPIRED';
    throw err;
  }
  if (!reauthPromise) {
    const user = currentUsername;
    const pass = currentPassword;
    reauthPromise = (async () => {
      const re = await api.login(user, pass);
      if (re.result === 'yes' && re.token) {
        currentToken = re.token;
        if (rememberCurrentSession) {
          upsertAccountInVault(user, { token: re.token, password: pass, setActive: true });
        }
        return re.token;
      }
      const expErr = new Error('Session expired. Please sign in again.');
      expErr.code = 'TOKEN_EXPIRED';
      throw expErr;
    })().finally(() => {
      reauthPromise = null;
    });
  }
  return reauthPromise;
}

async function withAutoReauth(fn) {
  if (!currentToken && currentUsername && currentPassword) {
    await refreshSessionToken();
  }
  if (!currentToken) {
    const err = new Error('Not authenticated');
    err.code = 'NOT_AUTHENTICATED';
    throw err;
  }
  try {
    return await fn(currentToken);
  } catch (err) {
    if (err.code === 'TOKEN_EXPIRED') {
      if (currentUsername && currentPassword) {
        try {
          await refreshSessionToken();
          return await fn(currentToken);
        } catch {
          // Saved password may have changed or SMS may now be required
        }
      }
      const failedUser = currentUsername;
      clearActiveSessionInVault({ removeAccount: false });
      const vault = readVault();
      if (failedUser && vault.accounts[failedUser]) {
        delete vault.accounts[failedUser].encryptedToken;
        delete vault.accounts[failedUser].encryptedPassword;
        delete vault.accounts[failedUser].tokenFallback;
        writeVault(vault);
      }
    }
    throw err;
  }
}

ipcMain.handle('auth:getSession', () => {
  const vault = readVault();
  return {
    authenticated: Boolean(currentToken || (currentUsername && currentPassword)),
    username: currentUsername || '',
    accounts: listSavedAccounts(vault),
  };
});

ipcMain.handle('auth:login', async (_event, { username, password, smsCode, remember }) => {
  const cleanUser = String(username || '').trim();
  const rawPass = String(password || '');
  if (!cleanUser || !rawPass) {
    return { ok: false, result: 'no', message: 'Please enter both Student ID and password.' };
  }

  const res = await api.login(cleanUser, rawPass, smsCode);
  if (res.result === 'yes' && res.token) {
    currentToken = res.token;
    currentUsername = cleanUser;
    currentPassword = rawPass;
    rememberCurrentSession = Boolean(remember);

    if (rememberCurrentSession) {
      upsertAccountInVault(cleanUser, { token: res.token, password: rawPass, setActive: true });
    } else {
      const vault = readVault();
      vault.activeUsername = null;
      writeVault(vault);
    }
    return {
      ok: true,
      result: 'yes',
      username: cleanUser,
      accounts: listSavedAccounts(),
    };
  }
  if (res.result === 'sms') {
    return { ok: false, result: 'sms', smsTime: res.smsTime || null };
  }
  return {
    ok: false,
    result: res.result || 'no',
    message: res.message || 'Invalid student ID or password.',
  };
});

ipcMain.handle('auth:switchAccount', async (_event, { username }) => {
  const cleanUser = String(username || '').trim();
  const vault = readVault();
  const entry = vault.accounts[cleanUser];
  if (!entry) {
    return { ok: false, requiresPassword: true, message: 'Saved account not found.' };
  }

  const { token, password } = extractEntrySecrets(entry);
  if (!token && !password) {
    return { ok: false, requiresPassword: true, message: 'Saved credentials unavailable. Please enter password.' };
  }

  if (!token && password) {
    const res = await api.login(cleanUser, password);
    if (res.result === 'yes' && res.token) {
      currentToken = res.token;
      currentUsername = cleanUser;
      currentPassword = password;
      rememberCurrentSession = true;
      upsertAccountInVault(cleanUser, { token: res.token, password, setActive: true });
      return { ok: true, result: 'yes', username: cleanUser, accounts: listSavedAccounts() };
    }
    if (res.result === 'sms') {
      return { ok: false, result: 'sms', smsTime: res.smsTime || null, username: cleanUser };
    }
    return {
      ok: false,
      requiresPassword: true,
      message: res.message || 'Saved password expired or changed. Please sign in again.',
    };
  }

  currentToken = token;
  currentUsername = cleanUser;
  currentPassword = password;
  rememberCurrentSession = true;
  upsertAccountInVault(cleanUser, { setActive: true });
  return { ok: true, result: 'yes', username: cleanUser, accounts: listSavedAccounts() };
});

ipcMain.handle('auth:logout', (_event, payload = {}) => {
  const mode = payload?.mode === 'switch' ? 'switch' : 'signout';
  const vault = clearActiveSessionInVault({ removeAccount: mode !== 'switch' });
  return { ok: true, mode, accounts: listSavedAccounts(vault) };
});

ipcMain.handle('auth:forgetAccount', (_event, { username }) => {
  const cleanUser = String(username || '').trim();
  if (currentUsername === cleanUser) {
    clearRuntimeSession();
  }
  const vault = readVault();
  if (vault.activeUsername === cleanUser) {
    vault.activeUsername = null;
  }
  if (vault.accounts[cleanUser]) {
    delete vault.accounts[cleanUser];
  }
  writeVault(vault);
  return { ok: true, accounts: listSavedAccounts(vault) };
});

ipcMain.handle('portal:fetchAll', async () => {
  const data = await withAutoReauth((token) => api.getAllDashboardData(token));
  if (rememberCurrentSession && currentUsername) {
    const stu = data?.student?.student;
    const edu = data?.card?.edu;
    const prog = data?.student?.program;
    const fullName = stu
      ? `${stu.firstName || stu.name || ''} ${stu.lastName || ''}`.trim()
      : '';
    const programName = edu?.altSchoolName || edu?.programName || prog?.name || '';
    upsertAccountInVault(currentUsername, {
      fullName: fullName || undefined,
      studentId: stu?.id ? String(stu.id) : currentUsername,
      programName: programName || undefined,
      setActive: true,
    });
  }
  return {
    ...data,
    authUsername: currentUsername,
    savedAccounts: listSavedAccounts(),
  };
});

ipcMain.handle('portal:fetchSubjectDetails', async (_event, resultId) => {
  const res = await withAutoReauth((token) => api.getCardDetails(token, resultId));
  return res?.data || [];
});

ipcMain.handle('syllabus:getParsed', async (_event, { bookId, forceRefresh }) => {
  return withAutoReauth((token) => syllabusService.getParsedSyllabus(token, bookId, Boolean(forceRefresh)));
});

ipcMain.handle('syllabus:scanMany', async (_event, bookIds) => {
  const uniqueIds = Array.from(new Set((bookIds || []).filter(Boolean)));
  return withAutoReauth(async (token) => {
    const entries = await Promise.all(
      uniqueIds.map(async (bookId) => {
        try {
          const parsed = await syllabusService.getParsedSyllabus(token, bookId, false);
          return [bookId, parsed];
        } catch (err) {
          if (err.code === 'TOKEN_EXPIRED') throw err;
          return [bookId, { bookId, weeks: [], mainLiterature: [], extraLiterature: [], parseError: err.message }];
        }
      })
    );
    return Object.fromEntries(entries);
  });
});

ipcMain.handle('syllabus:download', async (_event, { bookId, suggestedName }) => {
  const safeBase = (suggestedName || `syllabus-${bookId}`).replace(/[<>:"/\\|?*]/g, '_');
  const defaultPath = path.join(app.getPath('downloads'), `${safeBase}.pdf`);
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath,
    filters: [{ name: 'PDF Documents', extensions: ['pdf'] }],
  });
  if (canceled || !filePath) return { saved: false, canceled: true };
  const result = await withAutoReauth((token) => syllabusService.downloadFile(token, bookId, filePath));
  return { saved: true, ...result };
});

ipcMain.handle('syllabus:openPdf', async (_event, bookId) => {
  const localPath = await withAutoReauth((token) => syllabusService.ensureLocalFile(token, bookId));
  const errStr = await shell.openPath(localPath);
  if (errStr) throw new Error(errStr);
  return { opened: true, filePath: localPath };
});

ipcMain.handle('theme:pickBackgroundImage', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Background Image',
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'] }],
  });
  if (canceled || !filePaths || !filePaths[0]) return { selected: false };
  const filePath = filePaths[0];
  const ext = path.extname(filePath).toLowerCase().replace('.', '') || 'png';
  const mime = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
  const b64 = fs.readFileSync(filePath).toString('base64');
  return { selected: true, dataUrl: `data:${mime};base64,${b64}`, fileName: path.basename(filePath) };
});

ipcMain.handle('notify:show', (_event, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({ title, body }).show();
  }
});
