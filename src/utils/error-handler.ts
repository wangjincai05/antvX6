export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'EXECUTION_ERROR'
  | 'NETWORK_ERROR'
  | 'PARSE_ERROR'
  | 'AUTH_ERROR'
  | 'NOT_FOUND_ERROR'
  | 'TIMEOUT_ERROR'
  | 'UNKNOWN_ERROR';

export interface ErrorContext {
  nodeId?: string;
  edgeId?: string;
  workflowId?: string;
  operation?: string;
  timestamp?: number;
  stack?: string;
  [key: string]: unknown;
}

export class WorkflowError extends Error {
  code: ErrorCode;
  context: ErrorContext;
  originalError?: Error;

  constructor(message: string, code: ErrorCode, context: ErrorContext = {}, originalError?: Error) {
    super(message);
    this.name = 'WorkflowError';
    this.code = code;
    this.context = { timestamp: Date.now(), ...context };
    this.originalError = originalError;

    if (originalError) {
      this.stack = originalError.stack;
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      stack: this.stack,
    };
  }
}

export class ValidationError extends WorkflowError {
  constructor(message: string, context: ErrorContext = {}) {
    super(message, 'VALIDATION_ERROR', context);
    this.name = 'ValidationError';
  }
}

export class ExecutionError extends WorkflowError {
  constructor(message: string, context: ErrorContext = {}, originalError?: Error) {
    super(message, 'EXECUTION_ERROR', context, originalError);
    this.name = 'ExecutionError';
  }
}

export class NetworkError extends WorkflowError {
  constructor(message: string, context: ErrorContext = {}, originalError?: Error) {
    super(message, 'NETWORK_ERROR', context, originalError);
    this.name = 'NetworkError';
  }
}

export class ParseError extends WorkflowError {
  constructor(message: string, context: ErrorContext = {}, originalError?: Error) {
    super(message, 'PARSE_ERROR', context, originalError);
    this.name = 'ParseError';
  }
}

export interface ErrorHandlerOptions {
  showToast?: boolean;
  logErrors?: boolean;
  onError?: (error: WorkflowError) => void;
}

export class ErrorHandler {
  private options: ErrorHandlerOptions;

  constructor(options: ErrorHandlerOptions = {}) {
    this.options = {
      showToast: true,
      logErrors: true,
      ...options,
    };
  }

  handle(error: unknown): WorkflowError {
    const workflowError = this.normalizeError(error);

    if (this.options.logErrors) {
      this.logError(workflowError);
    }

    if (this.options.showToast) {
      this.showErrorToast(workflowError);
    }

    if (this.options.onError) {
      this.options.onError(workflowError);
    }

    return workflowError;
  }

  normalizeError(error: unknown): WorkflowError {
    if (error instanceof WorkflowError) {
      return error;
    }

    if (error instanceof Error) {
      if (
        error.message.includes('network') ||
        error.message.includes('fetch') ||
        error.message.includes('timeout')
      ) {
        return new NetworkError(error.message, {}, error);
      }
      if (error.message.includes('parse') || error.message.includes('JSON')) {
        return new ParseError(error.message, {}, error);
      }
      return new ExecutionError(error.message, {}, error);
    }

    if (typeof error === 'string') {
      return new WorkflowError(error, 'UNKNOWN_ERROR');
    }

    return new WorkflowError('Unknown error occurred', 'UNKNOWN_ERROR');
  }

  logError(error: WorkflowError): void {
    console.error('[Workflow Error]', {
      code: error.code,
      message: error.message,
      context: error.context,
      stack: error.stack,
    });
  }

  showErrorToast(error: WorkflowError): void {
    const toast = useToast();
    const message = this.formatErrorMessage(error);
    toast.error(message);
  }

  formatErrorMessage(error: WorkflowError): string {
    const contextInfo = error.context.nodeId
      ? ` [节点: ${error.context.nodeId}]`
      : error.context.workflowId
        ? ` [工作流: ${error.context.workflowId}]`
        : '';

    return `${error.message}${contextInfo}`;
  }

  wrap<T>(fn: () => T): T {
    try {
      return fn();
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  async wrapAsync<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      throw this.normalizeError(error);
    }
  }
}

let defaultErrorHandler: ErrorHandler | null = null;

export function getErrorHandler(): ErrorHandler {
  if (!defaultErrorHandler) {
    defaultErrorHandler = new ErrorHandler();
  }
  return defaultErrorHandler;
}

export function setErrorHandler(handler: ErrorHandler): void {
  defaultErrorHandler = handler;
}

export function handleError(error: unknown): WorkflowError {
  return getErrorHandler().handle(error);
}

function useToast() {
  return {
    error: (message: string) => console.error('Toast Error:', message),
    success: (message: string) => console.log('Toast Success:', message),
    warning: (message: string) => console.warn('Toast Warning:', message),
    info: (message: string) => console.info('Toast Info:', message),
  };
}
