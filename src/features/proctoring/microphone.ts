/**
 * Optional loud-audio check (off by default). Measures loudness only — nothing is recorded or
 * sent except a flag when sound stays above the threshold for the configured time.
 */
export interface LoudnessOptions {
  loudDbfs: number;
  sustainSec: number;
  onLoud: (details: { dbfs: number }) => void;
}

export async function startLoudnessMonitor(o: LoudnessOptions): Promise<(() => void) | { error: string }> {
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      video: false,
    });
  } catch (err) {
    return { error: (err as DOMException).name === 'NotAllowedError' ? 'blocked' : 'unavailable' };
  }
  const ctx = new AudioContext();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  ctx.createMediaStreamSource(stream).connect(analyser);
  const buf = new Float32Array(analyser.fftSize);
  let loudSince: number | null = null;
  let lastFlag = -Infinity;
  const id = window.setInterval(() => {
    analyser.getFloatTimeDomainData(buf);
    let sum = 0;
    for (const v of buf) sum += v * v;
    const dbfs = 20 * Math.log10(Math.sqrt(sum / buf.length) || 1e-8);
    const now = performance.now();
    if (dbfs >= o.loudDbfs) {
      loudSince ??= now;
      if (now - loudSince >= o.sustainSec * 1000 && now - lastFlag > 60_000) {
        lastFlag = now;
        o.onLoud({ dbfs: Math.round(dbfs) });
      }
    } else {
      loudSince = null;
    }
  }, 250);
  return () => {
    window.clearInterval(id);
    stream.getTracks().forEach((t) => t.stop());
    void ctx.close();
  };
}
