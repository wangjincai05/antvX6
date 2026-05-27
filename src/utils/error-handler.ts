export class WorkflowError extends Error {
  constructor(
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'WorkflowError';
  }
}

export class GraphError extends Error {
  constructor(
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'GraphError';
  }
}

export class ExecutionError extends Error {
  constructor(
    message: string,
    public code?: string,
    public nodeId?: string
  ) {
    super(message);
    this.name = 'ExecutionError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public code?: string,
    public field?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export interface ErrorInfo {
  message: string;
  code?: string;
  field?: string;
  nodeId?: string;
  stack?: string;
}

export const errorCodes = {
  WORKFLOW_EMPTY: 'WORKFLOW_EMPTY',
  WORKFLOW_CYCLE: 'WORKFLOW_CYCLE',
  WORKFLOW_MISSING_START: 'WORKFLOW_MISSING_START',
  WORKFLOW_MULTIPLE_STARTS: 'WORKFLOW_MULTIPLE_STARTS',
  WORKFLOW_MISSING_END: 'WORKFLOW_MISSING_END',
  CONNECTION_INVALID: 'CONNECTION_INVALID',
  CONNECTION_SELF: 'CONNECTION_SELF',
  CONNECTION_DUPLICATE: 'CONNECTION_DUPLICATE',
  NODE_NOT_FOUND: 'NODE_NOT_FOUND',
  NODE_TYPE_INVALID: 'NODE_TYPE_INVALID',
  GRAPH_NOT_INITIALIZED: 'GRAPH_NOT_INITIALIZED',
  EXECUTION_FAILED: 'EXECUTION_FAILED',
  EXECUTION_TIMEOUT: 'EXECUTION_TIMEOUT',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  PARSE_ERROR: 'PARSE_ERROR',
};

export const errorMessages: Record<string, string> = {
  [errorCodes.WORKFLOW_EMPTY]: '工作流为空',
  [errorCodes.WORKFLOW_CYCLE]: '检测到循环依赖',
  [errorCodes.WORKFLOW_MISSING_START]: '缺少开始节点',
  [errorCodes.WORKFLOW_MULTIPLE_STARTS]: '只能有一个开始节点',
  [errorCodes.WORKFLOW_MISSING_END]: '缺少结束节点',
  [errorCodes.CONNECTION_INVALID]: '无效的连接',
  [errorCodes.CONNECTION_SELF]: '不能连接到自身',
  [errorCodes.CONNECTION_DUPLICATE]: '这两节点之间已存在连线',
  [errorCodes.NODE_NOT_FOUND]: '节点不存在',
  [errorCodes.NODE_TYPE_INVALID]: '无效的节点类型',
  [errorCodes.GRAPH_NOT_INITIALIZED]: '图形实例未初始化',
  [errorCodes.EXECUTION_FAILED]: '执行失败',
  [errorCodes.EXECUTION_TIMEOUT]: '执行超时',
  [errorCodes.VALIDATION_FAILED]: '验证失败',
  [errorCodes.PARSE_ERROR]: '解析错误',
};

export function createWorkflowError(code: string, detail?: string): WorkflowError {
  let message = errorMessages[code] || code;
  if (detail) {
    message = `${message}: ${detail}`;
  }
  return new WorkflowError(message, code);
}

export function createGraphError(code: string, detail?: string): GraphError {
  let message = errorMessages[code] || code;
  if (detail) {
    message = `${message}: ${detail}`;
  }
  return new GraphError(message, code);
}

export function createExecutionError(
  code: string,
  detail?: string,
  nodeId?: string
): ExecutionError {
  let message = errorMessages[code] || code;
  if (detail) {
    message = `${message}: ${detail}`;
  }
  return new ExecutionError(message, code, nodeId);
}

export function createValidationError(
  code: string,
  field?: string,
  detail?: string
): ValidationError {
  let message = errorMessages[code] || code;
  if (detail) {
    message = `${message}: ${detail}`;
  }
  return new ValidationError(message, code, field);
}

export function handleError(error: unknown): ErrorInfo {
  if (error instanceof Error) {
    return {
      message: error.message,
      code: (error as WorkflowError | GraphError | ExecutionError | ValidationError).code,
      field: (error as ValidationError).field,
      nodeId: (error as ExecutionError).nodeId,
      stack: error.stack,
    };
  }
  return {
    message: String(error),
  };
}

export function logError(error: unknown, context?: string): void {
  const errorInfo = handleError(error);
  console.error(`[Workflow Error${context ? `: ${context}` : ''}]`, errorInfo);
}

export function showError(error: unknown): void {
  const errorInfo = handleError(error);
  (window as unknown as { $toast: (options: { message: string; type?: string }) => void }).$toast?.(
    {
      message: errorInfo.message,
      type: 'error',
    }
  );
}
