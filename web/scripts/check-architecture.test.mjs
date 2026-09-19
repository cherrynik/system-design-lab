import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { findArchitectureBoundaryViolations } from './check-architecture.mjs';

const fixtureRoots = [];

function fixture(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'system-design-lab-fsd-'));
  fixtureRoots.push(root);
  for (const [relativePath, source] of Object.entries(files)) {
    const filePath = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, source);
  }
  return root;
}

afterEach(() => {
  for (const root of fixtureRoots.splice(0)) fs.rmSync(root, { force: true, recursive: true });
});

describe('architecture boundary checker', () => {
  it('accepts downward imports through a slice public API', () => {
    const root = fixture({
      'entities/architecture/index.ts': "export const architecture = 'architecture';",
      'features/editor/index.ts': "export { architecture } from '../../entities/architecture';",
      'pages/lab/index.ts': "export { architecture } from '../../features/editor';",
    });

    expect(findArchitectureBoundaryViolations(root)).toEqual([]);
  });

  it('rejects upward, sibling-slice, and deep cross-slice imports', () => {
    const root = fixture({
      'entities/architecture/index.ts': "export { internal } from './model/internal';",
      'entities/architecture/model/internal.ts': "export const internal = 'internal';",
      'features/editor/index.ts': "export const editor = 'editor';",
      'features/history/index.ts': "export { editor } from '../editor';",
      'shared/lib/broken.ts': "void import('../../pages/lab');",
      'pages/lab/index.ts': "import '../../entities/architecture/model/internal';",
    });

    expect(findArchitectureBoundaryViolations(root)).toEqual(
      expect.arrayContaining([
        expect.stringContaining('shared cannot import upward from pages'),
        expect.stringContaining('slices in features cannot import each other'),
        expect.stringContaining('through its public index'),
      ]),
    );
  });

  it('resolves the application alias and allows public shared modules', () => {
    const root = fixture({
      'shared/lib/cn.ts': 'export const cn = () => undefined;',
      'shared/ui/button.tsx': "import { cn } from '@/shared/lib/cn'; void cn;",
      'pages/lab/index.ts': "import '@/shared/ui/button';",
    });

    expect(findArchitectureBoundaryViolations(root)).toEqual([]);
  });
});
