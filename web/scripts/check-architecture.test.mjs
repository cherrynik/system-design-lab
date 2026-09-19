import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  findArchitectureBoundaryViolations,
  findSharedUiFacadeViolations,
  findTypePlacementViolations,
} from './check-architecture.mjs';

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

describe('type placement checker', () => {
  it('rejects public and private declarations in implementation files', () => {
    const root = fixture({
      'entities/architecture/model/catalog.ts':
        'type ArchitectureVariant = { id: string };\nexport type { ArchitectureVariant };',
      'features/canvas/model/interaction.ts': 'type PointerDown = { timestamp: number };',
      'widgets/workbench/ui/Toolbar.tsx':
        'export interface ToolbarProps { label: string }\nexport function Toolbar() { return null; }',
      'shared/lib/clamp.ts': 'type ClampOptions = { inset: number };',
      'pages/lab/model/controller.ts': 'interface ControllerState { ready: boolean }',
    });

    expect(findTypePlacementViolations(root)).toEqual([
      expect.stringContaining('catalog.ts:1: move ArchitectureVariant'),
      expect.stringContaining('interaction.ts:1: move PointerDown'),
      expect.stringContaining('controller.ts:1: move ControllerState'),
      expect.stringContaining('clamp.ts:1: move ClampOptions'),
      expect.stringContaining('Toolbar.tsx:1: move ToolbarProps'),
    ]);
  });

  it('accepts adjacent type modules, config types, and declaration augmentation', () => {
    const root = fixture({
      'entities/architecture/model/catalog.types.ts':
        'export type ArchitectureVariant = { id: string };',
      'features/canvas/model/canvas.config.ts': 'export type CanvasConfig = { grid: number };',
      'features/canvas/model/shape.ts':
        "declare module 'canvas' { interface ShapeMap { card: unknown } }\nexport const shape = 'card';",
    });

    expect(findTypePlacementViolations(root)).toEqual([]);
  });
});

describe('shared UI facade checker', () => {
  it('rejects direct interactive Mantine primitive imports from product layers', () => {
    const root = fixture({
      'features/editor/ui/Toolbar.tsx':
        "import { ActionIcon as MantineAction, Group, Tooltip } from '@mantine/core';\nvoid MantineAction;\nvoid Group;\nvoid Tooltip;",
      'widgets/runner/ui/Runner.tsx':
        "import { Button, ScrollArea, Text } from '@mantine/core';\nvoid Button;\nvoid ScrollArea;\nvoid Text;",
    });

    expect(findSharedUiFacadeViolations(root)).toEqual([
      expect.stringContaining('Toolbar.tsx:1: import ActionIcon through @/shared/ui'),
      expect.stringContaining('Toolbar.tsx:1: import Tooltip through @/shared/ui'),
      expect.stringContaining('Runner.tsx:1: import Button through @/shared/ui'),
      expect.stringContaining('Runner.tsx:1: import ScrollArea through @/shared/ui'),
    ]);
  });

  it('allows Mantine adapters in shared UI and provider configuration', () => {
    const root = fixture({
      'shared/ui/button/Button.tsx':
        "import { Button } from '@mantine/core';\nexport function SharedButton() { return <Button />; }",
      'shared/config/PlatformProvider.tsx':
        "import { Tooltip } from '@mantine/core';\nexport function Provider() { return <Tooltip label='help'><button /></Tooltip>; }",
      'widgets/runner/ui/Runner.tsx':
        "import { Group, Text } from '@mantine/core';\nvoid Group;\nvoid Text;",
    });

    expect(findSharedUiFacadeViolations(root)).toEqual([]);
  });
});
