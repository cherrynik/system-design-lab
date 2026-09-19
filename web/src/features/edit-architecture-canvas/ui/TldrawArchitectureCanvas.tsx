import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import {
  BaseBoxShapeUtil,
  ArrowShapeKindStyle,
  DefaultColorStyle,
  DefaultDashStyle,
  DefaultFillStyle,
  DefaultFontStyle,
  DefaultSizeStyle,
  HTMLContainer,
  T,
  Tldraw,
  createShapeId,
  getArrowBindings,
  getArrowTerminalsInArrowSpace,
  renderPlaintextFromRichText,
  toRichText,
  useEditor,
  useValue,
  type Editor,
  type RecordProps,
  type TLComponents,
  type TLArrowShape,
  type TLShape,
} from 'tldraw';
import { FiAlertTriangle, FiX } from 'react-icons/fi';
import 'tldraw/tldraw.css';
import {
  architectureMeta,
  architectureVariants,
  getArchitectureVariant,
  getArrowProtocol,
  isArchitectureCardDoubleClick,
  isBrowserZoomShortcut,
  isSupportedArchitectureCanvasShape,
  resolveArchitectureCardLabel,
} from '@/entities/architecture';
import type {
  ArchitectureEdge,
  ArchitectureNode,
  ArchitectureNodeKind,
  ArchitectureNodeValidationState,
  EdgeAnchor,
} from '@/entities/architecture';
import { clampFloatingPanelPosition } from '@/shared/lib';

const CARD_TYPE = 'architecture-card' as const;
const CARD_WIDTH = 220;
const CARD_HEIGHT = 86;
const INSPECTOR_WIDTH = 270;
const INSPECTOR_FALLBACK_HEIGHT = 280;
const INSPECTOR_VIEWPORT_MARGIN = 12;
const INSPECTOR_GAP = 18;
type HotspotSide = 'top' | 'right' | 'bottom' | 'left';

const hotspotAnchor: Record<HotspotSide, { x: number; y: number }> = {
  top: { x: 0.5, y: 0 },
  right: { x: 1, y: 0.5 },
  bottom: { x: 0.5, y: 1 },
  left: { x: 0, y: 0.5 },
};

function setArchitectureArrowStyles(editor: Editor) {
  editor.setStyleForNextShapes(ArrowShapeKindStyle, 'arc');
  editor.setStyleForNextShapes(DefaultColorStyle, 'light-blue');
  editor.setStyleForNextShapes(DefaultDashStyle, 'solid');
  editor.setStyleForNextShapes(DefaultFillStyle, 'none');
  editor.setStyleForNextShapes(DefaultFontStyle, 'mono');
  editor.setStyleForNextShapes(DefaultSizeStyle, 's');
}

declare module 'tldraw' {
  interface TLGlobalShapePropsMap {
    [CARD_TYPE]: {
      w: number;
      h: number;
      nodeId: string;
      label: string;
      kind: ArchitectureNodeKind;
      variantId: string;
      validation: 'idle' | 'valid' | 'warning' | 'error';
      validationMessage: string;
    };
  }
}

type ArchitectureCardShape = TLShape<typeof CARD_TYPE>;

type PendingHotspotStart = {
  shapeId: ArchitectureCardShape['id'];
  anchor: { x: number; y: number };
  existingArrowIds: Set<string>;
};

function startEditingArchitectureCard(editor: Editor, shape: ArchitectureCardShape) {
  editor.setEditingShape(shape);
  editor.setCurrentTool('select.editing_shape', { target: 'shape', shape });
}

type ArchitectureCanvasActions = {
  inspectorId: string | null;
  closeInspector: () => void;
  updateVariant: (nodeId: string, variantId: string) => void;
  nodeRenamed: (nodeId: string, label: string) => void;
  queueHotspotStart: (pending: PendingHotspotStart) => void;
  isCurrentHotspotStart: (pending: PendingHotspotStart) => boolean;
  clearHotspotStart: (pending: PendingHotspotStart) => void;
};

const ArchitectureCanvasActionsContext = createContext<ArchitectureCanvasActions | null>(null);

function useArchitectureCanvasActions() {
  const actions = useContext(ArchitectureCanvasActionsContext);
  if (!actions) throw new Error('Architecture canvas actions are unavailable');
  return actions;
}

function finalizePendingHotspotStart(editor: Editor, pending: PendingHotspotStart) {
  const createdArrow = [...editor.getCurrentPageShapes()]
    .reverse()
    .find(
      (shape): shape is TLArrowShape =>
        shape.type === 'arrow' && !pending.existingArrowIds.has(shape.id),
    );
  if (!createdArrow) return false;

  const startBinding = getArrowBindings(editor, createdArrow).start;
  if (startBinding)
    editor.updateBinding({
      ...startBinding,
      props: { ...startBinding.props, normalizedAnchor: pending.anchor, isPrecise: true },
    });
  else
    editor.createBinding({
      type: 'arrow',
      fromId: createdArrow.id,
      toId: pending.shapeId,
      props: {
        terminal: 'start',
        normalizedAnchor: pending.anchor,
        isPrecise: true,
        isExact: false,
        snap: 'none',
      },
    });
  editor.updateShape<TLArrowShape>({
    id: createdArrow.id,
    type: 'arrow',
    props: {
      kind: 'arc',
      dash: 'solid',
      size: 's',
      fill: 'none',
      color: 'light-blue',
      labelColor: 'light-blue',
      arrowheadStart: 'none',
      arrowheadEnd: 'arrow',
      font: 'mono',
      richText: toRichText(''),
    },
  });
  return true;
}

class ArchitectureCardShapeUtil extends BaseBoxShapeUtil<ArchitectureCardShape> {
  static override type = CARD_TYPE;
  static override props: RecordProps<ArchitectureCardShape> = {
    w: T.number,
    h: T.number,
    nodeId: T.string,
    label: T.string,
    kind: T.literalEnum('client', 'load-balancer', 'service'),
    variantId: T.string,
    validation: T.literalEnum('idle', 'valid', 'warning', 'error'),
    validationMessage: T.string,
  };

  override getDefaultProps(): ArchitectureCardShape['props'] {
    return {
      w: CARD_WIDTH,
      h: CARD_HEIGHT,
      nodeId: '',
      label: 'Component',
      kind: 'service',
      variantId: 'abstract',
      validation: 'idle',
      validationMessage: '',
    };
  }

  override canBind({ bindingType }: { bindingType: string }) {
    return bindingType === 'arrow';
  }

  override canEdit() {
    return true;
  }

  override onDoubleClick(shape: ArchitectureCardShape) {
    if (this.editor.getEditingShapeId() !== shape.id)
      startEditingArchitectureCard(this.editor, shape);
  }

  override canResize() {
    return false;
  }

  override hideResizeHandles() {
    return true;
  }

  override hideRotateHandle() {
    return true;
  }

  override hideSelectionBoundsBg() {
    return true;
  }

  override hideSelectionBoundsFg() {
    return true;
  }

  component(shape: ArchitectureCardShape) {
    return <ArchitectureCardContent shape={shape} />;
  }

  getIndicatorPath(shape: ArchitectureCardShape) {
    const path = new Path2D();
    path.roundRect(0, 0, shape.props.w, shape.props.h, 12);
    return path;
  }
}

function ArchitectureCardContent({ shape }: { shape: ArchitectureCardShape }) {
  const editor = useEditor();
  const actions = useArchitectureCanvasActions();
  const variant = getArchitectureVariant(shape.props.kind, shape.props.variantId);
  const Icon = variant.icon;
  const isSelected = useValue(
    'architecture card selected',
    () => editor.getSelectedShapeIds().includes(shape.id),
    [editor, shape.id],
  );
  const isEditing = useValue(
    'architecture card editing',
    () => editor.getEditingShapeId() === shape.id,
    [editor, shape.id],
  );
  const isBindingTarget = useValue(
    'architecture card binding target',
    () => editor.getHintingShapeIds().includes(shape.id),
    [editor, shape.id],
  );
  const isArrowInteraction = useValue(
    'arrow interaction active',
    () =>
      editor.getCurrentToolId() === 'arrow' ||
      editor.getPath().startsWith('select.dragging_handle'),
    [editor],
  );

  const beginArrow = (event: ReactPointerEvent<HTMLSpanElement>, side: HotspotSide) => {
    if (event.button !== 0 || isArrowInteraction) return;
    const pending = {
      shapeId: shape.id,
      anchor: hotspotAnchor[side],
      existingArrowIds: new Set(
        editor
          .getCurrentPageShapes()
          .filter(({ type }) => type === 'arrow')
          .map(({ id }) => id),
      ),
    };
    actions.queueHotspotStart(pending);
    const finalizeArrow = () => {
      window.removeEventListener('pointerup', finalizeArrow, true);
      window.removeEventListener('pointercancel', finalizeArrow, true);
      window.requestAnimationFrame(() => {
        if (!actions.isCurrentHotspotStart(pending)) return;
        if (finalizePendingHotspotStart(editor, pending)) {
          actions.clearHotspotStart(pending);
          return;
        }
        window.setTimeout(() => {
          actions.clearHotspotStart(pending);
        }, 1_200);
      });
    };
    window.addEventListener('pointerup', finalizeArrow, true);
    window.addEventListener('pointercancel', finalizeArrow, true);
    editor.setCurrentTool('arrow');
  };

  return (
    <HTMLContainer
      className={`tldraw-architecture-card tldraw-architecture-card--${shape.props.kind} tldraw-architecture-card--validation-${shape.props.validation} ${isSelected ? 'tldraw-architecture-card--selected' : ''} ${isBindingTarget ? 'tldraw-architecture-card--binding-target' : ''} ${isArrowInteraction ? 'tldraw-architecture-card--arrow-interaction' : ''}`}
    >
      <Icon className={`component-logo component-logo--${shape.props.kind}`} />
      <span>
        {isEditing ? (
          <ArchitectureCardNameInput shape={shape} editor={editor} onRename={actions.nodeRenamed} />
        ) : (
          <strong>{shape.props.label}</strong>
        )}
        <small>{architectureMeta[shape.props.kind].role}</small>
      </span>
      {shape.props.validation !== 'idle' && shape.props.validation !== 'valid' && (
        <i
          className={`tldraw-node-validation node-validation-tooltip tldraw-node-validation--${shape.props.validation}`}
          data-tooltip={shape.props.validationMessage}
          aria-label="Node validation issue"
          tabIndex={0}
        >
          {shape.props.validation === 'error' ? <FiX /> : <FiAlertTriangle />}
        </i>
      )}
      {(['top', 'right', 'bottom', 'left'] as HotspotSide[]).map((side) => (
        <span
          key={side}
          className={`tldraw-node-hotspot tldraw-node-hotspot--${side}`}
          aria-label={`Create connection from ${side} of ${shape.props.label}`}
          aria-hidden={!isSelected && !isBindingTarget}
          role="button"
          onPointerDown={(event) => beginArrow(event, side)}
        />
      ))}
    </HTMLContainer>
  );
}

function ArchitectureCardNameInput({
  shape,
  editor,
  onRename,
}: {
  shape: ArchitectureCardShape;
  editor: Editor;
  onRename: (nodeId: string, label: string) => void;
}) {
  const [draft, setDraft] = useState(shape.props.label);
  const renameCancelledRef = useRef(false);

  const finishRename = () => {
    const label = resolveArchitectureCardLabel(
      shape.props.label,
      draft,
      renameCancelledRef.current,
    );
    renameCancelledRef.current = false;
    if (label !== shape.props.label) {
      onRename(shape.props.nodeId, label);
      editor.updateShape<ArchitectureCardShape>({
        id: shape.id,
        type: CARD_TYPE,
        props: { label },
      });
    }
    if (editor.getEditingShapeId() === shape.id) editor.setEditingShape(null);
  };

  return (
    <input
      autoFocus
      className="tldraw-node-name-input"
      aria-label={`Rename ${shape.props.label}`}
      value={draft}
      onFocus={(event) => event.currentTarget.select()}
      onChange={(event) => setDraft(event.target.value)}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
      onBlur={finishRename}
      onKeyDownCapture={(event) => {
        event.stopPropagation();
        if (event.key === 'Enter') event.currentTarget.blur();
        if (event.key === 'Escape') {
          event.preventDefault();
          renameCancelledRef.current = true;
          event.currentTarget.blur();
        }
      }}
    />
  );
}

function ArchitectureInspectorOverlay() {
  const editor = useEditor();
  const actions = useArchitectureCanvasActions();
  const inspectorRef = useRef<HTMLElement>(null);
  const [inspectorHeight, setInspectorHeight] = useState(INSPECTOR_FALLBACK_HEIGHT);
  const state = useValue(
    'architecture inspector overlay',
    () => {
      if (!actions.inspectorId) return null;
      editor.getCamera();
      const viewport = editor.getViewportScreenBounds();
      const shape = editor.getShape<ArchitectureCardShape>(shapeIdForNode(actions.inspectorId));
      const bounds = shape ? editor.getShapePageBounds(shape.id) : undefined;
      if (!shape || !bounds || shape.type !== CARD_TYPE) return null;
      const topAnchor = editor.pageToViewport({ x: bounds.midX, y: bounds.minY });
      const bottomAnchor = editor.pageToViewport({ x: bounds.midX, y: bounds.maxY });
      const availableAbove = topAnchor.y - INSPECTOR_GAP - INSPECTOR_VIEWPORT_MARGIN;
      const availableBelow =
        viewport.h - bottomAnchor.y - INSPECTOR_GAP - INSPECTOR_VIEWPORT_MARGIN;
      const placement =
        availableAbove >= inspectorHeight || availableAbove >= availableBelow ? 'above' : 'below';
      const position = clampFloatingPanelPosition(
        {
          x: topAnchor.x - INSPECTOR_WIDTH / 2,
          y:
            placement === 'above'
              ? topAnchor.y - INSPECTOR_GAP - inspectorHeight
              : bottomAnchor.y + INSPECTOR_GAP,
        },
        { width: INSPECTOR_WIDTH, height: inspectorHeight },
        { left: 0, top: 0, right: viewport.w, bottom: viewport.h },
        { inset: INSPECTOR_VIEWPORT_MARGIN },
      );
      return {
        shape,
        x: position.x + INSPECTOR_WIDTH / 2,
        y: placement === 'above' ? position.y + inspectorHeight : position.y,
        placement,
      };
    },
    [editor, actions.inspectorId, inspectorHeight],
  );

  useLayoutEffect(() => {
    const element = inspectorRef.current;
    if (!element) return;
    const measure = () => {
      const height = element.getBoundingClientRect().height;
      if (height > 0)
        setInspectorHeight((current) => (Math.abs(current - height) < 0.5 ? current : height));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [actions.inspectorId, state?.shape.props.kind, state?.shape.props.variantId]);

  if (!state) return null;

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
          <FiX />
        </button>
      </div>
      <div className="component-inspector__identity">
        <Icon className={`component-logo component-logo--${state.shape.props.kind}`} />
        <span>
          <strong>{variant.label}</strong>
          <small>{architectureMeta[state.shape.props.kind].role}</small>
        </span>
      </div>
      <span className="inspector-label">IMPLEMENTATION</span>
      <div className="inspector-variants">
        {architectureVariants[state.shape.props.kind].map((candidate) => {
          const VariantIcon = candidate.icon;
          return (
            <button
              key={candidate.id}
              className={candidate.id === variant.id ? 'inspector-variant--active' : ''}
              onClick={() => actions.updateVariant(state.shape.props.nodeId, candidate.id)}
            >
              <VariantIcon />
              <span>
                <strong>{candidate.label}</strong>
                <small>{candidate.description}</small>
              </span>
            </button>
          );
        })}
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

const shapeUtils = [ArchitectureCardShapeUtil];
const tldrawComponents = {
  ContextMenu: null,
  InFrontOfTheCanvas: ArchitectureInspectorOverlay,
} satisfies TLComponents;

type Props = {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  tool: 'hand' | 'selection' | 'connection';
  onNodesChange: (nodes: ArchitectureNode[]) => void;
  onEdgesChange: (edges: ArchitectureEdge[]) => void;
  onMountEditor: (editor: Editor) => void;
  onToolChange: (tool: 'hand' | 'selection' | 'connection') => void;
  inspectorId?: string | null;
  onCloseInspector?: () => void;
  onUpdateVariant?: (nodeId: string, variantId: string) => void;
  onNodeRenamed?: (nodeId: string, label: string) => void;
  validationStates?: Map<string, ArchitectureNodeValidationState>;
};

const shapeIdForNode = (nodeId: string) => createShapeId(nodeId);
const shapeIdForEdge = (edgeId: string) => createShapeId(edgeId);
const recordId = (shapeId: string) => (shapeId.startsWith('shape:') ? shapeId.slice(6) : shapeId);

function normalizedAnchor(anchor?: EdgeAnchor) {
  if (!anchor) return { x: 0.5, y: 0.5 };
  if (anchor.side === 'left') return { x: 0, y: anchor.offset };
  if (anchor.side === 'right') return { x: 1, y: anchor.offset };
  if (anchor.side === 'top') return { x: anchor.offset, y: 0 };
  return { x: anchor.offset, y: 1 };
}

function edgeAnchor(point: { x: number; y: number }): EdgeAnchor {
  const candidates = [
    { side: 'left' as const, distance: Math.abs(point.x), offset: point.y },
    { side: 'right' as const, distance: Math.abs(1 - point.x), offset: point.y },
    { side: 'top' as const, distance: Math.abs(point.y), offset: point.x },
    { side: 'bottom' as const, distance: Math.abs(1 - point.y), offset: point.x },
  ];
  const nearest = candidates.sort((a, b) => a.distance - b.distance)[0];
  return { side: nearest.side, offset: Math.min(0.98, Math.max(0.02, nearest.offset)) };
}

function architectureContentKey(nodes: ArchitectureNode[], edges: ArchitectureEdge[]) {
  return JSON.stringify({
    nodes: nodes
      .map(({ id, position, data }) => ({ id, position, data }))
      .sort((left, right) => left.id.localeCompare(right.id)),
    edges: edges
      .map(({ id, source, target, label, data }) => ({ id, source, target, label, data }))
      .sort((left, right) => left.id.localeCompare(right.id)),
  });
}

function renderedEdgesKey(nodes: ArchitectureNode[], edges: ArchitectureEdge[]) {
  const referencedNodeIds = new Set(edges.flatMap(({ source, target }) => [source, target]));
  return architectureContentKey(
    nodes.filter(({ id }) => referencedNodeIds.has(id)),
    edges,
  );
}

function componentPoint(node: ArchitectureNode) {
  return node.data.isAnchor
    ? { x: node.position.x, y: node.position.y }
    : { x: node.position.x + CARD_WIDTH / 2, y: node.position.y + CARD_HEIGHT / 2 };
}

function createArrow(editor: Editor, edge: ArchitectureEdge, nodes: ArchitectureNode[]) {
  const source = nodes.find((node) => node.id === edge.source);
  const target = nodes.find((node) => node.id === edge.target);
  if (!source || !target) return;
  const start = componentPoint(source);
  const end = componentPoint(target);
  const arrowId = shapeIdForEdge(edge.id);
  editor.createShape<TLArrowShape>({
    id: arrowId,
    type: 'arrow',
    x: start.x,
    y: start.y,
    props: {
      kind: 'arc',
      start: { x: 0, y: 0 },
      end: { x: end.x - start.x, y: end.y - start.y },
      bend: edge.data?.bend?.normal ?? 0,
      color: 'light-blue',
      labelColor: 'light-blue',
      fill: 'none',
      dash: 'solid',
      size: 's',
      arrowheadStart: 'none',
      arrowheadEnd: 'arrow',
      font: 'mono',
      richText: toRichText(edge.data?.protocol ?? String(edge.label ?? '')),
      labelPosition: edge.data?.bend?.along ?? 0.5,
      scale: 1,
      elbowMidPoint: 0.5,
    },
  });
  if (!source.data.isAnchor) {
    editor.createBinding({
      type: 'arrow',
      fromId: arrowId,
      toId: shapeIdForNode(source.id),
      props: {
        terminal: 'start',
        normalizedAnchor: normalizedAnchor(edge.data?.sourceAnchor),
        isPrecise: Boolean(edge.data?.sourceAnchor),
        isExact: false,
        snap: 'none',
      },
    });
  }
  if (!target.data.isAnchor) {
    editor.createBinding({
      type: 'arrow',
      fromId: arrowId,
      toId: shapeIdForNode(target.id),
      props: {
        terminal: 'end',
        normalizedAnchor: normalizedAnchor(edge.data?.targetAnchor),
        isPrecise: Boolean(edge.data?.targetAnchor),
        isExact: false,
        snap: 'none',
      },
    });
  }
}

function reconcileArrowBinding(
  editor: Editor,
  arrowId: TLArrowShape['id'],
  terminal: 'start' | 'end',
  node: ArchitectureNode,
  anchor: EdgeAnchor | undefined,
  existing: ReturnType<typeof getArrowBindings>['start'],
) {
  if (node.data.isAnchor) {
    if (existing) editor.deleteBinding(existing.id);
    return;
  }
  const toId = shapeIdForNode(node.id);
  const props = {
    terminal,
    normalizedAnchor: normalizedAnchor(anchor),
    isPrecise: Boolean(anchor),
    isExact: false,
    snap: 'none' as const,
  };
  if (existing?.toId === toId) editor.updateBinding({ ...existing, props });
  else {
    if (existing) editor.deleteBinding(existing.id);
    editor.createBinding({ type: 'arrow', fromId: arrowId, toId, props });
  }
}

function updateArrow(editor: Editor, edge: ArchitectureEdge, nodes: ArchitectureNode[]) {
  const arrowId = shapeIdForEdge(edge.id);
  const existing = editor.getShape<TLArrowShape>(arrowId);
  if (!existing) {
    createArrow(editor, edge, nodes);
    return;
  }
  const source = nodes.find((node) => node.id === edge.source);
  const target = nodes.find((node) => node.id === edge.target);
  if (!source || !target) return;
  const start = componentPoint(source);
  const end = componentPoint(target);
  const bindings = getArrowBindings(editor, existing);
  editor.updateShape<TLArrowShape>({
    id: arrowId,
    type: 'arrow',
    x: start.x,
    y: start.y,
    props: {
      kind: 'arc',
      start: { x: 0, y: 0 },
      end: { x: end.x - start.x, y: end.y - start.y },
      bend: edge.data?.bend?.normal ?? 0,
      color: 'light-blue',
      labelColor: 'light-blue',
      fill: 'none',
      dash: 'solid',
      size: 's',
      arrowheadStart: 'none',
      arrowheadEnd: 'arrow',
      font: 'mono',
      richText: toRichText(edge.data?.protocol ?? String(edge.label ?? '')),
      labelPosition: edge.data?.bend?.along ?? 0.5,
    },
  });
  reconcileArrowBinding(editor, arrowId, 'start', source, edge.data?.sourceAnchor, bindings.start);
  reconcileArrowBinding(editor, arrowId, 'end', target, edge.data?.targetAnchor, bindings.end);
}

export function TldrawArchitectureCanvas({
  nodes,
  edges,
  tool,
  onNodesChange,
  onEdgesChange,
  onMountEditor,
  onToolChange,
  inspectorId = null,
  onCloseInspector = () => undefined,
  onUpdateVariant = () => undefined,
  onNodeRenamed = () => undefined,
  validationStates,
}: Props) {
  const [editor, setEditor] = useState<Editor | null>(null);
  const toolRef = useRef(tool);
  const pendingHotspotStartRef = useRef<PendingHotspotStart | null>(null);
  const syncFrame = useRef<number | null>(null);
  const lastCardPointerDown = useRef<{
    shapeId: ArchitectureCardShape['id'];
    timestamp: number;
  } | null>(null);
  const lastEmittedState = useRef<string | null>(null);
  const lastRenderedEdges = useRef<string | null>(null);
  const canvasHydrated = useRef(false);
  const didInitialFit = useRef(false);
  const lastArrowCount = useRef(0);
  const canvasActions = useMemo<ArchitectureCanvasActions>(
    () => ({
      inspectorId,
      closeInspector: onCloseInspector,
      updateVariant: onUpdateVariant,
      nodeRenamed: onNodeRenamed,
      queueHotspotStart: (pending) => {
        pendingHotspotStartRef.current = pending;
      },
      isCurrentHotspotStart: (pending) => pendingHotspotStartRef.current === pending,
      clearHotspotStart: (pending) => {
        if (pendingHotspotStartRef.current === pending) pendingHotspotStartRef.current = null;
      },
    }),
    [inspectorId, onCloseInspector, onUpdateVariant, onNodeRenamed],
  );

  useLayoutEffect(() => {
    toolRef.current = tool;
  }, [tool]);

  useEffect(() => {
    const preserveBrowserZoom = (event: KeyboardEvent) => {
      if (isBrowserZoomShortcut(event)) event.stopPropagation();
    };
    window.addEventListener('keydown', preserveBrowserZoom, true);
    return () => window.removeEventListener('keydown', preserveBrowserZoom, true);
  }, []);

  useEffect(() => {
    if (!editor) return;
    editor.setCurrentTool(
      tool === 'selection' ? 'select' : tool === 'connection' ? 'arrow' : 'hand',
    );
  }, [editor, tool]);

  useEffect(() => {
    if (!editor) return;
    return editor.sideEffects.registerAfterCreateHandler('shape', (shape, source) => {
      const pending = pendingHotspotStartRef.current;
      if (source === 'user' && shape.type === 'arrow' && pending) {
        requestAnimationFrame(() => {
          if (
            pendingHotspotStartRef.current === pending &&
            finalizePendingHotspotStart(editor, pending)
          ) {
            pendingHotspotStartRef.current = null;
          }
        });
      }
      if (source !== 'user' || isSupportedArchitectureCanvasShape(shape)) return;
      editor.deleteShape(shape.id);
      editor.setCurrentTool('select');
    });
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    const componentNodes = nodes.filter((node) => !node.data.isAnchor);
    const desiredNodeIds = new Set(componentNodes.map((node) => shapeIdForNode(node.id)));
    const currentCards = editor
      .getCurrentPageShapes()
      .filter((shape): shape is ArchitectureCardShape => shape.type === CARD_TYPE);
    const currentByNodeId = new Map(currentCards.map((shape) => [shape.props.nodeId, shape]));
    const architectureUpdates: ArchitectureCardShape[] = [];
    const validationUpdates: ArchitectureCardShape[] = [];
    for (const node of componentNodes) {
      const existing = currentByNodeId.get(node.id);
      const validationState = validationStates?.get(node.id);
      const validation = validationState?.status ?? 'idle';
      const validationMessage =
        validationState?.issues
          .map(({ message, suggestion }) => `${message}\n${suggestion}`)
          .join('\n\n') ?? '';
      if (!existing) {
        editor.createShape<ArchitectureCardShape>({
          id: shapeIdForNode(node.id),
          type: CARD_TYPE,
          x: node.position.x,
          y: node.position.y,
          props: {
            w: CARD_WIDTH,
            h: CARD_HEIGHT,
            nodeId: node.id,
            label: node.data.label,
            kind: node.data.kind,
            variantId: node.data.variantId,
            validation,
            validationMessage,
          },
        });
      } else {
        const architectureChanged =
          existing.x !== node.position.x ||
          existing.y !== node.position.y ||
          existing.props.label !== node.data.label ||
          existing.props.kind !== node.data.kind ||
          existing.props.variantId !== node.data.variantId;
        const validationChanged =
          existing.props.validation !== validation ||
          existing.props.validationMessage !== validationMessage;
        const update: ArchitectureCardShape = {
          ...existing,
          x: node.position.x,
          y: node.position.y,
          props: {
            ...existing.props,
            label: node.data.label,
            kind: node.data.kind,
            variantId: node.data.variantId,
            validation,
            validationMessage,
          },
        };
        if (architectureChanged) architectureUpdates.push(update);
        else if (validationChanged) validationUpdates.push(update);
      }
    }
    if (architectureUpdates.length) editor.updateShapes(architectureUpdates);
    if (validationUpdates.length)
      editor.run(() => editor.updateShapes(validationUpdates), { history: 'ignore' });
    const cardsToDelete = currentCards
      .filter((shape) => !desiredNodeIds.has(shape.id))
      .map((shape) => shape.id);
    if (cardsToDelete.length) editor.deleteShapes(cardsToDelete);

    const currentArrows = editor
      .getCurrentPageShapes()
      .filter((shape): shape is TLArrowShape => shape.type === 'arrow');
    const desiredEdgeIds = new Set(edges.map(({ id }) => shapeIdForEdge(id)));
    const nextRenderedEdges = renderedEdgesKey(nodes, edges);
    if (nextRenderedEdges !== lastRenderedEdges.current) {
      for (const edge of edges) updateArrow(editor, edge, nodes);
      lastRenderedEdges.current = nextRenderedEdges;
    } else {
      for (const edge of edges)
        if (!editor.getShape(shapeIdForEdge(edge.id))) createArrow(editor, edge, nodes);
    }
    const arrowsToDelete = currentArrows
      .filter(({ id }) => !desiredEdgeIds.has(id))
      .map(({ id }) => id);
    if (arrowsToDelete.length) editor.deleteShapes(arrowsToDelete);
    canvasHydrated.current = true;
    if (!didInitialFit.current && componentNodes.length) {
      didInitialFit.current = true;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          editor.zoomToFit();
          editor.clearHistory();
        });
      });
    }
  }, [editor, nodes, edges, validationStates]);

  useEffect(() => {
    if (!editor) return;
    const sync = () => {
      if (!canvasHydrated.current) return;
      const shapes = editor.getCurrentPageShapes();
      const editorTool = editor.getCurrentToolId();
      const nextTool =
        editorTool === 'hand' ? 'hand' : editorTool === 'arrow' ? 'connection' : 'selection';
      if (nextTool !== toolRef.current) onToolChange(nextTool);
      const selected = new Set(editor.getSelectedShapeIds());
      const cards = shapes.filter(
        (shape): shape is ArchitectureCardShape => shape.type === CARD_TYPE,
      );
      const cardById = new Map(cards.map((shape) => [shape.id, shape]));
      const cardNodes: ArchitectureNode[] = cards.map((shape) => ({
        id: shape.props.nodeId,
        type: 'architecture',
        position: { x: shape.x, y: shape.y },
        selected: selected.has(shape.id),
        data: {
          kind: shape.props.kind,
          variantId: shape.props.variantId,
          label: shape.props.label,
        },
      }));
      const nextNodes: ArchitectureNode[] = cardNodes;
      const nextEdges: ArchitectureEdge[] = [];
      const arrows = shapes.filter((shape): shape is TLArrowShape => shape.type === 'arrow');
      for (const arrow of arrows) {
        const bindings = getArrowBindings(editor, arrow);
        const terminals = getArrowTerminalsInArrowSpace(editor, arrow, bindings);
        const transform = editor.getShapePageTransform(arrow);
        const edgeId = recordId(arrow.id);
        const startCard = bindings.start ? cardById.get(bindings.start.toId) : undefined;
        const endCard = bindings.end ? cardById.get(bindings.end.toId) : undefined;
        const sourceId = startCard?.props.nodeId ?? `anchor-${edgeId}-start`;
        const targetId = endCard?.props.nodeId ?? `anchor-${edgeId}-end`;
        if (!startCard) {
          const point = transform.applyToPoint(terminals.start);
          nextNodes.push({
            id: sourceId,
            type: 'architecture',
            position: { x: point.x, y: point.y },
            data: { kind: 'service', variantId: 'anchor', label: '', isAnchor: true },
          });
        }
        if (!endCard) {
          const point = transform.applyToPoint(terminals.end);
          nextNodes.push({
            id: targetId,
            type: 'architecture',
            position: { x: point.x, y: point.y },
            data: { kind: 'service', variantId: 'anchor', label: '', isAnchor: true },
          });
        }
        // HTTP / HTTPS is only the initial suggestion. Once the user edits a
        // non-empty label, keep that text as the connection protocol.
        const currentLabel = renderPlaintextFromRichText(editor, arrow.props.richText).trim();
        const defaultProtocol = startCard && endCard ? getArrowProtocol(startCard.props.kind) : '';
        const protocol =
          currentLabel || (editor.getEditingShapeId() === arrow.id ? '' : defaultProtocol);
        if (!currentLabel && protocol)
          editor.updateShape<TLArrowShape>({
            id: arrow.id,
            type: 'arrow',
            props: {
              richText: toRichText(protocol),
              color: 'light-blue',
              labelColor: 'light-blue',
              font: 'mono',
              size: 's',
              kind: 'arc',
              arrowheadEnd: 'arrow',
            },
          });
        const bend =
          Math.abs(arrow.props.bend) > 0.01 || Math.abs(arrow.props.labelPosition - 0.5) > 0.01
            ? { along: arrow.props.labelPosition, normal: arrow.props.bend }
            : undefined;
        nextEdges.push({
          id: edgeId,
          source: sourceId,
          target: targetId,
          type: 'architecture',
          selected: selected.has(arrow.id),
          label: protocol,
          data: {
            protocol,
            bend,
            sourceAnchor: bindings.start?.props.isPrecise
              ? edgeAnchor(bindings.start.props.normalizedAnchor)
              : undefined,
            targetAnchor: bindings.end?.props.isPrecise
              ? edgeAnchor(bindings.end.props.normalizedAnchor)
              : undefined,
          },
        });
      }
      const emittedState = JSON.stringify({ nodes: nextNodes, edges: nextEdges });
      lastRenderedEdges.current = renderedEdgesKey(nextNodes, nextEdges);
      if (emittedState !== lastEmittedState.current) {
        lastEmittedState.current = emittedState;
        onNodesChange(nextNodes);
        onEdgesChange(nextEdges);
      }
      if (
        arrows.length > lastArrowCount.current &&
        toolRef.current === 'connection' &&
        editor.getPath() === 'arrow.idle'
      ) {
        editor.setCurrentTool('select');
        onToolChange('selection');
      }
      lastArrowCount.current = arrows.length;
    };
    const unsubscribe = editor.store.listen((entry) => {
      const changedRecords = [
        ...Object.values(entry.changes.added),
        ...Object.values(entry.changes.removed),
        ...Object.values(entry.changes.updated).flatMap((records) => records),
      ];
      if (
        !changedRecords.some(
          ({ typeName }) =>
            typeName === 'shape' || typeName === 'binding' || typeName === 'instance_page_state',
        )
      )
        return;
      if (syncFrame.current) cancelAnimationFrame(syncFrame.current);
      const syncWhenIdle = () => {
        if (editor.inputs.getIsDragging()) {
          syncFrame.current = requestAnimationFrame(syncWhenIdle);
          return;
        }
        syncFrame.current = null;
        sync();
      };
      syncFrame.current = requestAnimationFrame(syncWhenIdle);
    });
    return () => {
      unsubscribe();
      if (syncFrame.current) cancelAnimationFrame(syncFrame.current);
    };
  }, [editor, onNodesChange, onEdgesChange, onToolChange]);

  return (
    <div
      className="tldraw-engine"
      onContextMenu={(event) => event.preventDefault()}
      onPointerDownCapture={(event) => {
        if (!editor || event.button !== 0) return;
        const target = event.target as HTMLElement;
        if (target.closest('input, textarea, [contenteditable="true"], button, [role="button"]')) {
          lastCardPointerDown.current = null;
          return;
        }
        const pagePoint = editor.screenToPage({ x: event.clientX, y: event.clientY });
        const card = editor
          .getShapesAtPoint(pagePoint, { hitInside: true })
          .find((shape): shape is ArchitectureCardShape => shape.type === CARD_TYPE);
        if (!card) {
          lastCardPointerDown.current = null;
          return;
        }
        const current = { shapeId: card.id, timestamp: event.timeStamp };
        const previous = lastCardPointerDown.current;
        lastCardPointerDown.current = current;
        if (!isArchitectureCardDoubleClick(previous, current)) return;
        lastCardPointerDown.current = null;
        event.preventDefault();
        event.stopPropagation();
        editor.getShapeUtil(card).onDoubleClick?.(card);
      }}
    >
      <ArchitectureCanvasActionsContext.Provider value={canvasActions}>
        <Tldraw
          hideUi
          components={tldrawComponents}
          shapeUtils={shapeUtils}
          onMount={(nextEditor) => {
            nextEditor.user.updateUserPreferences({
              colorScheme: 'dark',
              isSnapMode: false,
              areKeyboardShortcutsEnabled: false,
            });
            nextEditor.updateInstanceState({ isGridMode: false });
            setArchitectureArrowStyles(nextEditor);
            setEditor(nextEditor);
            onMountEditor(nextEditor);
          }}
        />
      </ArchitectureCanvasActionsContext.Provider>
    </div>
  );
}
