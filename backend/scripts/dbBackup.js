const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error('MONGO_URI is missing. Configure backend/.env first.');
  process.exit(1);
}

const outputRoot = path.join(__dirname, '..', 'backups');
const outputDir = path.join(outputRoot, new Date().toISOString().replace(/[:.]/g, '-'));
fs.mkdirSync(outputDir, { recursive: true });

const result = spawnSync('mongodump', ['--uri', uri, '--out', outputDir], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.error) {
  console.error('mongodump was not found. Install MongoDB Database Tools and try again.');
  fs.rmSync(outputDir, { recursive: true, force: true });
  process.exit(1);
}

if (result.status !== 0) {
  console.error('Database backup failed. Ensure MongoDB Database Tools are installed and mongodump is on PATH.');
  fs.rmSync(outputDir, { recursive: true, force: true });
  process.exit(result.status || 1);
}

console.log(`Database backup created at ${outputDir}`);
