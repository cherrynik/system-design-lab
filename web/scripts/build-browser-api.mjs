import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../../', import.meta.url));
const output = path.join(root, 'web/public/runtime');
const go = process.env.GO_BINARY || 'go';
mkdirSync(output, { recursive: true });
execFileSync(
  go,
  ['build', '-trimpath', '-ldflags=-s -w', '-o', path.join(output, 'api.wasm'), './cmd/browser'],
  {
    cwd: path.join(root, 'api'),
    env: { ...process.env, GOOS: 'js', GOARCH: 'wasm' },
    stdio: 'inherit',
  },
);
const goRoot = execFileSync(go, ['env', 'GOROOT'], { encoding: 'utf8' }).trim();
const runtime = ['lib/wasm/wasm_exec.js', 'misc/wasm/wasm_exec.js']
  .map((file) => path.join(goRoot, file))
  .find(existsSync);
if (!runtime) throw new Error('wasm_exec.js is missing from this Go installation.');
copyFileSync(runtime, path.join(output, 'wasm_exec.js'));
copyFileSync(path.join(goRoot, 'LICENSE'), path.join(output, 'GO-LICENSE'));
