/**
 * Hover behaviour of the question list: it opens after a short pause on the Questions button (so
 * sweeping the mouse past doesn't flash it) and stays open while the pointer is over the button or
 * the list, closing shortly after it leaves both.
 */
import { useWorkspaceUi } from './workspaceStore';

const OPEN_DELAY_MS = 90;
const CLOSE_DELAY_MS = 260;

let openTimer: ReturnType<typeof setTimeout> | undefined;
let closeTimer: ReturnType<typeof setTimeout> | undefined;

const clear = () => {
  clearTimeout(openTimer);
  clearTimeout(closeTimer);
  openTimer = closeTimer = undefined;
};

export const questionsHover = {
  enter() {
    clear();
    if (useWorkspaceUi.getState().questionsOpen) return;
    openTimer = setTimeout(() => useWorkspaceUi.getState().set({ questionsOpen: true }), OPEN_DELAY_MS);
  },
  leave() {
    clear();
    closeTimer = setTimeout(() => useWorkspaceUi.getState().set({ questionsOpen: false }), CLOSE_DELAY_MS);
  },
  /** Close now (a question was picked, or Escape). */
  close() {
    clear();
    useWorkspaceUi.getState().set({ questionsOpen: false });
  },
};
