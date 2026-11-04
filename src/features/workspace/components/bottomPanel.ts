import { createContext, useContext } from 'react';

export interface BottomPanelControls {
  expanded: boolean;
  toggle(): void;
}

export const BottomPanelContext = createContext<BottomPanelControls>({
  expanded: false,
  toggle: () => undefined,
});

/** For the panel under the editor: whether it is expanded, and a toggle for its header. */
export const useBottomPanel = () => useContext(BottomPanelContext);
