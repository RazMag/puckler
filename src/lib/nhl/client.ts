import "server-only";
import type { z } from "zod";

const BASE_URL = "https://api-web.nhle.com/v1";

export class NhlApiError extends Error {
  constructor(
    message: string,
    readonly path: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "NhlApiError";
  }
}

/** GET an NHL endpoint (following its date redirects) and validate the body. */
export async function nhlFetch<S extends z.ZodType>(path: string, schema: S): Promise<z.infer<S>> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      redirect: "follow",
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });
  } catch (cause) {
    throw new NhlApiError(`NHL API unreachable: ${String(cause)}`, path);
  }
  if (!res.ok) {
    throw new NhlApiError(`NHL API responded ${res.status}`, path, res.status);
  }

  const parsed = schema.safeParse(await res.json());
  if (!parsed.success) {
    throw new NhlApiError(`NHL API changed shape: ${parsed.error.message}`, path);
  }
  return parsed.data;
}
