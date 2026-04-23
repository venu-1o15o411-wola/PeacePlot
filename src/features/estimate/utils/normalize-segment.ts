export function normalizeSegment(value: string | string[] | undefined): string | undefined {
  if (value === undefined) return undefined;
  const segment = Array.isArray(value) ? value[0] : value;
  return typeof segment === "string" ? segment : undefined;
}
