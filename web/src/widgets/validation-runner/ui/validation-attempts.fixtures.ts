import type { ValidationAttempt } from '@/features/validate-architecture';

export const completedAttempt: ValidationAttempt = {
  id: 1,
  createdAt: '2026-09-20T09:30:00.000Z',
  snapshot: { nodes: [], edges: [] },
  view: 'canvas',
  status: 'ready',
  results: [],
  terminal: [{ kind: 'success', text: 'PASS 1 passed · 0 warnings' }],
  validationError: null,
  nodeIssues: [],
  warningCount: 0,
};

export const warningAttempt: ValidationAttempt = {
  ...completedAttempt,
  id: 2,
  createdAt: '2026-09-20T09:32:00.000Z',
  view: 'solutions',
  solutionId: 'load-balancer-path',
  solutionLabel: 'Load Balancer Path',
  status: 'warning',
  terminal: [{ kind: 'success', text: 'PASS 1 passed', warningCount: 1 }],
  warningCount: 1,
};

export const failedAttempt: ValidationAttempt = {
  ...completedAttempt,
  id: 3,
  createdAt: '2026-09-20T09:35:00.000Z',
  status: 'error',
  terminal: [{ kind: 'error', text: 'No request path reaches an HTTP handler.' }],
  validationError: 'No request path reaches an HTTP handler.',
};

export const validationAttempts = [failedAttempt, warningAttempt, completedAttempt];
