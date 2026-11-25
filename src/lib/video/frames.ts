/**
 * Turn a video file into still frames, entirely in the browser.
 *
 * Claude sees images, not video — so a clip has to become an ordered strip of
 * frames before it can be analyzed. We do that with a hidden <video> and a
 * <canvas>: no ffmpeg, no upload, no new dependency, and the file never leaves
 * the device (only the sampled JPEGs are sent to our own /api/video route).
 */

/** Anthropic downscales past ~1568px anyway; 768 keeps a form check legible and the payload small. */
const MAX_EDGE = 768;
const JPEG_QUALITY = 0.72;

export const MAX_FRAMES = 8;
export const MAX_VIDEO_BYTES = 200 * 1024 * 1024;

export interface SampledVideo {
  /** Bare base64 JPEG payloads, in chronological order — no data: prefix. */
  frames: string[];
  durationSec: number;
}

function fitWithin(w: number, h: number): [number, number] {
  const scale = Math.min(1, MAX_EDGE / Math.max(w, h));
  return [Math.round(w * scale), Math.round(h * scale)];
}

function seekTo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const onSeeked = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error("Could not seek that video."));
    };
    const cleanup = () => {
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
    };
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onError);
    video.currentTime = time;
  });
}

function loadMetadata(video: HTMLVideoElement): Promise<void> {
  return new Promise((resolve, reject) => {
    if (video.readyState >= 1) return resolve();
    video.addEventListener("loadedmetadata", () => resolve(), { once: true });
    video.addEventListener(
      "error",
      () => reject(new Error("That file didn't load as a video. Try an .mp4 or .mov.")),
      { once: true },
    );
  });
}

/**
 * Sample up to `count` evenly-spaced frames. Skips the very first and last
 * moments, which are usually the phone being picked up or set down.
 */
export async function sampleFrames(file: File, count = MAX_FRAMES): Promise<SampledVideo> {
  if (file.size > MAX_VIDEO_BYTES) {
    throw new Error("That video is over 200 MB — trim it down first.");
  }

  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = url;

  try {
    await loadMetadata(video);

    const duration = video.duration;
    if (!Number.isFinite(duration) || duration <= 0) {
      throw new Error("Couldn't read that video's length.");
    }

    const [w, h] = fitWithin(video.videoWidth, video.videoHeight);
    if (!w || !h) throw new Error("That video has no picture track.");

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Your browser blocked canvas rendering.");

    // Inset the window so we sample the movement, not the setup and teardown.
    const start = duration * 0.05;
    const span = duration * 0.9;
    const n = Math.max(1, Math.min(count, Math.ceil(duration * 2)));

    const frames: string[] = [];
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? duration / 2 : start + (span * i) / (n - 1);
      await seekTo(video, Math.min(t, duration - 0.01));
      ctx.drawImage(video, 0, 0, w, h);
      frames.push(canvas.toDataURL("image/jpeg", JPEG_QUALITY).split(",")[1]);
    }

    return { frames, durationSec: duration };
  } finally {
    video.src = "";
    URL.revokeObjectURL(url);
  }
}
