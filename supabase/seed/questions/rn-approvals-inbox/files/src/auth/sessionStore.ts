import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session, Tokens } from '../types';

export const SESSION_KEY = 'session.v1';

type Listener = (session: Session | null) => void;

export interface SessionStore {
  /** Resolves once the saved session has been read from storage. */
  ready: Promise<void>;
  get(): Session | null;
  signIn(session: Session): Promise<void>;
  /** Stores new tokens after a refresh (refresh tokens rotate: the old one stops working). */
  saveTokens(tokens: Tokens): Promise<void>;
  signOut(): Promise<void>;
  subscribe(listener: Listener): () => void;
}

/** The signed-in session, persisted in AsyncStorage so the user stays signed in across launches. */
export function createSessionStore(): SessionStore {
  let session: Session | null = null;
  const listeners = new Set<Listener>();
  const emit = () => listeners.forEach((l) => l(session));

  const persist = async () => {
    if (session) await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else await AsyncStorage.removeItem(SESSION_KEY);
  };

  const ready = AsyncStorage.getItem(SESSION_KEY).then((raw) => {
    session = raw ? (JSON.parse(raw) as Session) : null;
    emit();
  });

  return {
    ready,
    get: () => session,
    async signIn(next) {
      session = next;
      emit();
      await persist();
    },
    async saveTokens(tokens) {
      if (!session) return;
      session = { ...session, tokens };
      emit();
      await persist();
    },
    async signOut() {
      session = null;
      emit();
      await persist();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
