export function sanitizeKatexString(text: string): string {
  if (!text) return '';
  return text
    .replace(/\u000bec/g, '\\vec')
    .replace(/\u000b/g, '\\vec')
    .replace(/\\u000bec/g, '\\vec')
    .replace(/\\u000b/g, '\\vec');
}

export function sanitizeFixtureData<T>(data: T): T {
  if (typeof data === 'string') {
    return sanitizeKatexString(data) as unknown as T;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeFixtureData(item)) as unknown as T;
  }
  if (data !== null && typeof data === 'object') {
    const sanitizedObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      sanitizedObj[key] = sanitizeFixtureData(value);
    }
    return sanitizedObj as unknown as T;
  }
  return data;
}
