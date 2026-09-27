const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const outPath = path.join(__dirname, 'verify-vitest-output.txt');
const result = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['vitest', 'run', 'src/tests/app.routes.test.jsx', '--reporter=verbose'], {
  cwd: __dirname,
  encoding: 'utf8',
  shell: true,
});
const content = [
  `status=${result.status}`,
  `signal=${result.signal ?? 'null'}`,
  '--- stdout ---',
  result.stdout || '',
  '--- stderr ---',
  result.stderr || '',
].join('\n');
fs.writeFileSync(outPath, content, 'utf8');
console.log(content);
