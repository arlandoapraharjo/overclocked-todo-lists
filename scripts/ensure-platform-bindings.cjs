const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const platformKey = `${process.platform}-${process.arch}`;

const oxideMap = {
  'win32-x64': '@tailwindcss/oxide-win32-x64-msvc',
  'win32-arm64': '@tailwindcss/oxide-win32-arm64-msvc',
  'darwin-arm64': '@tailwindcss/oxide-darwin-arm64',
  'darwin-x64': '@tailwindcss/oxide-darwin-x64',
  'linux-x64': '@tailwindcss/oxide-linux-x64-gnu',
  'linux-arm64': '@tailwindcss/oxide-linux-arm64-gnu',
};

const lightningMap = {
  'win32-x64': 'lightningcss-win32-x64-msvc',
  'win32-arm64': 'lightningcss-win32-arm64-msvc',
  'darwin-arm64': 'lightningcss-darwin-arm64',
  'darwin-x64': 'lightningcss-darwin-x64',
  'linux-x64': 'lightningcss-linux-x64-gnu',
  'linux-arm64': 'lightningcss-linux-arm64-gnu',
};

function checkAndInstall() {
  const missing = [];

  const oxidePkg = oxideMap[platformKey];
  if (oxidePkg) {
    try {
      require.resolve(oxidePkg);
    } catch {
      missing.push(oxidePkg);
    }
  }

  const lightningPkg = lightningMap[platformKey];
  if (lightningPkg) {
    try {
      require.resolve(lightningPkg);
    } catch {
      missing.push(lightningPkg);
    }
  }

  if (missing.length > 0) {
    console.log(`\n[setup] Detected missing platform-specific native bindings for ${platformKey}:`);
    console.log(`[setup] Installing: ${missing.join(', ')}...`);
    try {
      execSync(`npm install ${missing.join(' ')} --no-save --include=optional`, {
        stdio: 'inherit',
        shell: true,
      });
      console.log(`[setup] Successfully installed native bindings for ${platformKey}.\n`);
    } catch (err) {
      console.warn(`[setup] Warning: could not auto-install native bindings:`, err.message);
    }
  } else {
    console.log(`[setup] Platform-specific native bindings verified for ${platformKey}.`);
  }
}

checkAndInstall();
