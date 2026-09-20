import { getSupportedArchitectureConnectionDirections } from '../model/connections';
import { ArchitectureConnectionPort } from './ArchitectureConnectionPort';
import type { ArchitectureConnectionPortsProps } from './ArchitectureConnectionPorts.types';
import './architecture-sidebar.css';

const directions = ['incoming', 'outgoing'] as const;

export function ArchitectureConnectionPorts({
  kind,
  connectionState,
}: ArchitectureConnectionPortsProps) {
  const supportedDirections = getSupportedArchitectureConnectionDirections(kind);

  return (
    <span className="layer-connection-ports" role="group" aria-label="Connection ports">
      {directions.map((direction) => {
        if (!supportedDirections.includes(direction)) {
          return <span className="layer-connection-port" key={direction} aria-hidden="true" />;
        }
        return (
          <ArchitectureConnectionPort
            key={direction}
            direction={direction}
            connections={connectionState[direction]}
          />
        );
      })}
    </span>
  );
}
