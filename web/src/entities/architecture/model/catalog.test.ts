import { describe, expect, it } from 'vitest';
import { getArrowProtocol } from './catalog';

describe('arrow protocol labels', () => {
  it('leaves a free arrow unlabeled', () => {
    expect(getArrowProtocol()).toBe('');
  });

  it('uses HTTPS when the arrow tail is attached to a client', () => {
    expect(getArrowProtocol('client')).toBe('HTTPS');
  });

  it('uses HTTP when the arrow tail is attached to infrastructure', () => {
    expect(getArrowProtocol('load-balancer')).toBe('HTTP');
    expect(getArrowProtocol('service')).toBe('HTTP');
  });
});
