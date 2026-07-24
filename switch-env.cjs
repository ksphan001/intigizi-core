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

const apiEnvPath = path.join(__dirname, '../intigizi-api/.env');
const coreDevEnvPath = path.join(__dirname, '.env.development');
const coreProdEnvPath = path.join(__dirname, '.env.production');

// Konfigurasi Default Deploy
let deployApiUrl = 'https://api.intigizi.ksphan.id';
let deployOriginDomain = 'intigizi.ksphan.id';

// Jika ada kustom domain dari user, bersihkan dan pasang
if (target === 'deploy' && customDomainInput) {
  // Hapus http://, https://, trailing slash
  let cleanDomain = customDomainInput.trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '');
  
  deployApiUrl = `https://${cleanDomain}`;
  deployOriginDomain = cleanDomain;
  console.log('\x1b[35m%s\x1b[0m', `Menggunakan domain API kustom untuk deploy: ${deployApiUrl}`);
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

  // 4. Jalankan build produksi otomatis untuk kedua target agar folder dist/ selalu sinkron
  console.log('\n\x1b[33m%s\x1b[0m', `Menjalankan build produksi frontend (Vite build) untuk target: ${target.toUpperCase()}...`);
  try {
    execSync('npm run build', { stdio: 'inherit', shell: true });
    console.log('\n\x1b[32m%s\x1b[0m', '✔ Build produksi selesai dengan sukses!');
  } catch (buildError) {
    console.log('\x1b[31m%s\x1b[0m', '✘ Gagal menjalankan npm run build. Silakan jalankan secara manual.');
  }

  console.log('\n\x1b[42m%s\x1b[0m', ' PROSES SELESAI DENGAN SUKSES! ');

} catch (err) {
  console.log('\x1b[31m%s\x1b[0m', `Error terjadi selama perpindahan: ${err.message}`);
}
