import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui';
import type { ArchitectureConnectionPortProps } from './ArchitectureConnectionPorts.types';

export function ArchitectureConnectionPort({
  direction,
  connections,
}: ArchitectureConnectionPortProps) {
  let directionLabel = 'Output';
  let preposition = 'to';
  if (direction === 'incoming') {
    directionLabel = 'Input';
    preposition = 'from';
  }

  const connected = connections.length > 0;
  let state = 'unconnected';
  let description = `${directionLabel}: Not connected`;
  if (connected) {
    state = 'connected';
    const names = [...new Set(connections.map((node) => node.data.label))].join(', ');
    let connectionLabel = 'connection';
    if (connections.length > 1) connectionLabel = 'connections';
    description = `${directionLabel}: ${connections.length} ${connectionLabel} ${preposition} ${names}`;
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            className="layer-connection-port"
            role="img"
            aria-label={description}
            data-port-direction={direction}
            data-port-state={state}
            tabIndex={0}
          />
        }
      >
        <span className="layer-connection-port__dot" aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent>{description}</TooltipContent>
    </Tooltip>
  );
}
