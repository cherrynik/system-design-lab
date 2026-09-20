export type ConnectionNavigationPreview = {
  owner: string;
  nodeIds: readonly string[];
};

export type ConnectionNavigation = {
  scope: string;
  highlightedNodeIds: ReadonlySet<string>;
  preview: (owner: string, nodeIds: readonly string[]) => void;
  clear: (owner: string) => void;
  focus: (nodeIds: readonly string[]) => void;
};
