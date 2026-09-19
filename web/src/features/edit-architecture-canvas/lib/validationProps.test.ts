import { describe, expect, it } from 'vitest';
import { getCardValidationProps } from './validationProps';

describe('canvas validation props', () => {
  it('uses an idle state before validation', () => {
    expect(getCardValidationProps()).toEqual({
      validation: 'idle',
      validationMessage: '',
    });
  });

  it('formats issue and suggestion pairs for the tooltip', () => {
    expect(
      getCardValidationProps({
        status: 'warning',
        issues: [
          {
            code: 'NODE_OUTPUT_REQUIRED',
            nodeId: 'load-balancer',
            severity: 'warning',
            message: 'Missing output',
            suggestion: 'Connect a service',
          },
          {
            code: 'NODE_INPUT_REQUIRED',
            nodeId: 'service',
            severity: 'warning',
            message: 'Single point of failure',
            suggestion: 'Add another instance',
          },
        ],
      }),
    ).toEqual({
      validation: 'warning',
      validationMessage:
        'Missing output\nConnect a service\n\nSingle point of failure\nAdd another instance',
    });
  });
});
