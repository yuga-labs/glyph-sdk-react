import { GlyphBalancesDecodeError } from "../lib/balancesImageTransport";
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
    scope: string,
    decode?: (value: unknown) => T
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
    const parsed: unknown = await response.json();
    assertCurrent();
    const value = decode ? decode(parsed) : (parsed as T);
    assertCurrent();
    return { scope, value };
}

export function shouldRetryGlyphData(error: Error, failureCount: number, limit: number) {
    if (error.name === "AbortError" || error instanceof GlyphBalancesDecodeError) return false;
    if (error instanceof GlyphDataRequestError && error.status >= 400 && error.status < 500) return false;
    return failureCount < limit;
}
