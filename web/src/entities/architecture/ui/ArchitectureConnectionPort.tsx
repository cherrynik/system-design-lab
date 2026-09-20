import { useEffect, useId, useMemo, useRef } from 'react';
import { useConnectionNavigation } from '../model/useConnectionNavigation';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui';
import type { ArchitectureConnectionPortProps } from './ArchitectureConnectionPorts.types';

export function ArchitectureConnectionPort({
  direction,
  connections,
}: ArchitectureConnectionPortProps) {
  const owner = useId();
  const { scope, preview, clear, focus } = useConnectionNavigation();
  const elementRef = useRef<HTMLSpanElement>(null);
  const activeRef = useRef(false);
  const nodeIds = useMemo(() => [...new Set(connections.map((node) => node.id))], [connections]);
  useEffect(() => {
    activeRef.current = false;
    clear(owner);
    return () => clear(owner);
  }, [clear, owner, scope]);
  useEffect(() => {
    if (activeRef.current) preview(owner, nodeIds);
  }, [nodeIds, owner, preview]);
  const showConnections = () => {
    activeRef.current = true;
    preview(owner, nodeIds);
  };
  const hideConnections = () => {
    activeRef.current = false;
    clear(owner);
  };
  const focusConnections = () => {
    if (nodeIds.length) focus(nodeIds);
  };
  let directionLabel = 'Output';
  let preposition = 'to';
  if (direction === 'incoming') {
    directionLabel = 'Input';
    preposition = 'from';
  }

  const connected = connections.length > 0;
  const role = connected ? 'button' : 'img';
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
            ref={elementRef}
            role={role}
            onPointerEnter={showConnections}
            onPointerLeave={hideConnections}
            onFocus={() => {
              if (elementRef.current?.matches(':focus-visible')) showConnections();
            }}
            onBlur={hideConnections}
            onClick={(event) => event.stopPropagation()}
            onDoubleClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              focusConnections();
            }}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' && event.key !== ' ') return;
              event.preventDefault();
              event.stopPropagation();
              focusConnections();
            }}
            aria-label={description}
            data-port-direction={direction}
            data-port-state={state}
            tabIndex={0}
          />
        }
      >
        <span className="layer-connection-port__dot" aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent>
        {description}
        {connected && (
          <small className="layer-connection-port__hint">
            Double-click or press Enter to focus
          </small>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
