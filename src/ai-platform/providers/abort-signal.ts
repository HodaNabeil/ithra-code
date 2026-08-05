/**
 * Links an optional caller abort signal with a local AbortController.
 * The returned controller is aborted when either the timeout or caller signal fires.
 */
export function createLinkedAbortController(
  timeoutMs: number,
  callerSignal?: AbortSignal,
): { controller: AbortController; cleanup: () => void } {
  const controller = new AbortController();

  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const onCallerAbort = () => controller.abort();
  if (callerSignal) {
    if (callerSignal.aborted) {
      controller.abort();
    } else {
      callerSignal.addEventListener('abort', onCallerAbort, { once: true });
    }
  }

  return {
    controller,
    cleanup: () => {
      clearTimeout(timeout);
      callerSignal?.removeEventListener('abort', onCallerAbort);
    },
  };
}
