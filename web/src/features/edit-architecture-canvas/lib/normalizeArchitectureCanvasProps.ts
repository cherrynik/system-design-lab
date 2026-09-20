import type {
  ArchitectureCanvasCallbacks,
  NormalizedArchitectureCanvasRuntime,
} from '../model/architectureCanvasRuntime.types';
import type { TldrawArchitectureCanvasProps } from '../model/architectureCanvas.types';

const doNothing = () => undefined;
const doNothingWithNode = (_nodeId: string, _value: string) => undefined;
const doNothingWithNodes: ArchitectureCanvasCallbacks['onNodesChange'] = () => undefined;
const doNothingWithEdges: ArchitectureCanvasCallbacks['onEdgesChange'] = () => undefined;
const doNothingWithTool: ArchitectureCanvasCallbacks['onToolChange'] = () => undefined;

export function normalizeArchitectureCanvasProps(
  props: TldrawArchitectureCanvasProps,
): NormalizedArchitectureCanvasRuntime {
  if (props.mode === 'readonly') {
    return {
      mode: 'readonly',
      tool: 'hand',
      actionCallbacks: {
        inspectorId: null,
        closeInspector: doNothing,
        updateVariant: doNothingWithNode,
        nodeRenamed: doNothingWithNode,
      },
      storeCallbacks: {
        onNodesChange: doNothingWithNodes,
        onEdgesChange: doNothingWithEdges,
        onToolChange: doNothingWithTool,
      },
    };
  }

  return {
    mode: 'interactive',
    tool: props.tool,
    actionCallbacks: {
      inspectorId: props.inspectorId ?? null,
      closeInspector: props.onCloseInspector ?? doNothing,
      updateVariant: props.onUpdateVariant ?? doNothingWithNode,
      nodeRenamed: props.onNodeRenamed ?? doNothingWithNode,
    },
    storeCallbacks: {
      onNodesChange: props.onNodesChange,
      onEdgesChange: props.onEdgesChange,
      onToolChange: props.onToolChange,
      onConnectionDraft: props.onConnectionDraft,
    },
  };
}
