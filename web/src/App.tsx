import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  addEdge,
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { evaluateArchitecture, fetchExercise, type ArchitectureNode } from './api';
import type { ArchitectureNodeKind, Exercise, ValidationResult } from './types';

const initialNodes: ArchitectureNode[] = [
  { id: 'client-1', type: 'architecture', position: { x: 70, y: 180 }, data: { label: 'Client', kind: 'client' } },
  { id: 'service-1', type: 'architecture', position: { x: 520, y: 180 }, data: { label: 'Service', kind: 'service' } },
];

const nodeLabel: Record<ArchitectureNodeKind, string> = {
  client: 'Client',
  'load-balancer': 'Load Balancer',
  service: 'Service',
};

function ArchitectureNodeView({ data }: NodeProps<ArchitectureNode>) {
  return (
    <div className={`architecture-node architecture-node--${data.kind}`}>
      <Handle type="target" position={Position.Left} />
      <span className="node-kicker">{data.kind.replace('-', ' ')}</span>
      <strong>{data.label}</strong>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export default function App() {
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<ArchitectureNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const nodeTypes = useMemo(() => ({ architecture: ArchitectureNodeView }), []);

  useEffect(() => {
    fetchExercise().then(setExercise).catch((cause: Error) => setError(cause.message));
  }, []);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((current) => addEdge({ ...connection, markerEnd: { type: MarkerType.ArrowClosed } }, current)),
    [setEdges],
  );

  const addNode = (kind: ArchitectureNodeKind) => {
    const count = nodes.filter((node) => node.data.kind === kind).length + 1;
    setNodes((current) => [
      ...current,
      {
        id: `${kind}-${crypto.randomUUID()}`,
        type: 'architecture',
        position: { x: 240 + count * 24, y: 90 + count * 72 },
        data: { kind, label: `${nodeLabel[kind]} ${count}` },
      },
    ]);
  };

  const validate = async () => {
    setValidating(true);
    setError(null);
    try {
      setResults(await evaluateArchitecture(nodes, edges));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unexpected evaluation error.');
    } finally {
      setValidating(false);
    }
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-mark">SD</div>
        <div>
          <span className="eyebrow">System Design Lab</span>
          <h1>{exercise?.title ?? 'Loading exercise…'}</h1>
        </div>
        <span className="version">v0.1 · Path existence</span>
      </header>

      <section className="workspace">
        <aside className="panel requirements-panel">
          <span className="section-number">01</span>
          <h2>Requirement</h2>
          <p className="lead">{exercise?.description}</p>
          <div className="requirement-card">
            <span className="requirement-dot" />
            <div>
              <strong>{exercise?.requirement.title}</strong>
              <p>{exercise?.requirement.description}</p>
            </div>
          </div>

          <div className="catalog">
            <span className="small-label">Add component</span>
            {(['client', 'load-balancer', 'service'] as ArchitectureNodeKind[]).map((kind) => (
              <button key={kind} className="catalog-button" onClick={() => addNode(kind)}>
                <span className={`catalog-icon catalog-icon--${kind}`} />
                {nodeLabel[kind]}
                <span>+</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="canvas-panel">
          <div className="canvas-toolbar">
            <div>
              <span className="small-label">Architecture canvas</span>
              <span className="canvas-hint">Connect handles from left to right. Select and delete nodes or edges.</span>
            </div>
            <button className="validate-button" onClick={validate} disabled={validating}>
              {validating ? 'Running…' : 'Validate architecture'}
            </button>
          </div>
          <div className="canvas">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
              deleteKeyCode={['Backspace', 'Delete']}
            >
              <Background color="#27324a" gap={24} size={1} />
              <Controls position="bottom-right" />
            </ReactFlow>
          </div>
        </section>

        <aside className="panel validation-panel">
          <span className="section-number">02</span>
          <h2>Validation</h2>
          {error && <div className="error-card">{error}</div>}
          {!error && results.length === 0 && (
            <div className="empty-result">
              <div className="terminal-prompt">$</div>
              <strong>Ready to evaluate</strong>
              <p>Build a request path, then run the deterministic check.</p>
            </div>
          )}
          {results.map((result) => (
            <article key={result.requirementId} className={`result-card result-card--${result.status}`}>
              <span className="result-status">{result.status === 'passed' ? 'PASS' : 'FAIL'}</span>
              <strong>{exercise?.requirement.title}</strong>
              <p>{result.message}</p>
              {result.involvedNodeIds && <code>{result.involvedNodeIds.join(' → ')}</code>}
            </article>
          ))}
          <div className="engine-note">
            <span>ENGINE</span>
            <p>Checks directed graph reachability. It does not compare your graph with a reference picture.</p>
          </div>
        </aside>
      </section>
    </main>
  );
}
