/**
 * DEVELOPMENT ONLY. Embedded preview panes and some test runners cannot grant camera or full-screen
 * access, which would stop the flow at the system check. With this switch on, the CLIENT ignores the
 * template's webcam, face detection, full-screen and keyboard-lock settings so everything else can
 * be exercised against a real (staging) backend; the server and its data are unaffected.
 *
 * Wired in only when `import.meta.env.DEV` is true, which Vite replaces with `false` in production
 * builds, so this module is dropped from the production bundle.
 *
 *   window.__codearenaDev.setRelaxedProctoring(true)   // then reload the page
 */
import type { CandidateApi, SessionState } from './types';

const KEY = 'codearena.dev.relaxedProctoring';

export function relaxedProctoringEnabled(): boolean {
  try {
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function installDevSwitch() {
  (window as unknown as { __codearenaDev: unknown }).__codearenaDev = {
    setRelaxedProctoring: (v: boolean) => {
      try {
        sessionStorage.setItem(KEY, v ? '1' : '0');
      } catch {
        /* ignore */
      }
    },
  };
}

type Obj = Record<string, unknown>;
const asObj = (v: unknown): Obj => (v && typeof v === 'object' ? (v as Obj) : {});

function relaxState(state: SessionState): SessionState {
  const p = asObj(state.proctoring);
  return {
    ...state,
    proctoring: {
      ...p,
      webcam: { ...asObj(p.webcam), enabled: false, required: false },
      faceDetection: { ...asObj(p.faceDetection), enabled: false },
      fullscreen: { ...asObj(p.fullscreen), enabled: false },
      keyboardLock: { ...asObj(p.keyboardLock), enabled: false },
    },
  };
}

function relax<R extends object>(result: R): R {
  const out = { ...result } as R & { state?: SessionState; workspace?: { state: SessionState } };
  if (out.state) out.state = relaxState(out.state);
  if (out.workspace) out.workspace = { ...out.workspace, state: relaxState(out.workspace.state) };
  return out;
}

export function withRelaxedProctoring(api: CandidateApi): CandidateApi {
  return {
    kind: api.kind,
    ping: () => api.ping(),
    login: (...a) => api.login(...a).then(relax),
    getState: (...a) => api.getState(...a).then(relax),
    acceptConsent: (...a) => api.acceptConsent(...a).then(relax),
    start: (...a) => api.start(...a).then(relax),
    getWorkspace: (...a) => api.getWorkspace(...a).then(relax),
    sync: (...a) => api.sync(...a).then(relax),
    submit: (...a) => api.submit(...a).then(relax),
    uploadSnapshot: (...a) => api.uploadSnapshot(...a),
    askAssistant: (...a) => api.askAssistant(...a),
  };
}
