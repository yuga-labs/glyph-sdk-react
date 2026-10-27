import type { GlyphApiFetch } from "../context/GlyphContext";
import type { GlyphAuthError } from "../types";
import { createApiFetch } from "../context/GlyphContext";
import {
    fetchWalletMessage,
    hasWalletActivation,
    publicAuthError,
    signingFailure,
    verifyWalletSignature,
    WalletAuthFailure
} from "./walletAuth";

type Session = { token: string; nonce: string };
type Message = { message: string; nonce: string };
type Snapshot = {
    generation: number;
    ready: boolean;
    authenticated: boolean;
    needsSignature: boolean;
    authError: GlyphAuthError | null;
    apiFetch: GlyphApiFetch | null;
};
type Options = {
    address: string;
    origin: string;
    /** Stable connector family; runtime instance identity is fenced by isCurrent. */
    connector: string;
    popup: boolean;
    isCurrent: () => boolean;
    sign: (message: string) => Promise<string>;
    onLogin: () => void;
    onAuthError: (error: GlyphAuthError) => void;
    storage?: Pick<Storage, "getItem" | "setItem" | "removeItem">;
    activation?: () => boolean;
};

/** One mounted wallet/origin/connector capability. No async result can change another generation. */
export function createWalletAuthSession(options: Options) {
    let active = false,
        epoch = 0,
        autoAttempted = false,
        signing = false,
        fetching = false;
    let session: Session | undefined, message: Message | undefined;
    let retryAt = 0,
        rateLimits = 0;
    let controller = new AbortController();
    let prefetch: Promise<void> | undefined;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    const listeners = new Set<() => void>();
    const storageKey = `__glyph-wallet-session-v2__:${JSON.stringify([options.origin, options.address.toLowerCase(), options.connector])}`;
    let snapshot: Readonly<Snapshot> = Object.freeze({
        generation: epoch,
        ready: false,
        authenticated: false,
        needsSignature: false,
        authError: null as GlyphAuthError | null,
        apiFetch: null as GlyphApiFetch | null
    });
    const current = (generation = epoch) => active && epoch === generation && options.isCurrent();
    const publish = (patch: Partial<Snapshot>) => {
        snapshot = Object.freeze({ ...snapshot, ...patch, generation: epoch });
        for (const listener of listeners) listener();
    };
    const storage = (work: (store: NonNullable<Options["storage"]>) => void) => {
        try {
            if (options.storage) work(options.storage);
        } catch {
            /* Storage is optional, never authority. */
        }
    };
    const callback = (work: () => void) => {
        try {
            work();
        } catch {
            /* Host callbacks cannot change authentication. */
        }
    };
    const capability =
        (credential: Session, generation: number): GlyphApiFetch =>
        async (path, init) => {
            const assert = () => {
                if (!current(generation) || session !== credential) throw new Error("Glyph wallet session changed");
            };
            assert();
            let target: URL;
            try {
                target = new URL(path, options.origin);
                if (target.origin !== options.origin || target.username || target.password) throw new Error();
            } catch {
                throw new Error("Unsupported Glyph request URL");
            }
            const signal = init?.signal ? AbortSignal.any([init.signal, controller.signal]) : controller.signal;
            const response = await createApiFetch(options.origin, undefined, {
                Authorization: `Bearer ${credential.token}`,
                "x-evm-address": options.address,
                "x-glyph-nonce": credential.nonce
            })(target.href, { ...init, signal, redirect: "error" });
            assert();
            if (response.status === 401) {
                // A late old response fails the assertion above and cannot revoke a new credential.
                revoke(true);
                report(new WalletAuthFailure("verify_failed", "The wallet session expired. Sign in again."), epoch);
                void prepare();
            }
            return response;
        };
    const report = (error: unknown, generation: number) => {
        if (!current(generation)) return;
        let failure = publicAuthError(error);
        if (error instanceof WalletAuthFailure && error.retryAfterMs !== undefined) {
            rateLimits++;
            const delay = error.retryAfterMs || Math.min(30000 * 2 ** Math.min(rateLimits - 1, 5), 600000);
            retryAt = Math.min(Number.MAX_SAFE_INTEGER, Date.now() + delay);
            failure = { ...failure, retryAt };
        }
        publish({ authError: failure, needsSignature: true });
        if (current(generation)) callback(() => options.onAuthError(failure));
    };
    const schedule = (generation: number) => {
        clearTimeout(retryTimer);
        if (!current(generation) || !retryAt) return;
        // Long Retry-After dates must not overflow a browser's signed 32-bit timer.
        retryTimer = setTimeout(
            () => {
                if (!current(generation)) return;
                if (Date.now() < retryAt) schedule(generation);
                else {
                    retryAt = 0;
                    void prepare();
                }
            },
            Math.max(1, Math.min(2147483647, retryAt - Date.now()))
        );
    };
    const prepare = (): Promise<void> => {
        if (!current() || session || message || prefetch) return prefetch ?? Promise.resolve();
        const generation = epoch;
        if (Date.now() < retryAt) {
            schedule(generation);
            return Promise.resolve();
        }
        fetching = true;
        publish({ ready: false });
        if (!current(generation)) return Promise.resolve();
        const pending = fetchWalletMessage(options.origin, options.address, controller.signal)
            .then((value) => {
                if (current(generation)) message = value;
            })
            .catch((error: unknown) => {
                report(error, generation);
            })
            .finally(() => {
                if (!current(generation) || prefetch !== pending) return;
                prefetch = undefined;
                fetching = false;
                publish({ ready: !signing, needsSignature: !session });
                if (retryAt) schedule(generation);
            });
        prefetch = pending;
        return pending;
    };
    const revoke = (forget: boolean) => {
        epoch++;
        controller.abort();
        controller = new AbortController();
        clearTimeout(retryTimer);
        session = undefined;
        message = undefined;
        prefetch = undefined;
        signing = false;
        fetching = false;
        autoAttempted = true;
        if (forget) storage((store) => store.removeItem(storageKey));
        publish({ ready: active, authenticated: false, apiFetch: null, authError: null, needsSignature: false });
    };
    const signIn = (generation: number): Promise<boolean> => {
        if (!current(generation) || signing) return Promise.resolve(false);
        autoAttempted = true;
        if (session) return Promise.resolve(true);
        if (Date.now() < retryAt) {
            publish({
                authError: { reason: "network", message: "Sign-in is rate limited. Try again later.", retryAt },
                needsSignature: true
            });
            return Promise.resolve(false);
        }
        if (!message) {
            // Never await network work before opening a popup. Prepare, then require a fresh click.
            void prepare();
            publish({ needsSignature: true });
            return Promise.resolve(false);
        }
        if (options.popup && !(options.activation ?? hasWalletActivation)()) {
            publish({ needsSignature: true });
            return Promise.resolve(false);
        }
        const challenge = message;
        signing = true;
        publish({ ready: false, needsSignature: false, authError: null });
        if (!current(generation)) return Promise.resolve(false);
        let signed: Promise<string>;
        try {
            signed = options.sign(challenge.message);
        } catch (error) {
            signed = Promise.reject(error);
        }
        return (async () => {
            try {
                let signature: string;
                try {
                    signature = await signed;
                } catch (error) {
                    throw signingFailure(error);
                }
                if (!current(generation)) return false;
                const token = await verifyWalletSignature(
                    options.origin,
                    options.address,
                    signature,
                    challenge.nonce,
                    controller.signal
                );
                if (!current(generation)) return false;
                session = { token, nonce: challenge.nonce };
                rateLimits = 0;
                retryAt = 0;
                storage((store) => store.setItem(storageKey, JSON.stringify(session)));
                publish({ authenticated: true, apiFetch: capability(session, generation), authError: null });
                if (current(generation)) callback(options.onLogin);
                return current(generation) && !!session;
            } catch (error) {
                if (!current(generation)) return false;
                message = undefined;
                session = undefined;
                storage((store) => store.removeItem(storageKey));
                publish({ authenticated: false, apiFetch: null });
                report(error, generation);
                return false;
            } finally {
                if (current(generation)) {
                    signing = false;
                    publish({ ready: !fetching, needsSignature: !session });
                    if (!session) void prepare();
                }
            }
        })();
    };
    return {
        subscribe(listener: () => void) {
            listeners.add(listener);
            return () => {
                listeners.delete(listener);
            };
        },
        getSnapshot: () => snapshot,
        current,
        signIn,
        automatic() {
            if (!current() || autoAttempted || !message || session || signing) return;
            if (options.popup && !(options.activation ?? hasWalletActivation)()) {
                autoAttempted = true;
                publish({ needsSignature: true });
                return;
            }
            void signIn(epoch);
        },
        start() {
            active = true;
            storage((store) => {
                store.removeItem("__glyph-widget-token__");
                store.removeItem("__glyph-widget-nonce__");
                try {
                    const saved = JSON.parse(store.getItem(storageKey) ?? "null");
                    if (
                        saved &&
                        typeof saved.token === "string" &&
                        saved.token.trim() &&
                        saved.token.length <= 16384 &&
                        typeof saved.nonce === "string" &&
                        saved.nonce.trim() &&
                        saved.nonce.length <= 1024
                    )
                        session = saved;
                } catch {
                    /* Malformed legacy state is not authenticated. */
                }
            });
            publish({ ready: true, authenticated: !!session, apiFetch: session ? capability(session, epoch) : null });
            if (!session) void prepare();
        },
        stop(forget = false) {
            const attempted = autoAttempted;
            active = false;
            revoke(forget);
            autoAttempted = attempted;
        },
        logout() {
            if (current()) revoke(true);
        },
        // A replaced instance shares its family's persistence key, but no longer
        // owns it. Committed scope cleanup already forgets the departing record.
        forget() {
            if (current()) revoke(true);
        }
    };
}
