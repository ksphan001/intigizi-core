/**
 * switch-env.cjs  —  IntiGizi Core (Dapur)
 * Tool untuk berpindah antara lingkungan LOKAL dan DEPLOY (PRODUKSI) secara otomatis.
 * Membaca konfigurasi domain dari: ../intigizi.deploy.json
 */

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const target          = process.argv[2];
const customRootInput = process.argv[3];

if (target !== 'local' && target !== 'deploy') {
  console.log('\x1b[31m%s\x1b[0m', 'Error: Gunakan "local" atau "deploy".');
  process.exit(1);
}

// ── Baca konfigurasi terpusat ─────────────────────────────────────
const deployConfigPath = path.join(__dirname, '../intigizi.deploy.json');
let deployConfig = {};
if (fs.existsSync(deployConfigPath)) {
  deployConfig = JSON.parse(fs.readFileSync(deployConfigPath, 'utf8'));
} else {
  console.log('\x1b[33m%s\x1b[0m', '⚠ intigizi.deploy.json tidak ditemukan.');
}

if (target === 'deploy' && customRootInput) {
  const clean = customRootInput.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
  deployConfig.root_domain = clean;
  fs.writeFileSync(deployConfigPath, JSON.stringify(deployConfig, null, 2), 'utf8');
}

const rootDomain           = deployConfig.root_domain || 'intigizi.ksphan.id';
const services             = deployConfig.services    || {};
const deployApiUrl         = `https://${services.dapur_api?.subdomain    || 'api'}.${rootDomain}`;
const deploySupplierApiUrl = `https://${services.supplier_api?.subdomain || 'api-supplier'}.${rootDomain}`;
const localApiUrl          = services.dapur_api?.local_url    || 'http://intigizi-api.test';
const localSupplierApiUrl  = services.supplier_api?.local_url || 'http://intigizi-supplier-api.test';

// ── Path file ────────────────────────────────────────────────────
const apiEnvPath          = path.join(__dirname, '../intigizi-api/.env');
const supplierApiEnvPath  = path.join(__dirname, '../intigizi-supplier-api/.env');
const coreDevEnvPath      = path.join(__dirname, '.env.development');
const coreProdEnvPath     = path.join(__dirname, '.env.production');
const supplierDevEnvPath  = path.join(__dirname, '../intigizi-supplier-core/.env.development');
const supplierProdEnvPath = path.join(__dirname, '../intigizi-supplier-core/.env.production');

console.log('\x1b[36m%s\x1b[0m', `\nMode: ${target.toUpperCase()} | Domain: ${rootDomain}`);

// Fungsi untuk mengganti nilai env secara flat (selalu mencocokkan key=)
function replaceEnvValue(content, key, value) {
  const lines = content.split('\n');
  let found = false;
  const result = lines.map(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith(key + '=')) {
      found = true;
      return `${key}=${value}`;
    }
    return line;
  });
  if (!found) {
    result.push(`${key}=${value}`);
  }
  return result.join('\n');
}

function updateEnvFile(filePath, label, updates) {
  if (!fs.existsSync(filePath)) {
    console.log('\x1b[33m%s\x1b[0m', `⚠ ${label} tidak ditemukan. Dilewati.`);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  for (const { key, value } of updates) {
    content = replaceEnvValue(content, key, value);
  }
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('\x1b[32m%s\x1b[0m', `✔ ${label} diperbarui.`);
}

const isLocal = target === 'local';

// 1. Update intigizi-api/.env
updateEnvFile(apiEnvPath, 'intigizi-api/.env', [
  { key: 'APP_ENV',          value: isLocal ? '"development"' : '"production"' },
  { key: 'APP_URL',          value: isLocal ? localApiUrl : deployApiUrl },
  { key: 'SUPPLIER_API_URL', value: isLocal ? localSupplierApiUrl : deploySupplierApiUrl },
  { key: 'ALLOWED_ORIGINS',  value: isLocal ? `"http://localhost:5173,http://intigizi-core.test, *"` : `"https://${rootDomain},https://www.${rootDomain}, *"` }
]);

// 2. Update intigizi-supplier-api/.env
updateEnvFile(supplierApiEnvPath, 'intigizi-supplier-api/.env', [
  { key: 'APP_ENV',         value: isLocal ? '"development"' : '"production"' },
  { key: 'APP_URL',         value: isLocal ? localSupplierApiUrl : deploySupplierApiUrl },
  { key: 'ALLOWED_ORIGINS', value: isLocal ? `"http://localhost:5174,http://intigizi-supplier-core.test,http://intigizi-supplier-api.test, *"` : `"${deploySupplierApiUrl},https://www.${services.supplier_frontend?.subdomain || 'supplier'}.${rootDomain}, *"` }
]);

// 3. Update intigizi-core env files
const coreEnvFiles = [
  { path: coreDevEnvPath,  label: 'intigizi-core .env.development' },
  { path: coreProdEnvPath, label: 'intigizi-core .env.production'  }
];
for (const f of coreEnvFiles) {
  updateEnvFile(f.path, f.label, [
    { key: 'VITE_API_URL',          value: isLocal ? `${localApiUrl}/app` : `${deployApiUrl}/app` },
    { key: 'VITE_SUPPLIER_API_URL', value: isLocal ? `${localSupplierApiUrl}/app` : `${deploySupplierApiUrl}/app` }
  ]);
}

// 4. Update intigizi-supplier-core env files
const supplierCoreEnvFiles = [
  { path: supplierDevEnvPath,  label: 'intigizi-supplier-core .env.development' },
  { path: supplierProdEnvPath, label: 'intigizi-supplier-core .env.production'  }
];
for (const f of supplierCoreEnvFiles) {
  updateEnvFile(f.path, f.label, [
    { key: 'VITE_API_URL', value: isLocal ? `${localSupplierApiUrl}/app` : `${deploySupplierApiUrl}/app` }
  ]);
}

// 5. Build
console.log('\n\x1b[33m%s\x1b[0m', `[Build 1/2] Dapur IntiGizi...`);
try {
  execSync('npm run build', { stdio: 'inherit', shell: true });
} catch { console.log('Build Dapur gagal.'); }

const supplierCorePath = path.join(__dirname, '../intigizi-supplier-core');
if (fs.existsSync(path.join(supplierCorePath, 'package.json'))) {
  console.log('\n\x1b[33m%s\x1b[0m', `[Build 2/2] Sentra IntiGizi...`);
  try {
    execSync('npm run build', { cwd: supplierCorePath, stdio: 'inherit', shell: true });
  } catch { console.log('Build Sentra gagal.'); }
}

console.log('\n\x1b[42m\x1b[30m%s\x1b[0m', ` SELESAI — MODE: ${target.toUpperCase()} `);
