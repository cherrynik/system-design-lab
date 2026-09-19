import { useRef } from 'react';
import { FiX } from 'react-icons/fi';
import {
  architectureMeta,
  architectureVariants,
  getArchitectureVariant,
} from '@/entities/architecture';
import { useArchitectureInspectorPosition } from '../hooks/useArchitectureInspectorPosition';
import { useMeasuredElementHeight } from '../hooks/useMeasuredElementHeight';
import { INSPECTOR_FALLBACK_HEIGHT } from '../model/constants';
import { useArchitectureCanvasActions } from '../model/ArchitectureCanvasActionsContext';
import { ArchitectureInspectorVariantButton } from './ArchitectureInspectorVariantButton';

export function ArchitectureInspectorOverlay() {
  const actions = useArchitectureCanvasActions();
  const inspectorRef = useRef<HTMLElement>(null);
  const inspectorHeight = useMeasuredElementHeight(
    inspectorRef,
    INSPECTOR_FALLBACK_HEIGHT,
    actions.inspectorId,
  );
  const state = useArchitectureInspectorPosition(actions.inspectorId, inspectorHeight);
  if (!state || actions.mode === 'readonly') return null;

  const variant = getArchitectureVariant(state.shape.props.kind, state.shape.props.variantId);
  const Icon = variant.icon;
  return (
    <aside
      ref={inspectorRef}
      className={`component-inspector component-inspector--${state.placement} component-inspector--canvas-overlay`}
      style={{ left: state.x, top: state.y }}
    >
      <div className="component-inspector__header">
        <span className="panel-id">COMPONENT INSPECTOR</span>
        <button onClick={actions.closeInspector} aria-label="Close inspector">
          <FiX aria-hidden="true" focusable="false" />
        </button>
      </div>
      <div className="component-inspector__identity">
        <Icon
          aria-hidden="true"
          focusable="false"
          className={`component-logo component-logo--${state.shape.props.kind}`}
        />
        <span>
          <strong>{variant.label}</strong>
          <small>{architectureMeta[state.shape.props.kind].role}</small>
        </span>
      </div>
      <span className="inspector-label">IMPLEMENTATION</span>
      <div className="inspector-variants">
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
      <span className="inspector-label">CAPABILITIES</span>
      <div className="inspector-capabilities">
        {variant.capabilities.map((capability) => (
          <code key={capability}>{capability}</code>
        ))}
      </div>
    </aside>
  );
}
