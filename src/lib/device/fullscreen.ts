/** Fullscreen helpers. Must be called from a user gesture (click/keypress) to succeed. */

export const isFullscreen = () => !!document.fullscreenElement;

/**
 * Requests fullscreen and resolves with whether the page is actually fullscreen. Some embedded or
 * policy-restricted browsers never settle the request promise, so it is capped at `timeoutMs`
 * instead of leaving the candidate stuck on a spinner.
 */
export async function enterFullscreen(timeoutMs = 3000): Promise<boolean> {
  if (isFullscreen()) return true;
  try {
    await Promise.race([
      document.documentElement.requestFullscreen({ navigationUI: 'hide' }),
      new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
    ]);
  } catch {
    /* denied */
  }
  return isFullscreen();
}

export async function exitFullscreen(): Promise<void> {
  if (!isFullscreen()) return;
  try {
    await document.exitFullscreen();
  } catch {
    /* already exited */
  }
}
