import type { ArchitectureNode } from '@/entities/architecture';
import { ARCHITECTURE_CARD_HEIGHT, ARCHITECTURE_CARD_WIDTH } from '../model/constants';

export function architectureNodeCenter(node: ArchitectureNode) {
  if (node.data.isAnchor) return { x: node.position.x, y: node.position.y };
  return {
    x: node.position.x + ARCHITECTURE_CARD_WIDTH / 2,
    y: node.position.y + ARCHITECTURE_CARD_HEIGHT / 2,
  };
}
