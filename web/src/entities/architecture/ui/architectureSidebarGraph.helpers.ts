import type { ArchitectureNodeConnectionState } from '../model/connections.types';
import type { ArchitectureNodeValidationState } from '../model/nodeValidation.types';

export const emptyConnectionState: ArchitectureNodeConnectionState = {
  state: 'isolated',
  incoming: [],
  outgoing: [],
  missing: [],
};

export function getSidebarNodeStateLabel(
  nodeId: string,
  connectionStates: Map<string, ArchitectureNodeConnectionState>,
  validationStates?: Map<string, ArchitectureNodeValidationState>,
) {
  const validation = validationStates?.get(nodeId);
  if (validation?.status === 'error' || validation?.status === 'warning') {
    return validation.issues.map(({ message }) => message).join(' ');
  }
  if (validation?.status === 'valid') return 'Validation passed';
  const state = connectionStates.get(nodeId)?.state;
  if (state === 'ready') return 'Connected';
  if (state === 'incomplete') return 'Connection required';
  return 'Not connected';
}

export function getGitRailPath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  channelX: number,
) {
  const verticalDirection = Math.sign(targetY - sourceY) || 1;
  const intoChannel = Math.sign(channelX - sourceX) || 1;
  const outOfChannel = Math.sign(targetX - channelX) || -1;
  const radius = Math.min(
    2.5,
    Math.abs(channelX - sourceX),
    Math.abs(targetX - channelX),
    Math.abs(targetY - sourceY) / 2,
  );

  return [
    `M ${sourceX} ${sourceY}`,
    `L ${channelX - intoChannel * radius} ${sourceY}`,
    `Q ${channelX} ${sourceY} ${channelX} ${sourceY + verticalDirection * radius}`,
    `L ${channelX} ${targetY - verticalDirection * radius}`,
    `Q ${channelX} ${targetY} ${channelX + outOfChannel * radius} ${targetY}`,
    `L ${targetX} ${targetY}`,
  ].join(' ');
}
