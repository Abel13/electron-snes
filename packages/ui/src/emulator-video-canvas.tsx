import { useEffect, useRef } from 'react';

export interface EmulatorVideoFrameData {
  readonly height: number;
  readonly pixels: Uint8Array;
  readonly width: number;
}
export interface EmulatorAmbientPalette {
  readonly bottom: string;
  readonly left: string;
  readonly right: string;
  readonly top: string;
}
export interface EmulatorVideoCanvasProps {
  readonly frame?: EmulatorVideoFrameData;
  readonly label?: string;
  readonly onAmbientPalette?: (palette: EmulatorAmbientPalette) => void;
}

export const extractAmbientPalette = (frame: EmulatorVideoFrameData): EmulatorAmbientPalette => {
  const bins = new Map<string, { blue: number; count: number; green: number; red: number }>();
  const pixelCount = frame.width * frame.height;
  const step = Math.max(1, Math.floor(pixelCount / 1800));
  for (let pixel = 0; pixel < pixelCount; pixel += step) {
    const offset = pixel * 4;
    const red = frame.pixels[offset] ?? 0;
    const green = frame.pixels[offset + 1] ?? 0;
    const blue = frame.pixels[offset + 2] ?? 0;
    const maximum = Math.max(red, green, blue);
    const minimum = Math.min(red, green, blue);
    const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;
    if (luminance < 32 || luminance > 224 || maximum - minimum < 18) continue;
    const key = `${red >> 5}:${green >> 5}:${blue >> 5}`;
    const bin = bins.get(key) ?? { blue: 0, count: 0, green: 0, red: 0 };
    bin.red += red;
    bin.green += green;
    bin.blue += blue;
    bin.count += 1;
    bins.set(key, bin);
  }
  const colors = [...bins.values()]
    .sort((left, right) => right.count - left.count)
    .slice(0, 4)
    .map((bin) => {
      const channel = (value: number): number =>
        Math.min(220, Math.max(24, Math.round(value / bin.count)));
      return `rgb(${channel(bin.red)} ${channel(bin.green)} ${channel(bin.blue)})`;
    });
  const fallback = ['rgb(87 68 196)', 'rgb(22 155 190)', 'rgb(32 91 190)', 'rgb(122 49 176)'];
  const color = (index: number): string =>
    colors[index % Math.max(1, colors.length)] ?? fallback[index]!;
  return { bottom: color(2), left: color(3), right: color(1), top: color(0) };
};

export const EmulatorVideoCanvas = ({
  frame,
  label = 'Video output will appear here',
  onAmbientPalette,
}: EmulatorVideoCanvasProps): React.JSX.Element => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const sampledFrames = useRef(0);
  useEffect(() => {
    if (frame === undefined || canvas.current === null) return;
    const context = canvas.current.getContext('2d', { alpha: false });
    if (context === null) return;
    canvas.current.width = frame.width;
    canvas.current.height = frame.height;
    context.putImageData(
      new ImageData(new Uint8ClampedArray(frame.pixels), frame.width, frame.height),
      0,
      0,
    );
    sampledFrames.current += 1;
    if (sampledFrames.current % 12 === 0) onAmbientPalette?.(extractAmbientPalette(frame));
  }, [frame, onAmbientPalette]);
  return (
    <section aria-label={label} className="pixelcore-video-frame">
      <canvas
        className="pixelcore-video-canvas"
        height={frame?.height ?? 144}
        ref={canvas}
        width={frame?.width ?? 160}
      />
      {frame === undefined ? <p className="pixelcore-video-placeholder">{label}</p> : null}
    </section>
  );
};
