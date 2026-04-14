export interface WorkflowNodeDto {
  id: string;
  type: string;
  label: string;
  position: { x: number; y: number };
  data: Record<string, any>;
}

export interface WorkflowEdgeDto {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface CreateWorkflowDto {
  title: string;
  description?: string;
  projectId?: string;
  trigger?: string;
}

export interface EditWorkflowDto {
  title?: string;
  description?: string;
  nodes?: WorkflowNodeDto[];
  edges?: WorkflowEdgeDto[];
  trigger?: string;
  active?: boolean;
}
