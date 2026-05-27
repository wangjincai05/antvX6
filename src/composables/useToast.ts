import { getCurrentInstance, type ComponentInternalInstance } from 'vue';
import type { ToastItem } from '@/components/common/Toast.vue';

interface ToastOptions {
  duration?: number;
}

interface ToastApi {
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  warning: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
}

export function useToast(): ToastApi {
  const instance = getCurrentInstance() as ComponentInternalInstance;

  const emitToast = (type: ToastItem['type'], message: string, options?: ToastOptions) => {
    if (instance?.appContext.config.globalProperties.$toast) {
      instance.appContext.config.globalProperties.$toast({
        message,
        type,
        duration: options?.duration,
      });
    } else {
      console.warn('Toast component not registered');
    }
  };

  return {
    success: (message: string, options?: ToastOptions) => emitToast('success', message, options),
    error: (message: string, options?: ToastOptions) => emitToast('error', message, options),
    warning: (message: string, options?: ToastOptions) => emitToast('warning', message, options),
    info: (message: string, options?: ToastOptions) => emitToast('info', message, options),
  };
}
