/**
 * The candidate's webcam for the whole assessment: one stream, a hidden <video> that face detection
 * and snapshots read from, and health checks (track ended, muted by the OS, frames stalled).
 * Snapshots are small JPEGs (320 px wide, ≈15–30 KB). Nothing is recorded continuously.
 */
import type { CameraStatus } from './proctoringStore';

export interface CameraFrame {
  jpegB64: string;
  width: number;
  height: number;
}

export interface CameraManagerOptions {
  onStatus: (status: CameraStatus, stream: MediaStream | null) => void;
  snapshotWidth?: number;
  jpegQuality?: number;
}

export class CameraManager {
  readonly video: HTMLVideoElement;
  private stream: MediaStream | null = null;
  private health: number | null = null;
  private lastTime = -1;
  private stalledChecks = 0;
  private status: CameraStatus = 'off';
  private disposed = false;

  constructor(private readonly o: CameraManagerOptions) {
    this.video = document.createElement('video');
    this.video.muted = true;
    this.video.playsInline = true;
    this.video.autoplay = true; // resumes if the element is moved in the DOM (removal pauses media)
    this.video.setAttribute('aria-hidden', 'true');
  }

  get current(): CameraStatus {
    return this.status;
  }

  private setStatus(s: CameraStatus) {
    if (this.status === s) return;
    this.status = s;
    this.o.onStatus(s, s === 'live' ? this.stream : null);
  }

  /** Starts (or restarts) the camera. Must not be called from inside a blur-sensitive moment. */
  async start(): Promise<CameraStatus> {
    if (this.disposed) return this.status;
    this.stopTracks();
    this.setStatus('starting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      if (this.disposed) {
        stream.getTracks().forEach((t) => t.stop());
        return this.status;
      }
      this.stream = stream;
      const track = stream.getVideoTracks()[0];
      track?.addEventListener('ended', () => this.setStatus('off'));
      track?.addEventListener('mute', () => this.setStatus('off'));
      track?.addEventListener('unmute', () => this.setStatus('live'));
      this.video.srcObject = stream;
      await this.video.play().catch(() => undefined);
      this.setStatus('live');
      this.watchHealth();
    } catch (err) {
      const name = (err as DOMException).name;
      this.setStatus(name === 'NotAllowedError' || name === 'SecurityError' ? 'blocked' : 'unavailable');
    }
    return this.status;
  }

  /** Frames must keep arriving; a frozen feed (e.g. a virtual camera paused) counts as off. */
  private watchHealth() {
    if (this.health !== null) window.clearInterval(this.health);
    this.lastTime = -1;
    this.stalledChecks = 0;
    this.health = window.setInterval(() => {
      const track = this.stream?.getVideoTracks()[0];
      if (!track || track.readyState === 'ended') return this.setStatus('off');
      if (track.muted) return this.setStatus('off');
      const t = this.video.currentTime;
      this.stalledChecks = t === this.lastTime ? this.stalledChecks + 1 : 0;
      this.lastTime = t;
      if (this.stalledChecks >= 3) this.setStatus('off');
      else if (this.status === 'off' && this.stalledChecks === 0) this.setStatus('live');
    }, 2000);
  }

  /** A JPEG of the current frame, or null if the camera isn't live. */
  async capture(): Promise<CameraFrame | null> {
    if (this.status !== 'live' || this.video.videoWidth === 0) return null;
    const width = this.o.snapshotWidth ?? 320;
    const height = Math.round((this.video.videoHeight / this.video.videoWidth) * width);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(this.video, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((r) =>
      canvas.toBlob(r, 'image/jpeg', this.o.jpegQuality ?? 0.72),
    );
    if (!blob) return null;
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000)
      bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return { jpegB64: btoa(bin), width, height };
  }

  private stopTracks() {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.video.srcObject = null;
  }

  dispose() {
    this.disposed = true;
    if (this.health !== null) window.clearInterval(this.health);
    this.stopTracks();
    this.setStatus('off');
  }
}
