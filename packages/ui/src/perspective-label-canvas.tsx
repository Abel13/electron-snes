import { useEffect, useRef } from 'react';

export interface PerspectiveLabelPoint {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
}

export interface PerspectiveLabelMap {
  readonly aspectRatio: number;
  readonly topLeft: PerspectiveLabelPoint;
  readonly topRight: PerspectiveLabelPoint;
  readonly bottomRight: PerspectiveLabelPoint;
  readonly bottomLeft: PerspectiveLabelPoint;
}

interface Point {
  x: number;
  y: number;
}

const drawTriangle = (
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  source: readonly [Point, Point, Point],
  destination: readonly [Point, Point, Point],
  scale: number,
): void => {
  const [s0, s1, s2] = source;
  const center = {
    x: (destination[0].x + destination[1].x + destination[2].x) / 3,
    y: (destination[0].y + destination[1].y + destination[2].y) / 3,
  };
  const [d0, d1, d2] = destination.map((point) => {
    const length = Math.hypot(point.x - center.x, point.y - center.y) || 1;
    return {
      x: point.x + ((point.x - center.x) / length) * 0.75,
      y: point.y + ((point.y - center.y) / length) * 0.75,
    };
  }) as [Point, Point, Point];
  const sourceLeft = Math.min(s0.x, s1.x, s2.x);
  const sourceTop = Math.min(s0.y, s1.y, s2.y);
  const localSource: [Point, Point, Point] = source.map((point) => ({
    x: point.x - sourceLeft,
    y: point.y - sourceTop,
  })) as [Point, Point, Point];
  const [ls0, ls1, ls2] = localSource;
  const sourceWidth = Math.max(s0.x, s1.x, s2.x) - sourceLeft;
  const sourceHeight = Math.max(s0.y, s1.y, s2.y) - sourceTop;
  const a = ls1.x - ls0.x;
  const b = ls2.x - ls0.x;
  const c = ls1.y - ls0.y;
  const d = ls2.y - ls0.y;
  const determinant = a * d - b * c;
  if (Math.abs(determinant) < 0.001) return;
  const ba = d / determinant;
  const bb = -b / determinant;
  const bc = -c / determinant;
  const bd = a / determinant;
  const m11 = (d1.x - d0.x) * ba + (d2.x - d0.x) * bc;
  const m12 = (d1.x - d0.x) * bb + (d2.x - d0.x) * bd;
  const m21 = (d1.y - d0.y) * ba + (d2.y - d0.y) * bc;
  const m22 = (d1.y - d0.y) * bb + (d2.y - d0.y) * bd;
  const tx = d0.x - m11 * ls0.x - m12 * ls0.y;
  const ty = d0.y - m21 * ls0.x - m22 * ls0.y;
  context.save();
  context.beginPath();
  context.moveTo(d0.x, d0.y);
  context.lineTo(d1.x, d1.y);
  context.lineTo(d2.x, d2.y);
  context.closePath();
  context.clip();
  context.setTransform(scale * m11, scale * m21, scale * m12, scale * m22, scale * tx, scale * ty);
  context.drawImage(
    image,
    sourceLeft,
    sourceTop,
    sourceWidth,
    sourceHeight,
    0,
    0,
    sourceWidth,
    sourceHeight,
  );
  context.restore();
};

const roundedPath = (
  context: CanvasRenderingContext2D,
  points: readonly PerspectiveLabelPoint[],
): void => {
  const adjusted = points.map((point, index) => {
    const previous = points[(index + points.length - 1) % points.length]!;
    const next = points[(index + 1) % points.length]!;
    const radius = Math.min(
      point.radius,
      Math.hypot(point.x - previous.x, point.y - previous.y) / 2,
      Math.hypot(next.x - point.x, next.y - point.y) / 2,
    );
    const beforeLength = Math.hypot(point.x - previous.x, point.y - previous.y) || 1;
    const afterLength = Math.hypot(next.x - point.x, next.y - point.y) || 1;
    return {
      point,
      before: {
        x: point.x + ((previous.x - point.x) * radius) / beforeLength,
        y: point.y + ((previous.y - point.y) * radius) / beforeLength,
      },
      after: {
        x: point.x + ((next.x - point.x) * radius) / afterLength,
        y: point.y + ((next.y - point.y) * radius) / afterLength,
      },
    };
  });
  context.moveTo(adjusted[0]!.after.x, adjusted[0]!.after.y);
  for (let index = 1; index <= adjusted.length; index += 1) {
    const current = adjusted[index % adjusted.length]!;
    const previous = adjusted[(index - 1) % adjusted.length]!;
    context.lineTo(current.before.x, current.before.y);
    context.quadraticCurveTo(current.point.x, current.point.y, current.after.x, current.after.y);
    if (index === adjusted.length) context.lineTo(previous.after.x, previous.after.y);
  }
  context.closePath();
};

export const PerspectiveLabelCanvas = (props: {
  readonly imageUrl: string;
  readonly map: PerspectiveLabelMap;
}): React.JSX.Element => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | undefined>(undefined);

  useEffect(() => {
    const image = new Image();
    imageRef.current = image;
    image.src = props.imageUrl;
    const canvas = canvasRef.current;
    if (canvas === null) return;
    const redraw = (): void => {
      if (!image.complete || image.naturalWidth === 0) return;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (width === 0 || height === 0) return;
      const scale = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const context = canvas.getContext('2d');
      if (context === null) return;
      context.setTransform(scale, 0, 0, scale, 0, 0);
      context.clearRect(0, 0, width, height);
      const points = [
        props.map.topLeft,
        props.map.topRight,
        props.map.bottomRight,
        props.map.bottomLeft,
      ].map((point) => ({
        x: (point.x / 100) * width,
        y: (point.y / 100) * height,
        radius: point.radius,
      })) as [
        PerspectiveLabelPoint,
        PerspectiveLabelPoint,
        PerspectiveLabelPoint,
        PerspectiveLabelPoint,
      ];
      context.save();
      roundedPath(context, points);
      context.clip();
      const steps = 16;
      const bilinear = (u: number, v: number): Point => ({
        x:
          (1 - u) * (1 - v) * points[0].x +
          u * (1 - v) * points[1].x +
          u * v * points[2].x +
          (1 - u) * v * points[3].x,
        y:
          (1 - u) * (1 - v) * points[0].y +
          u * (1 - v) * points[1].y +
          u * v * points[2].y +
          (1 - u) * v * points[3].y,
      });
      for (let row = 0; row < steps; row += 1)
        for (let column = 0; column < steps; column += 1) {
          const u0 = column / steps,
            u1 = (column + 1) / steps,
            v0 = row / steps,
            v1 = (row + 1) / steps;
          const source = (u: number, v: number): Point => ({
            x: u * image.naturalWidth,
            y: v * image.naturalHeight,
          });
          const a = source(u0, v0),
            b = source(u1, v0),
            c = source(u1, v1),
            d = source(u0, v1);
          const A = bilinear(u0, v0),
            B = bilinear(u1, v0),
            C = bilinear(u1, v1),
            D = bilinear(u0, v1);
          drawTriangle(context, image, [a, b, c], [A, B, C], scale);
          drawTriangle(context, image, [a, c, d], [A, C, D], scale);
        }
      context.restore();
    };
    image.addEventListener('load', redraw);
    const observer = new ResizeObserver(redraw);
    observer.observe(canvas);
    redraw();
    return () => {
      image.removeEventListener('load', redraw);
      observer.disconnect();
    };
  }, [props.imageUrl, props.map]);

  return <canvas aria-hidden="true" className="pc-cartridge-label-canvas" ref={canvasRef} />;
};
