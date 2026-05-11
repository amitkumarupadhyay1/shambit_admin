import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const huskyBin = join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'husky.cmd' : 'husky');

if (!existsSync(join(root, '.git')) || !existsSync(huskyBin)) {
  process.exit(0);
}

const gitCheck = spawnSync('git', ['--version'], { stdio: 'ignore' });
if (gitCheck.status !== 0) {
  process.exit(0);
}

const result = spawnSync(huskyBin, [], { stdio: 'inherit' });
process.exit(result.status ?? 0);
