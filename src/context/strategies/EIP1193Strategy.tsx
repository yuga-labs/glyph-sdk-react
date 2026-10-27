import type { SignTypedDataParams, UnsignedTransactionRequest } from "@privy-io/react-auth";
import react, { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import {
    useAccount,
    useAccountEffect,
    useDisconnect,
    useSendTransaction,
    useSignMessage,
    useSignTypedData
} from "wagmi";
import { WIDGET_API_BASE_URL, glyphConnectorDetails } from "../../lib/constants";
import { walletAuthOrigin } from "../../lib/walletAuth";
import { createWalletAuthSession } from "../../lib/walletAuthSession";
import { createLogger } from "../../lib/utils";
import type { BaseGlyphProviderOptionsWithSignature } from "../../types";
import { GlyphContext } from "../GlyphContext";

const logger = createLogger("EIP1193Strategy");
const EIP1193Strategy: react.FC<BaseGlyphProviderOptionsWithSignature> = ({
    children,
    glyphUrl,
    onLogin,
    onLogout,
    onAuthError,
    askForSignature = true
}) => {
    const { address, isConnected, chainId, connector } = useAccount();
    const { disconnectAsync } = useDisconnect();
    const { signMessageAsync } = useSignMessage();
    const { signTypedDataAsync } = useSignTypedData();
    const { sendTransactionAsync } = useSendTransaction();
    const origin = walletAuthOrigin(glyphUrl || WIDGET_API_BASE_URL);
    const current = useRef<ReturnType<typeof createWalletAuthSession> | null>(null);
    const latest = useRef({ onLogin, onLogout, onAuthError, signMessageAsync });
    latest.current = { onLogin, onLogout, onAuthError, signMessageAsync };
    const logoutNotified = useRef(false);
    const lastConnected = useRef<ReturnType<typeof createWalletAuthSession> | null>(null);
    // UID stays in the live identity; only its stable family is persisted.
    const connectorIdentity = useMemo(
        () => ({ family: JSON.stringify([connector?.id, connector?.type]), uid: connector?.uid }),
        [connector?.id, connector?.type, connector?.uid]
    );
    const session = useMemo(() => {
        const instance = createWalletAuthSession({
            address: address ?? "",
            origin: origin ?? "",
            connector: connectorIdentity.family,
            popup: connector?.type === "privy" || connector?.id === glyphConnectorDetails.id,
            isCurrent: () => current.current === instance && !!address && isConnected && !!origin,
            sign: (message) => latest.current.signMessageAsync({ account: address!, message }),
            onLogin: () => {
                logoutNotified.current = false;
                latest.current.onLogin?.();
            },
            onAuthError: (error) => latest.current.onAuthError?.(error),
            storage:
                typeof window === "undefined"
                    ? undefined
                    : {
                          getItem: (key) => window.localStorage.getItem(key),
                          setItem: (key, value) => window.localStorage.setItem(key, value),
                          removeItem: (key) => window.localStorage.removeItem(key)
                      }
        });
        return instance;
    }, [address, isConnected, origin, connectorIdentity, connector?.type, connector?.id]);
    // Render-time fencing revokes old callbacks before passive effect cleanup.
    current.current = session;
    const disconnectOwner = isConnected ? session : lastConnected.current;
    if (isConnected) lastConnected.current = session;
    const state = useSyncExternalStore(session.subscribe, session.getSnapshot, session.getSnapshot);
    useEffect(() => {
        session.start();
        // A committed live scope replacement forgets its old record. Ordinary
        // unmount/StrictMode replay keeps it for restoration by the same family.
        return () => session.stop(current.current !== session);
    }, [session]);
    useEffect(() => {
        if (askForSignature) session.automatic();
    }, [session, state, askForSignature]);
    const signIn = useCallback(() => session.signIn(state.generation), [session, state.generation]);
    const notifyLogout = useCallback(() => {
        if (logoutNotified.current) return;
        logoutNotified.current = true;
        try {
            latest.current.onLogout?.();
        } catch {
            logger.error("Logout callback failed");
        }
    }, []);
    const logout = useCallback(async () => {
        if (!session.current(state.generation)) return;
        session.logout();
        notifyLogout();
        try {
            await disconnectAsync();
        } catch {
            logger.error("Wallet disconnect failed");
        }
    }, [session, state.generation, notifyLogout, disconnectAsync]);
    useAccountEffect({
        onDisconnect: () => {
            disconnectOwner?.forget();
            if (current.current === disconnectOwner || !isConnected) notifyLogout();
        }
    });
    const assertCurrent = useCallback(() => {
        if (!session.current(state.generation)) throw new Error("Glyph wallet session changed");
    }, [session, state.generation]);
    const signMessage = useCallback(
        async ({ message }: { message: string }) => {
            assertCurrent();
            const result = await signMessageAsync({ account: address!, message });
            assertCurrent();
            return result;
        },
        [assertCurrent, address, signMessageAsync]
    );
    const signTypedData = useCallback(
        async ({ data }: { data: SignTypedDataParams }) => {
            assertCurrent();
            const result = await signTypedDataAsync({
                types: data.types,
                primaryType: data.primaryType as string,
                message: data.message
            });
            assertCurrent();
            return result;
        },
        [assertCurrent, signTypedDataAsync]
    );
    const sendTransaction = useCallback(
        async ({ transaction }: { transaction: UnsignedTransactionRequest }) => {
            assertCurrent();
            const result = await sendTransactionAsync({
                ...transaction,
                chainId: transaction.chainId || chainId
            } as any);
            assertCurrent();
            return result;
        },
        [assertCurrent, sendTransactionAsync, chainId]
    );
    const live = session.current(state.generation);
    return (
        <GlyphContext.Provider
            value={{
                ready: state.ready,
                authenticated: live && state.authenticated,
                glyphUrl: glyphUrl as string,
                hideWidget: !isConnected || !address,
                login: signIn,
                signIn,
                needsSignature: live && state.needsSignature,
                authError: live ? state.authError : null,
                logout,
                signMessage,
                signTypedData,
                sendTransaction,
                apiFetch: live ? state.apiFetch : null
            }}
        >
            {children}
        </GlyphContext.Provider>
    );
};
export default EIP1193Strategy;
