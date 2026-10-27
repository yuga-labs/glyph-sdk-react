import type { GlyphApiFetch } from "./GlyphContext";

export type ScopedGlyphData<T> = { scope: string; value: T };

export class GlyphDataRequestError extends Error {
    constructor(public readonly status: number) {
        super(`Glyph data request failed (HTTP ${status})`);
        this.name = "GlyphDataRequestError";
    }
}

export async function fetchScopedGlyphData<T>(
    apiFetch: GlyphApiFetch | null,
    path: string,
    signal: AbortSignal,
    isCurrent: () => boolean,
    scope: string
): Promise<ScopedGlyphData<T>> {
    const assertCurrent = () => {
        if (!apiFetch || signal.aborted || !isCurrent()) {
            throw new DOMException("Glyph data session changed", "AbortError");
        }
    };
    assertCurrent();
    const response = await apiFetch!(path, { signal });
    assertCurrent();
    // Never treat a JSON error body as data or echo provider details to logs/UI.
    if (!response.ok) throw new GlyphDataRequestError(response.status);
    const value = (await response.json()) as T;
    assertCurrent();
    return { scope, value };
}

export function shouldRetryGlyphData(error: Error, failureCount: number, limit: number) {
    if (error.name === "AbortError") return false;
    if (error instanceof GlyphDataRequestError && error.status >= 400 && error.status < 500) return false;
    return failureCount < limit;
}
