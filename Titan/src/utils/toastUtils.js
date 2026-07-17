import { toast } from 'react-toastify';

// Store recent toast messages to prevent duplicates
const recentToasts = new Map();
const TOAST_COOLDOWN = 3000; // 3 seconds

/**
 * Show error toast with deduplication
 * Prevents the same error from appearing multiple times within TOAST_COOLDOWN period
 */
export const showErrorToast = (message) => {
  const key = `error_${message}`;
  const now = Date.now();
  const lastShown = recentToasts.get(key);

  // If same error was shown recently, skip it
  if (lastShown && now - lastShown < TOAST_COOLDOWN) {
    return;
  }

  recentToasts.set(key, now);
  toast.error(message);

  // Clean up old entries periodically
  if (recentToasts.size > 50) {
    for (const [k, v] of recentToasts) {
      if (now - v > TOAST_COOLDOWN * 2) {
        recentToasts.delete(k);
      }
    }
  }
};

/**
 * Show success toast
 */
export const showSuccessToast = (message) => {
  toast.success(message);
};

/**
 * Show info toast
 */
export const showInfoToast = (message) => {
  toast.info(message);
};

/**
 * Show warning toast
 */
export const showWarningToast = (message) => {
  toast.warning(message);
};

/**
 * Extract error message from axios error or any error object
 */
export const getErrorMessage = (error, defaultMessage = 'An error occurred') => {
  if (typeof error === 'string') {
    return error;
  }
  return error?.response?.data?.message || error?.message || defaultMessage;
};
