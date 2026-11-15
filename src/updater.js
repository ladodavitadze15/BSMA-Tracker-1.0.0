const { app, shell } = require('electron');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const REPO_OWNER = 'ladodavitadze15';
const REPO_NAME = 'BSMA-Tracker-1.0.0';
const RELEASES_API = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`;
const REPO_URL = `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases`;

function parseSemver(versionStr) {
  const clean = String(versionStr || '')
    .trim()
    .replace(/^v/i, '')
    .split('-')[0];
  const parts = clean.split('.').map((n) => parseInt(n, 10));
  return [
    Number.isFinite(parts[0]) ? parts[0] : 0,
    Number.isFinite(parts[1]) ? parts[1] : 0,
    Number.isFinite(parts[2]) ? parts[2] : 0,
  ];
}

function isNewerVersion(candidate, current) {
  const a = parseSemver(candidate);
  const b = parseSemver(current);
  for (let i = 0; i < 3; i++) {
    if (a[i] > b[i]) return true;
    if (a[i] < b[i]) return false;
  }
  return false;
}

function isTrustedGitHubUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    if (u.protocol !== 'https:') return false;
    const host = u.hostname.toLowerCase();
    return host === 'github.com' || host.endsWith('.githubusercontent.com');
  } catch {
    return false;
  }
}

function pickWindowsAsset(assets = []) {
  const exeAssets = assets.filter((a) => {
    const name = String(a?.name || '').toLowerCase();
    return name.endsWith('.exe') && !name.includes('uninstaller');
  });
  if (!exeAssets.length) return null;

  const isPortableRuntime = Boolean(process.env.PORTABLE_EXECUTABLE_FILE);
  if (isPortableRuntime) {
    return (
      exeAssets.find((a) => !String(a.name).toLowerCase().includes('setup')) ||
      exeAssets[0]
    );
  }
  return (
    exeAssets.find((a) => String(a.name).toLowerCase().includes('setup')) ||
    exeAssets[0]
  );
}

async function checkForUpdates() {
  const currentVersion = app.getVersion();
  let res;
  try {
    res = await fetch(RELEASES_API, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': `BSMA-Student-Tracker/${currentVersion}`,
      },
    });
  } catch {
    throw new Error('Could not reach GitHub to check for updates.');
  }

  if (res.status === 404) {
    return {
      status: 'up-to-date',
      currentVersion,
      latestVersion: currentVersion,
      releaseUrl: REPO_URL,
      notes: '',
    };
  }

  if (!res.ok) {
    throw new Error(`Update check failed (HTTP ${res.status}).`);
  }

  const release = await res.json();
  const latestTag = String(release?.tag_name || release?.name || currentVersion).replace(/^v/i, '');
  const updateAvailable = isNewerVersion(latestTag, currentVersion);
  const asset = pickWindowsAsset(release?.assets || []);

  return {
    status: updateAvailable ? 'available' : 'up-to-date',
    currentVersion,
    latestVersion: latestTag,
    releaseName: release?.name || `v${latestTag}`,
    notes: String(release?.body || '').trim(),
    releaseUrl: isTrustedGitHubUrl(release?.html_url) ? release.html_url : REPO_URL,
    downloadUrl: asset && isTrustedGitHubUrl(asset.browser_download_url) ? asset.browser_download_url : null,
    assetName: asset?.name || null,
    assetSize: Number(asset?.size || 0),
  };
}

async function downloadAndInstallUpdate({ downloadUrl, assetName, releaseUrl }, onProgress) {
  if (!downloadUrl) {
    const safePage = isTrustedGitHubUrl(releaseUrl) ? releaseUrl : REPO_URL;
    await shell.openExternal(safePage);
    return { started: false, openedBrowser: true };
  }

  if (!isTrustedGitHubUrl(downloadUrl)) {
    throw new Error('Untrusted update download URL.');
  }

  const safeName = String(assetName || 'BSMA-Student-Tracker-Update.exe').replace(/[<>:"/\\|?*]/g, '_');
  const destPath = path.join(app.getPath('temp'), `bsma-update-${Date.now()}-${safeName}`);

  const res = await fetch(downloadUrl, {
    headers: {
      'User-Agent': `BSMA-Student-Tracker/${app.getVersion()}`,
    },
  });
  if (!res.ok || !res.body) {
    throw new Error(`Failed to download update (HTTP ${res.status}).`);
  }

  const totalBytes = Number(res.headers.get('content-length') || 0);
  let downloadedBytes = 0;
  const writer = fs.createWriteStream(destPath);
  const reader = res.body.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value && value.length) {
        downloadedBytes += value.length;
        await new Promise((resolve, reject) => {
          writer.write(Buffer.from(value), (err) => (err ? reject(err) : resolve()));
        });
        if (typeof onProgress === 'function') {
          const percent = totalBytes > 0 ? Math.min(100, Math.round((downloadedBytes / totalBytes) * 100)) : null;
          onProgress({ percent, downloadedBytes, totalBytes });
        }
      }
    }
    await new Promise((resolve, reject) => {
      writer.end((err) => (err ? reject(err) : resolve()));
    });
  } catch (err) {
    writer.destroy();
    try {
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
    } catch {
      // Ignore cleanup error
    }
    throw err;
  }

  const stat = fs.statSync(destPath);
  if (stat.size < 1024 * 100) {
    throw new Error('Downloaded update file is incomplete.');
  }

  const child = spawn(destPath, [], {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();

  setTimeout(() => {
    app.quit();
  }, 450);

  return { started: true, filePath: destPath };
}

module.exports = {
  parseSemver,
  isNewerVersion,
  checkForUpdates,
  downloadAndInstallUpdate,
  REPO_URL,
};
