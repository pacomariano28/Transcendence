function isHtmlBody(text: string): boolean {
  const trimmed = text.trimStart().toLowerCase();
  return trimmed.startsWith("<!doctype") || trimmed.startsWith("<html");
}

export async function readServiceJson<T>(
  response: Response,
  fallbackError: string,
): Promise<
  | { ok: true; data: T; status: number }
  | { ok: false; error: string; status: number }
> {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    const body = (await response.text()).slice(0, 200);
    if (isHtmlBody(body)) {
      return {
        ok: false,
        error: fallbackError,
        status: response.status,
      };
    }

    return {
      ok: false,
      error: body || fallbackError,
      status: response.status,
    };
  }

  try {
    const data = (await response.json()) as T;
    return { ok: true, data, status: response.status };
  } catch {
    return {
      ok: false,
      error: fallbackError,
      status: response.status,
    };
  }
}
