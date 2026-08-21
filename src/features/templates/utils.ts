const VAR_REGEX = /\{\{\s*([\w.-]+)\s*\}\}/g;

export function extractVariables(content: string): string[] {
  const found = new Set<string>();
  for (const m of content.matchAll(VAR_REGEX)) found.add(m[1]);
  return Array.from(found);
}

export type PreviewSegment = { type: "text"; value: string } | { type: "var"; value: string };

export function previewSegments(content: string): PreviewSegment[] {
  const segs: PreviewSegment[] = [];
  let lastIndex = 0;
  for (const m of content.matchAll(VAR_REGEX)) {
    const start = m.index ?? 0;
    if (start > lastIndex) segs.push({ type: "text", value: content.slice(lastIndex, start) });
    segs.push({ type: "var", value: m[1] });
    lastIndex = start + m[0].length;
  }
  if (lastIndex < content.length) segs.push({ type: "text", value: content.slice(lastIndex) });
  return segs;
}

export function stripLeadingSlash(v: string): string {
  return v.replace(/^\/+/, "");
}

export function normalizeShortcut(v: string | undefined | null): string | null {
  if (!v) return null;
  const s = stripLeadingSlash(v.trim().toLowerCase());
  return s ? s : null;
}
