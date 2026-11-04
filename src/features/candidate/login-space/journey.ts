/**
 * The journey's script: a tour of the solar system in order — Mercury, Venus, Earth and the Moon,
 * Mars, the asteroid belt, Jupiter, Saturn, Uranus, Neptune — then out among the stars (a nebula, a
 * galaxy, a star cluster) and back to Mercury for the next tour, with different nebulae and galaxies
 * each time.
 */
export type LegKind = 'planet' | 'belt' | 'jump' | 'nebula' | 'vista' | 'cruise';

export interface Leg {
  kind: LegKind;
  /** Seconds. */
  duration: number;
  /** The planet (BODY), nebula palette or galaxy, depending on the kind. */
  variant: number;
  /** The very first leg: the world is already near, so the page opens on it rather than on a dot. */
  opening?: boolean;
}

/** Bodies with a baked surface (the index is the texture kind in the planet shader). */
export const BODY = {
  earth: 0,
  jupiter: 1,
  saturn: 2,
  mars: 3,
  neptune: 4,
  moon: 5,
  mercury: 6,
  venus: 7,
  uranus: 8,
  io: 9,
  europa: 10,
  titan: 11,
  triton: 12,
} as const;

const TOUR: Leg[] = [
  { kind: 'planet', duration: 22.5, variant: BODY.mercury },
  { kind: 'planet', duration: 22.5, variant: BODY.venus },
  { kind: 'planet', duration: 26.5, variant: BODY.earth },
  { kind: 'planet', duration: 23.5, variant: BODY.mars },
  { kind: 'belt', duration: 18, variant: 0 },
  { kind: 'planet', duration: 27.5, variant: BODY.jupiter },
  { kind: 'planet', duration: 27.5, variant: BODY.saturn },
  { kind: 'planet', duration: 23.5, variant: BODY.uranus },
  { kind: 'planet', duration: 23.5, variant: BODY.neptune },
];

/** An endless journey: the tour, a stretch among the stars, then the tour again. */
export function createJourney(rand: () => number) {
  let queue: Leg[] = [];
  let first = true;
  const refill = () => {
    // The first tour opens with Mercury already near; later ones approach it from far away.
    const tour = TOUR.map((l, i) => (first && i === 0 ? { ...l, duration: 18, opening: true } : l));
    first = false;
    queue = [
      ...tour,
      { kind: 'jump', duration: 7, variant: 0 },
      { kind: 'nebula', duration: 20, variant: Math.floor(rand() * 3) },
      { kind: 'jump', duration: 7, variant: 1 },
      { kind: 'vista', duration: 14, variant: Math.floor(rand() * 4) },
      { kind: 'cruise', duration: 14, variant: 0 },
      { kind: 'jump', duration: 7, variant: 0 },
    ];
  };
  return (): Leg => {
    if (!queue.length) refill();
    return queue.shift() ?? { kind: 'cruise', duration: 10, variant: 0 };
  };
}
