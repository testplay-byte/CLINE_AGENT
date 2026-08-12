const colorCache = new Map<string, [number, number, number]>();
let canvasCtx: CanvasRenderingContext2D | null = null;

function parseColor(color: string): [number, number, number] {
  const cached = colorCache.get(color);
  if (cached) return cached;
  if (typeof document === 'undefined') return [128, 128, 128];
  if (!canvasCtx) {
    const c = document.createElement('canvas');
    c.width = c.height = 1;
    canvasCtx = c.getContext('2d');
  }
  canvasCtx!.fillStyle = color;
  canvasCtx!.fillRect(0, 0, 1, 1);
  const [r, g, b] = canvasCtx!.getImageData(0, 0, 1, 1).data;
  const result: [number, number, number] = [r, g, b];
  colorCache.set(color, result);
  return result;
}

export function getContrastText(color: string): string {
  const [r, g, b] = parseColor(color);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '#111111' : '#FFFFFF';
}

export function isLightColor(color: string): boolean {
  const [r, g, b] = parseColor(color);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55;
}
