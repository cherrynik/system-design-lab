export type ArchitectureNodeValidationSeverity = 'warning' | 'error';

export type ArchitectureNodeValidationIssue = {
  code: 'NODE_INPUT_REQUIRED' | 'NODE_OUTPUT_REQUIRED' | 'NODE_SELF_CONNECTION';
  nodeId: string;
  severity: ArchitectureNodeValidationSeverity;
  message: string;
  suggestion: string;
};

export type ArchitectureNodeValidationState = {
  status: 'valid' | ArchitectureNodeValidationSeverity;
  issues: ArchitectureNodeValidationIssue[];
};
