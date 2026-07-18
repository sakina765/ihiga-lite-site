// Identifies a file's real type from its magic bytes (file signature) rather
// than trusting the client-declared mimetype string, which a malicious client
// can set to anything regardless of what bytes actually follow.

export type DetectedFileKind =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "audio/wav"
  | "audio/ogg"
  | "audio/webm"
  | "audio/mp4"
  | "audio/mpeg";

const IMAGE_KINDS = new Set<DetectedFileKind>(["image/jpeg", "image/png", "image/webp"]);
const AUDIO_KINDS = new Set<DetectedFileKind>(["audio/wav", "audio/ogg", "audio/webm", "audio/mp4", "audio/mpeg"]);

export function detectFileSignature(buffer: Buffer): DetectedFileKind | null {
  if (buffer.length < 4) {
    return null;
  }

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }
  if (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
    return "image/webp";
  }
  if (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WAVE") {
    return "audio/wav";
  }
  if (buffer.toString("ascii", 0, 4) === "OggS") {
    return "audio/ogg";
  }
  // EBML header — used by both WebM and Matroska; this project only accepts
  // WebM audio uploads, so no need to disambiguate further.
  if (buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) {
    return "audio/webm";
  }
  // ISO base media container (used by both .m4a audio and .mp4 video) — bytes
  // 4-8 are always "ftyp" regardless of the specific brand that follows.
  if (buffer.length >= 12 && buffer.toString("ascii", 4, 8) === "ftyp") {
    return "audio/mp4";
  }
  if ((buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) || (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0)) {
    return "audio/mpeg";
  }

  return null;
}

export function isImageSignature(buffer: Buffer): boolean {
  const kind = detectFileSignature(buffer);
  return kind !== null && IMAGE_KINDS.has(kind);
}

export function isAudioSignature(buffer: Buffer): boolean {
  const kind = detectFileSignature(buffer);
  return kind !== null && AUDIO_KINDS.has(kind);
}
