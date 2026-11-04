import { useEffect, useRef, useState, type RefObject } from 'react';
import { createSpaceEngine } from './spaceEngine';

const reducedMotion = () => {
  try {
    return (
      typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  } catch {
    return false;
  }
};

/**
 * The full-screen journey through space behind the sign-in card. The canvas is created after the
 * first paint (the form is already on screen) and removed on unmount with every GPU object freed.
 * Without WebGL2 (or in tests) a still CSS star field is shown instead; with reduced motion, a still
 * picture.
 */
export function SpaceBackdrop({ focusRef }: { focusRef?: RefObject<HTMLElement | null> }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [fallback, setFallback] = useState(() => typeof window.WebGL2RenderingContext !== 'function');

  useEffect(() => {
    if (fallback) return;
    let engine: ReturnType<typeof createSpaceEngine> = null;
    let canvas: HTMLCanvasElement | null = null;
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => {
        const host = hostRef.current;
        if (!host) return;
        canvas = document.createElement('canvas');
        canvas.className = 'login-space-canvas';
        host.appendChild(canvas);
        engine = createSpaceEngine({ canvas, reduced: reducedMotion(), focus: focusRef?.current });
        if (!engine) {
          canvas.remove();
          canvas = null;
          setFallback(true);
        }
      });
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
      engine?.dispose();
      canvas?.remove();
    };
  }, [fallback, focusRef]);

  return (
    <div ref={hostRef} className="login-space" aria-hidden="true">
      {fallback && <div className="login-space-stars" />}
    </div>
  );
}
