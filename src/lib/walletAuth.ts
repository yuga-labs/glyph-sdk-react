import type { GlyphAuthError, GlyphAuthErrorReason } from "../types";

export class WalletAuthFailure extends Error {
    constructor(
        readonly reason: GlyphAuthErrorReason,
        message: string,
        readonly retryAfterMs?: number
    ) {
        super(message);
    }
}

export function walletAuthOrigin(value: string): string | null {
    try {
        const url = new URL(value);
        return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password ? url.origin : null;
    } catch {
        return null;
    }
}

export function hasWalletActivation(): boolean {
    if (typeof navigator === "undefined") return false;
    return navigator.userActivation?.isActive ?? true;
}

export function signingFailure(error: unknown): WalletAuthFailure {
    try {
        let current = error;
        for (let depth = 0; current && depth < 5; depth++) {
            const item = current as { code?: unknown; message?: unknown; details?: unknown; cause?: unknown };
            const text = [item.message, item.details]
                .filter((v): v is string => typeof v === "string")
                .map((v) => v.slice(0, 4096))
                .join(" ");
            if (item.code === 4001 || /user (rejected|denied|cancel)/i.test(text))
                return new WalletAuthFailure("rejected", "The signature request was rejected.");
            if (/failed to initialize request|popup.*block|pop-up.*block/i.test(text))
                return new WalletAuthFailure("popup_blocked", "Open sign-in from a click to allow the wallet popup.");
            current = item.cause;
        }
    } catch {
        /* Untrusted SDK errors are never returned or logged. */
    }
    return new WalletAuthFailure("network", "The signature request failed.");
}

async function authJson(
    response: Response,
    rejected: GlyphAuthErrorReason,
    signal: AbortSignal
): Promise<Record<string, unknown>> {
    if (response.status === 429) {
        const header = response.headers.get("Retry-After");
        void response.body?.cancel().catch(() => {});
        const seconds = header?.trim() ? Number(header) : NaN;
        const date = header ? Date.parse(header) : NaN;
        const delay =
            Number.isFinite(seconds) && seconds >= 0
                ? seconds * 1000
                : Number.isFinite(date)
                  ? Math.max(0, date - Date.now())
                  : 0;
        throw new WalletAuthFailure(
            "network",
            "Sign-in is rate limited. Try again later.",
            Number.isSafeInteger(delay) && delay > 0 ? delay : 0
        );
    }
    if (!response.ok) {
        void response.body?.cancel().catch(() => {});
        throw new WalletAuthFailure(rejected, "The authentication request was rejected.");
    }
    const reader = response.body?.getReader();
    if (!reader) throw new WalletAuthFailure(rejected, "The authentication response was invalid.");
    // Bind the deadline directly to the response reader as well as fetch.
    // Transport cleanup must not delay authentication failure settlement.
    const cancelRead = () => {
        void reader.cancel().catch(() => {});
    };
    signal.addEventListener("abort", cancelRead, { once: true });
    if (signal.aborted) cancelRead();
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    try {
        for (;;) {
            if (signal.aborted) throw new WalletAuthFailure("network", "The authentication request timed out.");
            const item = await reader.read();
            if (signal.aborted) throw new WalletAuthFailure("network", "The authentication request timed out.");
            if (item.done) break;
            bytes += item.value.byteLength;
            if (bytes > 65536) throw new WalletAuthFailure(rejected, "The authentication response was invalid.");
            chunks.push(item.value);
        }
    } finally {
        signal.removeEventListener("abort", cancelRead);
        cancelRead();
        reader.releaseLock();
    }
    const raw = new Uint8Array(bytes);
    let offset = 0;
    for (const chunk of chunks) {
        raw.set(chunk, offset);
        offset += chunk.byteLength;
    }
    let body: unknown;
    try {
        body = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(raw));
    } catch {
        throw new WalletAuthFailure(rejected, "The authentication response was invalid.");
    }
    if (!body || typeof body !== "object" || Array.isArray(body))
        throw new WalletAuthFailure("network", "The authentication response was invalid.");
    return body as Record<string, unknown>;
}

const text = (value: unknown, max: number): value is string =>
    typeof value === "string" && value.trim().length > 0 && value.length <= max;

/** Bound only HTTP/body work. Wallet interaction has no timeout or automatic retry. */
async function authRequest(url: URL, init: RequestInit, lifecycle: AbortSignal, rejected: GlyphAuthErrorReason) {
    const controller = new AbortController();
    // Retain a direct signal and lifecycle listener through response-body settlement.
    const signal = controller.signal;
    const cancel = () => controller.abort();
    if (lifecycle.aborted) cancel();
    else lifecycle.addEventListener("abort", cancel, { once: true });
    const started = performance.now();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
        const response = await fetch(url, { ...init, signal, redirect: "error", credentials: "omit" });
        const body = await authJson(response, rejected, signal);
        if (signal.aborted || performance.now() - started >= 10000)
            throw new WalletAuthFailure("network", "The authentication request timed out.");
        return body;
    } finally {
        lifecycle.removeEventListener("abort", cancel);
        clearTimeout(timer);
        controller.abort();
    }
}

export async function fetchWalletMessage(origin: string, address: string, signal: AbortSignal) {
    const body = await authRequest(new URL(`/api/widget/auth/message/${address}`, origin), {}, signal, "network");
    if (!text(body.message, 16384) || !text(body.nonce, 1024))
        throw new WalletAuthFailure("network", "The sign-in message was invalid.");
    return { message: body.message, nonce: body.nonce };
}

export async function verifyWalletSignature(
    origin: string,
    address: string,
    signature: string,
    nonce: string,
    signal: AbortSignal
) {
    const body = await authRequest(
        new URL(`/api/widget/auth/verify/${address}`, origin),
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ signature, nonce })
        },
        signal,
        "verify_failed"
    );
    if (!text(body.token, 16384))
        throw new WalletAuthFailure("verify_failed", "Signature verification returned no token.");
    return body.token;
}

export function publicAuthError(error: unknown): GlyphAuthError {
    return error instanceof WalletAuthFailure
        ? { reason: error.reason, message: error.message }
        : { reason: "network", message: "Authentication failed." };
}
