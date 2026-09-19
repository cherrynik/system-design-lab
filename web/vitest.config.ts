import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.mjs'],
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.stories.{ts,tsx}',
        'src/**/index.ts',
        'src/main.tsx',
        'src/vite-env.d.ts',
      ],
      thresholds: {
        branches: 58,
        functions: 60,
        lines: 62,
        statements: 60,
        'src/features/canvas-history/model/**/*.ts': {
          branches: 60,
          functions: 80,
          lines: 90,
          statements: 90,
          perFile: true,
        },
        'src/features/validate-architecture/{api,model}/**/*.ts': {
          branches: 60,
          functions: 80,
          lines: 65,
          statements: 60,
          perFile: true,
        },
        'src/widgets/validation-runner/ui/**/*.{ts,tsx}': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
          perFile: true,
        },
        'src/features/edit-architecture-canvas/hooks/{useArchitectureCanvasReconciler,useArchitectureCanvasTool,useArchitectureShapeGuard}.ts':
          {
            branches: 65,
            functions: 70,
            lines: 70,
            statements: 65,
            perFile: true,
          },
        'src/features/edit-architecture-canvas/lib/{createArchitectureArrow,createKeyboardHotspotArrow,finalizePendingHotspotStart,readArchitectureEditorState,reconcileArrowBinding,updateArchitectureArrow}.ts':
          {
            branches: 70,
            functions: 85,
            lines: 85,
            statements: 85,
            perFile: true,
          },
      },
    },
  },
});
