/**
 * switch-env.cjs
 * Tool untuk berpindah antara lingkungan LOKAL dan DEPLOY (PRODUKSI) secara otomatis.
 * 
 * Penggunaan:
 *   node switch-env.cjs local                   -> Beralih ke konfigurasi lokal
 *   node switch-env.cjs deploy                  -> Beralih ke konfigurasi produksi/deploy default & jalankan build
 *   node switch-env.cjs deploy [custom-domain]  -> Beralih ke konfigurasi produksi dengan domain API kustom & jalankan build
 * 
 * Contoh:
 *   node switch-env.cjs deploy api.custom.com
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const target = process.argv[2];
let customDomainInput = process.argv[3];

if (target !== 'local' && target !== 'deploy') {
  console.log('\x1b[31m%s\x1b[0m', 'Error: Argumen tidak valid. Gunakan "local" atau "deploy".');
  console.log('Contoh: node switch-env.cjs local');
  process.exit(1);
}

const apiEnvPath          = path.join(__dirname, '../intigizi-api/.env');
const supplierApiEnvPath  = path.join(__dirname, '../intigizi-supplier-api/.env');
const coreDevEnvPath      = path.join(__dirname, '.env.development');
const coreProdEnvPath     = path.join(__dirname, '.env.production');
const supplierDevEnvPath  = path.join(__dirname, '../intigizi-supplier-core/.env.development');
const supplierProdEnvPath = path.join(__dirname, '../intigizi-supplier-core/.env.production');

// Konfigurasi Default Deploy
let deployApiUrl          = 'https://api.intigizi.ksphan.id';
let deployOriginDomain    = 'intigizi.ksphan.id';
let deploySupplierApiUrl  = 'https://api-supplier.intigizi.ksphan.id';
let deploySupplierOrigin  = 'supplier.intigizi.ksphan.id';

// Jika ada kustom domain dari user, bersihkan dan pasang
if (target === 'deploy' && customDomainInput) {
  // Hapus http://, https://, trailing slash
  let cleanDomain = customDomainInput.trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '');
  deployApiUrl = `https://${cleanDomain}`;
  deployOriginDomain = cleanDomain;
  console.log('\x1b[35m%s\x1b[0m', `Menggunakan domain API kustom untuk deploy: ${deployApiUrl}`);
  // Derivasikan domain supplier dari domain utama jika tidak diberikan terpisah
  deploySupplierApiUrl = `https://api-supplier.${cleanDomain.replace(/^api\./, '')}`;
  deploySupplierOrigin = `supplier.${cleanDomain.replace(/^api\./, '')}`;
}

console.log('\x1b[36m%s\x1b[0m', `Memulai proses perpindahan konfigurasi ke: ${target.toUpperCase()}...\n`);

try {
  // 1. Modifikasi .env pada intigizi-api
  if (fs.existsSync(apiEnvPath)) {
    let apiEnvContent = fs.readFileSync(apiEnvPath, 'utf8');

    if (target === 'local') {
      // Aktifkan lokal
      apiEnvContent = apiEnvContent.replace(/#\s*(APP_ENV="development")/g, '$1');
      apiEnvContent = apiEnvContent.replace(/#\s*(APP_URL=http:\/\/intigizi-api\.test)/g, '$1');
      apiEnvContent = apiEnvContent.replace(/#\s*(DB_HOST="localhost")/g, '$1');
      apiEnvContent = apiEnvContent.replace(/#\s*(DB_USER="root")/g, '$1');
      apiEnvContent = apiEnvContent.replace(/#\s*(DB_PASS="")/g, '$1');
      apiEnvContent = apiEnvContent.replace(/#\s*(DB_NAME="dbintigizi")/g, '$1');
      apiEnvContent = apiEnvContent.replace(/#\s*(ALLOWED_ORIGINS="[^"]*local[^"]*")/g, '$1');

      // Matikan deploy (cari baris deploy yang aktif saat ini dan matikan)
      apiEnvContent = apiEnvContent.replace(/^(?!\s*#)\s*(APP_ENV="production")/gm, '# $1');
      apiEnvContent = apiEnvContent.replace(/^(?!\s*#)\s*(APP_URL=https:\/\/[^\s\n#]+)/gm, '# $1');
      apiEnvContent = apiEnvContent.replace(/^(?!\s*#)\s*(DB_HOST="[^\s\n#]+")/gm, '# $1');
      apiEnvContent = apiEnvContent.replace(/^(?!\s*#)\s*(DB_USER="[^\s\n#]+")/gm, '# $1');
      apiEnvContent = apiEnvContent.replace(/^(?!\s*#)\s*(DB_PASS="[^\s\n#]*")/gm, '# $1');
      apiEnvContent = apiEnvContent.replace(/^(?!\s*#)\s*(DB_NAME="[^\s\n#]+")/gm, '# $1');
      apiEnvContent = apiEnvContent.replace(/^(?!\s*#)\s*(ALLOWED_ORIGINS="https:\/\/[^\s\n#]+)/gm, '# $1');
    } else {
      // Aktifkan deploy dengan domain target
      
      // Update nilai APP_URL dan ALLOWED_ORIGINS di bagian DEPLOY (aktif atau non-aktif)
      // Cari dan ganti pattern APP_URL untuk produksi
      const appUrlRegex = /#?\s*(APP_URL=)https:\/\/[^\s\n#]+/g;
      if (appUrlRegex.test(apiEnvContent)) {
        apiEnvContent = apiEnvContent.replace(appUrlRegex, `$1${deployApiUrl}`);
      } else {
        apiEnvContent = apiEnvContent.replace(/#?\s*(APP_URL=https:\/\/api\.intigizi\.ksphan\.id)/g, `APP_URL=${deployApiUrl}`);
      }

      // Cari dan ganti pattern ALLOWED_ORIGINS untuk produksi
      const allowedRegex = /#?\s*(ALLOWED_ORIGINS="https:\/\/)[^\s\n#]+/g;
      if (allowedRegex.test(apiEnvContent)) {
        apiEnvContent = apiEnvContent.replace(allowedRegex, `$1${deployOriginDomain},https://www.${deployOriginDomain}, *"`);
      } else {
        apiEnvContent = apiEnvContent.replace(/#?\s*(ALLOWED_ORIGINS="https:\/\/intigizi\.ksphan\.id[^"]*")/g, `ALLOWED_ORIGINS="${deployApiUrl},https://www.${deployOriginDomain}, *"`);
      }

      // Aktifkan baris-baris deploy
      apiEnvContent = apiEnvContent.replace(/#\s*(APP_ENV="production")/g, '$1');
      apiEnvContent = apiEnvContent.replace(/#\s*(APP_URL=https:\/\/[^\s\n#]+)/g, '$1');
      apiEnvContent = apiEnvContent.replace(/#\s*(DB_HOST="[^\s\n#]+")/g, '$1');
      apiEnvContent = apiEnvContent.replace(/#\s*(DB_USER="[^\s\n#]+")/g, '$1');
      apiEnvContent = apiEnvContent.replace(/#\s*(DB_PASS="[^\s\n#]*")/g, '$1');
      apiEnvContent = apiEnvContent.replace(/#\s*(DB_NAME="[^\s\n#]+")/g, '$1');
      apiEnvContent = apiEnvContent.replace(/#\s*(ALLOWED_ORIGINS="https:\/\/[^\s\n#]+)/g, '$1');

      // Matikan lokal
      apiEnvContent = apiEnvContent.replace(/^(?!\s*#)\s*(APP_ENV="development")/gm, '# $1');
      apiEnvContent = apiEnvContent.replace(/^(?!\s*#)\s*(APP_URL=http:\/\/intigizi-api\.test)/gm, '# $1');
      apiEnvContent = apiEnvContent.replace(/^(?!\s*#)\s*(DB_HOST="localhost")/gm, '# $1');
      apiEnvContent = apiEnvContent.replace(/^(?!\s*#)\s*(DB_USER="root")/gm, '# $1');
      apiEnvContent = apiEnvContent.replace(/^(?!\s*#)\s*(DB_PASS="")/gm, '# $1');
      apiEnvContent = apiEnvContent.replace(/^(?!\s*#)\s*(DB_NAME="dbintigizi")/gm, '# $1');
      apiEnvContent = apiEnvContent.replace(/^(?!\s*#)\s*(ALLOWED_ORIGINS="http:\/\/localhost:5173[^"]*")/gm, '# $1');
    }

    fs.writeFileSync(apiEnvPath, apiEnvContent, 'utf8');
    console.log('\x1b[32m%s\x1b[0m', '✔ Konfigurasi API .env berhasil diperbarui.');
  } else {
    console.log('\x1b[33m%s\x1b[0m', '⚠ File .env API tidak ditemukan. Melewati langkah ini.');
  }

  // 2. Modifikasi .env.development pada intigizi-core
  if (fs.existsSync(coreDevEnvPath)) {
    let devEnvContent = fs.readFileSync(coreDevEnvPath, 'utf8');
    if (target === 'local') {
      devEnvContent = devEnvContent.replace(/#\s*(VITE_API_URL=http:\/\/intigizi-api\.test\/app)/g, '$1');
      devEnvContent = devEnvContent.replace(/^(VITE_API_URL=https:\/\/[^\s\n#]+)/gm, '# $1');
    } else {
      // Tulis URL deploy baru (baik custom atau default)
      const deployTargetUrl = `${deployApiUrl}/app`;
      // Ganti URL deploy yang ada
      devEnvContent = devEnvContent.replace(/#?\s*(VITE_API_URL=https:\/\/[^\s\n#]+)/g, `VITE_API_URL=${deployTargetUrl}`);
      // Nonaktifkan lokal
      devEnvContent = devEnvContent.replace(/^(VITE_API_URL=http:\/\/intigizi-api\.test\/app)/gm, '# $1');
    }
    fs.writeFileSync(coreDevEnvPath, devEnvContent, 'utf8');
    console.log('\x1b[32m%s\x1b[0m', '✔ Konfigurasi Frontend .env.development berhasil diperbarui.');
  }

  // 3. Modifikasi .env.production pada intigizi-core
  if (fs.existsSync(coreProdEnvPath)) {
    let prodEnvContent = fs.readFileSync(coreProdEnvPath, 'utf8');
    if (target === 'local') {
      prodEnvContent = prodEnvContent.replace(/#\s*(VITE_API_URL=http:\/\/intigizi-api\.test\/app)/g, '$1');
      prodEnvContent = prodEnvContent.replace(/^(VITE_API_URL=https:\/\/[^\s\n#]+)/gm, '# $1');
    } else {
      // Tulis URL deploy baru (baik custom atau default)
      const deployTargetUrl = `${deployApiUrl}/app`;
      // Ganti URL deploy yang ada
      prodEnvContent = prodEnvContent.replace(/#?\s*(VITE_API_URL=https:\/\/[^\s\n#]+)/g, `VITE_API_URL=${deployTargetUrl}`);
      // Nonaktifkan lokal
      prodEnvContent = prodEnvContent.replace(/^(VITE_API_URL=http:\/\/intigizi-api\.test\/app)/gm, '# $1');
    }
    fs.writeFileSync(coreProdEnvPath, prodEnvContent, 'utf8');
    console.log('\x1b[32m%s\x1b[0m', '✔ Konfigurasi Frontend .env.production berhasil diperbarui.');
  }

  // 4. Modifikasi .env pada intigizi-supplier-api
  if (fs.existsSync(supplierApiEnvPath)) {
    let sApiContent = fs.readFileSync(supplierApiEnvPath, 'utf8');
    if (target === 'local') {
      sApiContent = sApiContent.replace(/#\s*(APP_ENV="development")/g, '$1');
      sApiContent = sApiContent.replace(/#\s*(APP_URL=http:\/\/intigizi-supplier-api\.test)/g, '$1');
      sApiContent = sApiContent.replace(/#\s*(DB_HOST="localhost")/g, '$1');
      sApiContent = sApiContent.replace(/#\s*(DB_USER="root")/g, '$1');
      sApiContent = sApiContent.replace(/#\s*(DB_PASS="")/g, '$1');
      sApiContent = sApiContent.replace(/#\s*(DB_NAME="dbintigizi_marketplace")/g, '$1');
      sApiContent = sApiContent.replace(/#\s*(ALLOWED_ORIGINS="[^"]*intigizi-supplier[^"]*")/g, '$1');
      sApiContent = sApiContent.replace(/^(?!\s*#)\s*(APP_ENV="production")/gm, '# $1');
      sApiContent = sApiContent.replace(/^(?!\s*#)\s*(APP_URL=https:\/\/[^\s\n#]+)/gm, '# $1');
      sApiContent = sApiContent.replace(/^(?!\s*#)\s*(DB_HOST="(?!localhost)[^\s\n#]+")/gm, '# $1');
      sApiContent = sApiContent.replace(/^(?!\s*#)\s*(DB_USER="(?!root)[^\s\n#]+")/gm, '# $1');
      sApiContent = sApiContent.replace(/^(?!\s*#)\s*(DB_PASS="[^"]+")/gm, '# $1');
      sApiContent = sApiContent.replace(/^(?!\s*#)\s*(DB_NAME="(?!dbintigizi_marketplace)[^\s\n#]+")/gm, '# $1');
      sApiContent = sApiContent.replace(/^(?!\s*#)\s*(ALLOWED_ORIGINS="https:\/\/[^\s\n#]+)/gm, '# $1');
    } else {
      // Update URL nilai
      sApiContent = sApiContent.replace(/#?\s*(APP_URL=)https:\/\/[^\s\n#]+/g, `$1${deploySupplierApiUrl}`);
      sApiContent = sApiContent.replace(/#?\s*(ALLOWED_ORIGINS=")https:\/\/[^\s\n#]+/g,
        `$1${deploySupplierApiUrl},https://www.${deploySupplierOrigin}, *"`);
      sApiContent = sApiContent.replace(/#\s*(APP_ENV="production")/g, '$1');
      sApiContent = sApiContent.replace(/#\s*(APP_URL=https:\/\/[^\s\n#]+)/g, '$1');
      sApiContent = sApiContent.replace(/#\s*(DB_HOST="[^\s\n#]+")/g, '$1');
      sApiContent = sApiContent.replace(/#\s*(DB_USER="[^\s\n#]+")/g, '$1');
      sApiContent = sApiContent.replace(/#\s*(DB_PASS="[^\s\n#]*")/g, '$1');
      sApiContent = sApiContent.replace(/#\s*(DB_NAME="[^\s\n#]+")/g, '$1');
      sApiContent = sApiContent.replace(/#\s*(ALLOWED_ORIGINS="https:\/\/[^\s\n#]+)/g, '$1');
      sApiContent = sApiContent.replace(/^(?!\s*#)\s*(APP_ENV="development")/gm, '# $1');
      sApiContent = sApiContent.replace(/^(?!\s*#)\s*(APP_URL=http:\/\/intigizi-supplier-api\.test)/gm, '# $1');
      sApiContent = sApiContent.replace(/^(?!\s*#)\s*(DB_HOST="localhost")/gm, '# $1');
      sApiContent = sApiContent.replace(/^(?!\s*#)\s*(DB_USER="root")/gm, '# $1');
      sApiContent = sApiContent.replace(/^(?!\s*#)\s*(DB_PASS="")/gm, '# $1');
      sApiContent = sApiContent.replace(/^(?!\s*#)\s*(DB_NAME="dbintigizi_marketplace")/gm, '# $1');
      sApiContent = sApiContent.replace(/^(?!\s*#)\s*(ALLOWED_ORIGINS="http:\/\/[^\s\n#]+)/gm, '# $1');
    }
    fs.writeFileSync(supplierApiEnvPath, sApiContent, 'utf8');
    console.log('\x1b[32m%s\x1b[0m', '✔ Konfigurasi Supplier API .env berhasil diperbarui.');
  } else {
    console.log('\x1b[33m%s\x1b[0m', '⚠ File .env Supplier API tidak ditemukan. Melewati langkah ini.');
  }

  // 5. Modifikasi .env.development & .env.production pada intigizi-supplier-core
  const supplierEnvFiles = [
    { path: supplierDevEnvPath, label: 'Supplier Core .env.development' },
    { path: supplierProdEnvPath, label: 'Supplier Core .env.production' },
  ];
  for (const envFile of supplierEnvFiles) {
    if (!fs.existsSync(envFile.path)) {
      console.log('\x1b[33m%s\x1b[0m', `⚠ File ${envFile.label} tidak ditemukan. Melewati.`);
      continue;
    }
    let envContent = fs.readFileSync(envFile.path, 'utf8');
    if (target === 'local') {
      envContent = envContent.replace(/#\s*(VITE_API_URL=http:\/\/intigizi-supplier-api\.test\/app)/g, '$1');
      envContent = envContent.replace(/^(VITE_API_URL=https:\/\/[^\s\n#]+)/gm, '# $1');
    } else {
      const deployTargetUrl = `${deploySupplierApiUrl}/app`;
      envContent = envContent.replace(/#?\s*(VITE_API_URL=https:\/\/[^\s\n#]+)/g, `VITE_API_URL=${deployTargetUrl}`);
      envContent = envContent.replace(/^(VITE_API_URL=http:\/\/intigizi-supplier-api\.test\/app)/gm, '# $1');
    }
    fs.writeFileSync(envFile.path, envContent, 'utf8');
    console.log('\x1b[32m%s\x1b[0m', `✔ Konfigurasi ${envFile.label} berhasil diperbarui.`);
  }

  // 6. Jalankan build produksi otomatis — intigizi-core
  console.log('\n\x1b[33m%s\x1b[0m', `Menjalankan build produksi Dapur IntiGizi (Vite build) untuk target: ${target.toUpperCase()}...`);
  try {
    execSync('npm run build', { stdio: 'inherit', shell: true });
    console.log('\n\x1b[32m%s\x1b[0m', '✔ Build Dapur IntiGizi selesai dengan sukses!');
  } catch (buildError) {
    console.log('\x1b[31m%s\x1b[0m', '✘ Gagal menjalankan npm run build untuk Dapur. Silakan jalankan secara manual.');
  }

  // 7. Jalankan build produksi otomatis — intigizi-supplier-core
  const supplierCorePath = path.join(__dirname, '../intigizi-supplier-core');
  if (fs.existsSync(path.join(supplierCorePath, 'package.json'))) {
    console.log('\n\x1b[33m%s\x1b[0m', `Menjalankan build produksi Sentra IntiGizi (Vite build) untuk target: ${target.toUpperCase()}...`);
    try {
      execSync('npm run build', { cwd: supplierCorePath, stdio: 'inherit', shell: true });
      console.log('\n\x1b[32m%s\x1b[0m', '✔ Build Sentra IntiGizi selesai dengan sukses!');
    } catch (buildError) {
      console.log('\x1b[31m%s\x1b[0m', '✘ Gagal menjalankan npm run build untuk Sentra IntiGizi. Silakan jalankan secara manual.');
    }
  } else {
    console.log('\x1b[33m%s\x1b[0m', '⚠ Direktori intigizi-supplier-core tidak ditemukan. Melewati build supplier.');
  }

  console.log('\n\x1b[42m%s\x1b[0m', ' SEMUA PROSES SELESAI DENGAN SUKSES! ');

} catch (err) {
  console.log('\x1b[31m%s\x1b[0m', `Error terjadi selama perpindahan: ${err.message}`);
}
