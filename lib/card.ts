import type { Bucket, ClassifiedItem, Lang } from "./types";
import { BUCKETS } from "./types";
import { bucketLabel } from "./i18n";

/**
 * Client-side canvas renderer for the result card.
 * Used for both the shareable PNG (Reels-friendly portrait) and the PDF
 * (rendered as an image so Hindi/Devanagari displays correctly — stock PDF
 * fonts cannot render Devanagari).
 */

const BUCKET_COLORS: Record<Bucket, string> = {
  DROP: "#dc2626",
  DELAY: "#d97706",
  DELEGATE: "#2563eb",
};

const FONT_STACK =
  "system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Sans', 'Noto Sans Devanagari', sans-serif";

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

interface RenderOptions {
  width?: number;
  minHeight?: number;
}

export function renderResultCanvas(
  items: ClassifiedItem[],
  lang: Lang,
  opts: RenderOptions = {},
): HTMLCanvasElement {
  const width = opts.width ?? 1080;
  const pad = Math.round(width * 0.07);
  const contentWidth = width - pad * 2;

  const grouped = BUCKETS.map((b) => ({
    bucket: b,
    items: items.filter((i) => i.bucket === b),
  })).filter((g) => g.items.length > 0);

  // Measurement pass on a throwaway canvas.
  const measure = document.createElement("canvas").getContext("2d")!;
  const layout: Array<
    | { kind: "header" }
    | { kind: "bucket"; bucket: Bucket }
    | { kind: "item"; textLines: string[]; reasonLines: string[]; bucket: Bucket }
  > = [{ kind: "header" }];

  const itemFont = `600 ${Math.round(width * 0.028)}px ${FONT_STACK}`;
  const reasonFont = `400 ${Math.round(width * 0.024)}px ${FONT_STACK}`;
  const itemLine = Math.round(width * 0.038);
  const reasonLine = Math.round(width * 0.033);

  let height = pad + Math.round(width * 0.11); // header block

  for (const group of grouped) {
    layout.push({ kind: "bucket", bucket: group.bucket });
    height += Math.round(width * 0.075);
    for (const item of group.items) {
      measure.font = itemFont;
      const textLines = wrapText(measure, item.text, contentWidth - 30);
      measure.font = reasonFont;
      const reasonLines = wrapText(measure, item.reason, contentWidth - 30);
      layout.push({ kind: "item", textLines, reasonLines, bucket: group.bucket });
      height +=
        textLines.length * itemLine +
        reasonLines.length * reasonLine +
        Math.round(width * 0.02);
    }
    height += Math.round(width * 0.015);
  }
  height += pad + Math.round(width * 0.05); // footer
  height = Math.max(height, opts.minHeight ?? 0);

  // Draw pass.
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  let y = pad + Math.round(width * 0.035);

  for (const block of layout) {
    if (block.kind === "header") {
      ctx.fillStyle = "#111113";
      ctx.font = `800 ${Math.round(width * 0.045)}px ${FONT_STACK}`;
      ctx.fillText("Drop", pad, y);
      const dropWidth = ctx.measureText("Drop").width;
      ctx.fillStyle = "#dc2626";
      ctx.fillText("List", pad + dropWidth, y);
      ctx.fillStyle = "#71717a";
      ctx.font = `500 ${Math.round(width * 0.022)}px ${FONT_STACK}`;
      const tagline =
        lang === "hi" ? "मेरी not-to-do लिस्ट" : "my not-to-do list";
      ctx.fillText(tagline, pad, y + Math.round(width * 0.04));
      y += Math.round(width * 0.11);
    } else if (block.kind === "bucket") {
      ctx.fillStyle = BUCKET_COLORS[block.bucket];
      ctx.font = `800 ${Math.round(width * 0.03)}px ${FONT_STACK}`;
      ctx.fillText(bucketLabel(lang, block.bucket), pad, y);
      y += Math.round(width * 0.055);
    } else {
      ctx.fillStyle = BUCKET_COLORS[block.bucket];
      ctx.font = itemFont;
      ctx.fillText("•", pad, y);
      ctx.fillStyle = "#18181b";
      for (const line of block.textLines) {
        ctx.fillText(line, pad + 30, y);
        y += itemLine;
      }
      ctx.fillStyle = "#71717a";
      ctx.font = reasonFont;
      for (const line of block.reasonLines) {
        ctx.fillText(line, pad + 30, y);
        y += reasonLine;
      }
      y += Math.round(width * 0.02);
    }
  }

  ctx.fillStyle = "#a1a1aa";
  ctx.font = `500 ${Math.round(width * 0.02)}px ${FONT_STACK}`;
  ctx.fillText("droplist — the AI not-to-do coach", pad, height - pad * 0.6);

  return canvas;
}
