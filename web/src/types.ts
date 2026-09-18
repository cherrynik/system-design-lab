export type ArchitectureNodeKind = 'client' | 'load-balancer' | 'service';

export interface Exercise {
  id: string;
  title: string;
  description: string;
  requirement: {
    id: string;
    title: string;
    description: string;
  };
}

export interface ValidationResult {
  requirementId: string;
  status: 'passed' | 'failed';
  message: string;
  involvedNodeIds?: string[];
}
