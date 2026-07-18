import { detectFileSignature, isAudioSignature, isImageSignature } from "./file-signature.util";

describe("file-signature.util", () => {
  it("detects a real PNG by its magic bytes", () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    expect(detectFileSignature(png)).toBe("image/png");
    expect(isImageSignature(png)).toBe(true);
    expect(isAudioSignature(png)).toBe(false);
  });

  it("detects a real JPEG by its magic bytes", () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
    expect(detectFileSignature(jpeg)).toBe("image/jpeg");
    expect(isImageSignature(jpeg)).toBe(true);
  });

  it("detects a real WebP by its RIFF/WEBP header", () => {
    const webp = Buffer.concat([Buffer.from("RIFF"), Buffer.from([0, 0, 0, 0]), Buffer.from("WEBP")]);
    expect(detectFileSignature(webp)).toBe("image/webp");
    expect(isImageSignature(webp)).toBe(true);
  });

  it("detects a real WAV by its RIFF/WAVE header", () => {
    const wav = Buffer.concat([Buffer.from("RIFF"), Buffer.from([0, 0, 0, 0]), Buffer.from("WAVE")]);
    expect(detectFileSignature(wav)).toBe("audio/wav");
    expect(isAudioSignature(wav)).toBe(true);
    expect(isImageSignature(wav)).toBe(false);
  });

  it("detects a real Ogg file by its OggS header", () => {
    const ogg = Buffer.from("OggS0000");
    expect(detectFileSignature(ogg)).toBe("audio/ogg");
    expect(isAudioSignature(ogg)).toBe(true);
  });

  it("detects a real WebM/EBML file by its magic bytes", () => {
    const webm = Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0, 0, 0, 0]);
    expect(detectFileSignature(webm)).toBe("audio/webm");
    expect(isAudioSignature(webm)).toBe(true);
  });

  it("detects an MP4/M4A container by its ftyp box", () => {
    const m4a = Buffer.concat([Buffer.from([0, 0, 0, 0x20]), Buffer.from("ftyp"), Buffer.from("M4A ")]);
    expect(detectFileSignature(m4a)).toBe("audio/mp4");
    expect(isAudioSignature(m4a)).toBe(true);
  });

  it("detects an MP3 file by its ID3 tag or frame sync", () => {
    const id3 = Buffer.from([0x49, 0x44, 0x33, 0, 0, 0, 0, 0]);
    expect(detectFileSignature(id3)).toBe("audio/mpeg");
    const frameSync = Buffer.from([0xff, 0xfb, 0, 0, 0, 0]);
    expect(detectFileSignature(frameSync)).toBe("audio/mpeg");
  });

  it("returns null for a file with no recognizable signature (e.g. a relabeled text file)", () => {
    const plainText = Buffer.from("just some plain text, not a real media file");
    expect(detectFileSignature(plainText)).toBeNull();
    expect(isImageSignature(plainText)).toBe(false);
    expect(isAudioSignature(plainText)).toBe(false);
  });

  it("returns null for a buffer too short to contain any signature", () => {
    expect(detectFileSignature(Buffer.from([0x89, 0x50]))).toBeNull();
  });

  it("does not classify an image signature as an audio signature or vice versa", () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const webm = Buffer.from([0x1a, 0x45, 0xdf, 0xa3]);
    expect(isAudioSignature(png)).toBe(false);
    expect(isImageSignature(webm)).toBe(false);
  });
});
