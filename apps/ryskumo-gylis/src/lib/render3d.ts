import { COLORS } from './scene3d';
import type { Layer, SceneView, Shape } from './scene3d';

/**
 * Gaussian σ that matches a uniform blur disc of diameter d: a disc of radius R has a per-axis
 * standard deviation of R / 2, i.e. d / 4.
 */
const SIGMA_PER_DIAMETER = 0.25;
/** Past this the picture is mush anyway, and big filters are slow. */
const MAX_SIGMA = 80;

/** Rounds σ so that neighbouring layers with nearly the same blur share one filter pass. */
export function blurBucket(diameter: number): number {
  const sigma = Math.min(diameter * SIGMA_PER_DIAMETER, MAX_SIGMA);
  if (sigma < 0.3) return 0;
  if (sigma < 4) return Math.round(sigma * 4) / 4;
  if (sigma < 16) return Math.round(sigma * 2) / 2;
  return Math.round(sigma);
}

/** Groups consecutive layers that share a blur bucket, keeping the back-to-front order. */
export function groupLayers(layers: Layer[]): { sigma: number; shapes: Shape[] }[] {
  const groups: { sigma: number; shapes: Shape[] }[] = [];
  for (const layer of layers) {
    const sigma = blurBucket(layer.blur);
    const last = groups[groups.length - 1];
    if (last && last.sigma === sigma) last.shapes.push(...layer.shapes);
    else groups.push({ sigma, shapes: [...layer.shapes] });
  }
  return groups;
}

function drawShape(ctx: CanvasRenderingContext2D, s: Shape) {
  switch (s.kind) {
    case 'poly': {
      ctx.beginPath();
      ctx.moveTo(s.points[0][0], s.points[0][1]);
      for (let i = 1; i < s.points.length; i++) ctx.lineTo(s.points[i][0], s.points[i][1]);
      ctx.closePath();
      ctx.fillStyle = s.fill;
      ctx.fill();
      break;
    }
    case 'ellipse': {
      if (!(s.rx > 0 && s.ry > 0)) break;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, s.rx, s.ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = s.fill;
      ctx.fill();
      break;
    }
    case 'sphere': {
      if (!(s.r > 0)) break;
      const g = ctx.createRadialGradient(s.x - s.r * 0.35, s.y - s.r * 0.4, s.r * 0.05, s.x, s.y, s.r);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.18, s.color);
      g.addColorStop(0.85, s.color);
      g.addColorStop(1, 'rgba(0,0,0,0.55)');
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.fill();
      ctx.fillStyle = g;
      ctx.fill();
      break;
    }
    case 'text': {
      if (s.size < 3) break;
      ctx.fillStyle = s.fill;
      ctx.font = `600 ${s.size}px 'Public Sans', system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(s.text, s.x, s.y);
      break;
    }
    case 'light': {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = s.alpha;
      const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
      g.addColorStop(0, s.color);
      g.addColorStop(0.82, s.color);
      g.addColorStop(1, 'rgba(255, 200, 97, 0)');
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.restore();
      break;
    }
  }
}

let scratch: HTMLCanvasElement | undefined;

/** Paints the scene: each group of layers is drawn sharp off-screen, then blurred onto the frame. */
export function renderScene(canvas: HTMLCanvasElement, view: SceneView) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: W, height: H } = view;
  if (canvas.width !== W) canvas.width = W;
  if (canvas.height !== Math.round(H)) canvas.height = Math.round(H);

  const sky = ctx.createLinearGradient(0, Math.min(0, view.horizonY - H), 0, Math.max(view.horizonY, 1));
  sky.addColorStop(0, COLORS.skyTop);
  sky.addColorStop(1, COLORS.skyHorizon);
  ctx.filter = 'none';
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  scratch ??= document.createElement('canvas');
  if (scratch.width !== W || scratch.height !== canvas.height) {
    scratch.width = W;
    scratch.height = canvas.height;
  }
  const off = scratch.getContext('2d');
  if (!off) return;

  for (const group of groupLayers(view.layers)) {
    if (group.sigma === 0) {
      for (const shape of group.shapes) drawShape(ctx, shape);
      continue;
    }
    off.clearRect(0, 0, W, scratch.height);
    for (const shape of group.shapes) drawShape(off, shape);
    ctx.filter = `blur(${group.sigma}px)`;
    ctx.drawImage(scratch, 0, 0);
    ctx.filter = 'none';
  }
}
