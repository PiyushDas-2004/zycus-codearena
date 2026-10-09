/** UI state of proctoring (overlays, camera indicator). Detectors live in ProctoringController. */
import { create } from 'zustand';

/** Conditions that pause the assessment until resolved, most urgent first. */
export const BLOCKERS = ['camera', 'display', 'fullscreen'] as const;
export type Blocker = (typeof BLOCKERS)[number];

export type CameraStatus = 'off' | 'starting' | 'live' | 'blocked' | 'unavailable';

export interface WarningNotice {
  id: number;
  type: string;
  /** "Warning {occurrence} of {warnings}". */
  occurrence: number;
  warnings: number;
  /** What happens next (see consequenceLine). */
  detail: string;
}

interface ProctoringUi {
  blockers: Blocker[];
  warning: WarningNotice | null;
  camera: CameraStatus;
  cameraStream: MediaStream | null;
  /** Faces seen in the latest check (null: face detection not running). */
  faces: number | null;
  set: (patch: Partial<Omit<ProctoringUi, 'set' | 'setBlocker' | 'reset'>>) => void;
  setBlocker: (blocker: Blocker, active: boolean) => void;
  reset: () => void;
}

const initial = {
  blockers: [] as Blocker[],
  warning: null,
  camera: 'off' as CameraStatus,
  cameraStream: null,
  faces: null,
};

export const useProctoring = create<ProctoringUi>((set, get) => ({
  ...initial,
  set: (patch) => set(patch),
  setBlocker: (blocker, active) => {
    const has = get().blockers.includes(blocker);
    if (active === has) return;
    const next = active ? [...get().blockers, blocker] : get().blockers.filter((b) => b !== blocker);
    set({ blockers: BLOCKERS.filter((b) => next.includes(b)) });
  },
  reset: () => set(initial),
}));
