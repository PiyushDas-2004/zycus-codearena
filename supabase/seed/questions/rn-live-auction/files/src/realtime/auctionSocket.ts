import type { Bid } from '../types';

type Events = { bid: Bid; extended: { closesAt: number } };
type Handler<K extends keyof Events> = (payload: Events[K]) => void;

/** The live auction feed (a WebSocket in the app; an in-memory emitter in tests). */
export interface AuctionSocket {
  on<K extends keyof Events>(event: K, handler: Handler<K>): void;
  off<K extends keyof Events>(event: K, handler: Handler<K>): void;
  emit<K extends keyof Events>(event: K, payload: Events[K]): void;
  listenerCount(event: keyof Events): number;
}

export function createAuctionSocket(): AuctionSocket {
  const handlers = new Map<keyof Events, Set<(p: never) => void>>();
  const set = (e: keyof Events) => {
    if (!handlers.has(e)) handlers.set(e, new Set());
    return handlers.get(e)!;
  };
  return {
    on: (event, handler) => void set(event).add(handler as (p: never) => void),
    off: (event, handler) => void set(event).delete(handler as (p: never) => void),
    emit: (event, payload) => set(event).forEach((h) => (h as (p: typeof payload) => void)(payload)),
    listenerCount: (event) => set(event).size,
  };
}
