type Scalar = string | number | boolean | null;

export function rowsOf<T extends Record<string, Scalar>>(rows: Record<string, unknown>[]): T[] {
  return rows.map((row) => {
    const out: Record<string, Scalar> = {};
    for (const [key, value] of Object.entries(row)) {
      if (value == null) out[key] = null;
      else if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") out[key] = value;
      else out[key] = String(value);
    }
    return out as T;
  });
}
