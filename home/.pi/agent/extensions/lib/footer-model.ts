// The built-in footer right-aligns the model on the stats line. To show it at the start of
// line 1 instead, we remove that exact text from the end of the stats line. We know the text
// because the footer builds it as `<id>[ • <thinking level>]` (we pin the provider count to 1
// so the "(provider) " prefix is never added there). If the text isn't at the end, for example
// after truncation on a very narrow terminal, we return undefined and leave the line alone.

const ANSI_TAIL = /(?:\x1b\[[0-9;]*m)*$/;

export interface ModelParts {
  id: string;
  /** "high", "thinking off", or undefined for non-reasoning models. */
  thinking: string | undefined;
}

export function builtinModelText({ id, thinking }: ModelParts): string {
  return thinking ? `${id} • ${thinking}` : id;
}

export function stripModelFromStatsLine(line: string, parts: ModelParts): string | undefined {
  const tail = line.match(ANSI_TAIL)?.[0] ?? "";
  const body = line.slice(0, line.length - tail.length);
  const text = builtinModelText(parts);
  if (!body.endsWith(text)) return undefined;
  return `${body.slice(0, body.length - text.length).trimEnd()}${tail}`;
}
