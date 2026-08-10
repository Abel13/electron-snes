import { useEffect, useRef } from 'react';

export interface EmulatorVideoFrameData {
  readonly height: number;
  readonly pixels: Uint8Array;
  readonly width: number;
}
export interface EmulatorVideoCanvasProps {
  readonly frame?: EmulatorVideoFrameData;
  readonly label?: string;
}

export const EmulatorVideoCanvas = ({
  frame,
  label = 'Video output will appear here',
}: EmulatorVideoCanvasProps): React.JSX.Element => {
  const canvas = useRef<HTMLCanvasElement>(null);
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
  }, [frame]);
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
