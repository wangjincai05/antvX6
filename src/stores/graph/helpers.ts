import { DEFAULT_DURATION } from './constants';
import { useToast } from '@/composables/useToast';

export function isValidMessage(message: unknown): message is string {
  return typeof message === 'string' && message.length > 0;
}

export function isValidDuration(duration: unknown): duration is number {
  return typeof duration === 'number' && duration >= 0;
}

export function isValidGraphRef(ref: unknown): ref is { value: unknown } | null {
  return ref !== undefined;
}

export function showStatusMessage(
  toast: ReturnType<typeof useToast>,
  message: string,
  duration: number = DEFAULT_DURATION
): void {
  if (!isValidMessage(message)) {
    return;
  }

  const validDuration = isValidDuration(duration) ? duration : DEFAULT_DURATION;
  toast.info(message, { duration: validDuration });
}
