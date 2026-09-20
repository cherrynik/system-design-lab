import { useRef } from 'react';
import { X } from 'lucide-react';
import {
  architectureMeta,
  architectureVariants,
  getArchitectureVariant,
} from '@/entities/architecture';
import { useArchitectureInspectorPosition } from '../hooks/useArchitectureInspectorPosition';
import { useArchitectureInspectorDismiss } from '../hooks/useArchitectureInspectorDismiss';
import { useMeasuredElementHeight } from '../hooks/useMeasuredElementHeight';
import { INSPECTOR_FALLBACK_HEIGHT } from '../model/constants';
import { useArchitectureCanvasActions } from '../model/ArchitectureCanvasActionsContext';
import { ArchitectureInspectorVariantButton } from './ArchitectureInspectorVariantButton';

export function ArchitectureInspectorOverlay() {
  const actions = useArchitectureCanvasActions();
  const inspectorRef = useRef<HTMLDivElement>(null);
  const inspectorHeight = useMeasuredElementHeight(
    inspectorRef,
    INSPECTOR_FALLBACK_HEIGHT,
    actions.inspectorId,
  );
  const state = useArchitectureInspectorPosition(actions.inspectorId, inspectorHeight);
  useArchitectureInspectorDismiss(
    inspectorRef,
    Boolean(state) && actions.mode === 'interactive',
    actions.closeInspector,
  );
  if (!state || actions.mode === 'readonly') return null;

  const variant = getArchitectureVariant(state.shape.props.kind, state.shape.props.variantId);
  const Icon = variant.icon;
  return (
    <div
      ref={inspectorRef}
      role="dialog"
      aria-label={`Inspect ${state.shape.props.label}`}
      className={`component-inspector component-inspector--${state.placement} component-inspector--canvas-overlay`}
      style={{ left: state.x, top: state.y }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="component-inspector__header">
        <Icon
          aria-hidden="true"
          focusable="false"
          className={`component-logo component-logo--${state.shape.props.kind}`}
        />
        <span className="component-inspector__identity">
          <strong title={state.shape.props.label}>{state.shape.props.label}</strong>
          <small>{architectureMeta[state.shape.props.kind].role}</small>
        </span>
        <button type="button" onClick={actions.closeInspector} aria-label="Close inspector">
          <X aria-hidden="true" focusable="false" />
        </button>
      </div>
      <span className="inspector-label">Implementation</span>
      <div className="inspector-variants" role="group" aria-label="Implementation">
        {architectureVariants[state.shape.props.kind].map((candidate) => (
          <ArchitectureInspectorVariantButton
            key={candidate.id}
            kind={state.shape.props.kind}
            nodeId={state.shape.props.nodeId}
            variantId={candidate.id}
            active={candidate.id === variant.id}
          />
        ))}
      </div>
      <span className="inspector-label">Capabilities</span>
      <div className="inspector-capabilities" aria-label="Capabilities">
        {variant.capabilities.map((capability) => (
          <code key={capability}>{capability}</code>
        ))}
      </div>
    </div>
  );
}
