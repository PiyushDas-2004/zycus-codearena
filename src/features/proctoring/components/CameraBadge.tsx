import { clsx } from 'clsx';
import { VideoOff } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { ProctoringController } from '../ProctoringController';
import { useProctoring } from '../proctoringStore';

/**
 * Small self-view in the header: candidates always see what the camera sees. It also hosts the
 * camera's <video> element, which must be on screen for the browser to keep delivering frames.
 */
export function CameraBadge({ proctor }: { proctor: ProctoringController }) {
  const host = useRef<HTMLDivElement>(null);
  const camera = useProctoring((s) => s.camera);
  const faces = useProctoring((s) => s.faces);
  const live = camera === 'live';

  useEffect(() => proctor.mountCameraView(host.current), [proctor]);

  const label = live
    ? faces === null
      ? 'Camera on'
      : faces === 1
        ? 'Camera on · face visible'
        : faces === 0
          ? 'Camera on · no face visible'
          : `Camera on · ${faces} faces visible`
    : 'Camera off';

  return (
    <div
      className={clsx(
        'relative h-9 w-12 shrink-0 overflow-hidden rounded-md border-2 bg-navy-900',
        live ? (faces === null || faces === 1 ? 'border-success' : 'border-warning-fill') : 'border-danger',
      )}
      title={label}
      role="img"
      aria-label={label}
    >
      <div ref={host} className="size-full" />
      {!live && (
        <span className="absolute inset-0 flex items-center justify-center text-white">
          <VideoOff className="size-4" aria-hidden="true" />
        </span>
      )}
    </div>
  );
}
