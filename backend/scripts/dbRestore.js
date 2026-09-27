const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const uri = process.env.MONGO_URI;
const source = process.argv[2];

if (!uri) {
  console.error('MONGO_URI is missing. Configure backend/.env first.');
  process.exit(1);
}

if (!source) {
  console.error('Provide a backup folder: npm run db:restore -- .\\backups\\BACKUP_FOLDER');
  process.exit(1);
}

const sourcePath = path.resolve(process.cwd(), source);
if (!fs.existsSync(sourcePath)) {
  console.error(`Backup folder does not exist: ${sourcePath}`);
  process.exit(1);
}

const result = spawnSync('mongorestore', ['--uri', uri, '--drop', sourcePath], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.error) {
  console.error('mongorestore was not found. Install MongoDB Database Tools and try again.');
  process.exit(1);
}

if (result.status !== 0) {
  console.error('Database restore failed. Ensure MongoDB Database Tools are installed and mongorestore is on PATH.');
  process.exit(result.status || 1);
}

console.log(`Database restored from ${sourcePath}`);
