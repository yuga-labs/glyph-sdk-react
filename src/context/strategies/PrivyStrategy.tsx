import { SignTypedDataParams, UnsignedTransactionRequest, useCrossAppAccounts, usePrivy } from "@privy-io/react-auth";
import react, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChainId } from "wagmi";
import { GLYPH_PRIVY_APP_ID, STAGING_GLYPH_PRIVY_APP_ID, WIDGET_API_BASE_URL } from "../../lib/constants";
import { BaseGlyphProviderOptions } from "../../types";
import { createApiFetch, GlyphApiFetch, GlyphContext } from "../GlyphContext";
import { selectPrivyWallet } from "./privyWallet";

const PrivyStrategy: react.FC<BaseGlyphProviderOptions> = ({
    children,
    glyphUrl,
    onLogin,
    onLogout,
    useStagingTenant
}) => {
    const chainId = useChainId();
    const {
        ready: privyReady,
        authenticated: privyAuthenticated,
        user: privyUser,
        getAccessToken: getPrivyAccessToken,
        login: privyLogin,
        logout: privyLogout,
        signMessage: privySignMessage,
        signTypedData: privySignTypedData,
        sendTransaction: privySendTransaction
    } = usePrivy();
    const {
        signMessage: crossAppSignMessage,
        signTypedData: crossAppSignTypedData,
        sendTransaction: crossAppSendTransaction
    } = useCrossAppAccounts();

    // Ready means resolution has settled, not that this identity has an EVM wallet.
    // Derive capabilities during render so account changes never expose old state.
    const wallet =
        privyReady && privyAuthenticated && privyUser?.id
            ? selectPrivyWallet(privyUser, useStagingTenant ? STAGING_GLYPH_PRIVY_APP_ID : GLYPH_PRIVY_APP_ID)
            : null;
    const walletAddress = wallet?.address ?? null;
    const usesCrossapp = wallet?.usesCrossapp ?? false;
    const providerAppId = wallet?.providerAppId ?? null;
    const userId = privyUser?.id;
    const scope = useMemo(
        () => ({
            active: true,
            privyReady,
            privyAuthenticated,
            userId,
            walletAddress,
            usesCrossapp,
            providerAppId,
            glyphUrl,
            useStagingTenant
        }),
        [privyReady, privyAuthenticated, userId, walletAddress, usesCrossapp, providerAppId, glyphUrl, useStagingTenant]
    );
    const currentScope = useRef(scope);
    currentScope.current = scope;
    const [, rerender] = useState(0);
    useEffect(() => {
        scope.active = true;
        return () => {
            scope.active = false;
        };
    }, [scope]);

    const assertWalletScope = useCallback(() => {
        if (!walletAddress || !scope.active || currentScope.current !== scope) {
            throw new Error("Glyph wallet session is unavailable or changed");
        }
    }, [scope, walletAddress]);

    const apiFetch = useMemo<GlyphApiFetch | null>(() => {
        if (!walletAddress || !scope.active) return null;
        return async (path, options) => {
            assertWalletScope();
            const token = await getPrivyAccessToken();
            assertWalletScope();
            if (!token) throw new Error("Privy access token is unavailable");
            // Check scope after token resolution, before creating address-bound headers.
            const response = await createApiFetch(glyphUrl || WIDGET_API_BASE_URL, undefined, {
                Authorization: `Bearer ${token}`,
                "x-evm-address": walletAddress
            })(path, options);
            assertWalletScope();
            return response;
        };
    }, [walletAddress, scope, assertWalletScope, getPrivyAccessToken, glyphUrl]);

    const authenticate = useCallback(async () => {
        await privyLogin();
        onLogin?.();
    }, [onLogin, privyLogin]);

    const logout = useCallback(async () => {
        if (currentScope.current !== scope) throw new Error("Glyph wallet session changed");
        // Revoke saved callbacks immediately, even while Privy logout is pending.
        scope.active = false;
        rerender((value) => value + 1);
        await privyLogout();
        onLogout?.();
    }, [scope, onLogout, privyLogout]);

    const signMessage = useCallback(
        async ({ message }: { message: string }) => {
            assertWalletScope();
            const signature = usesCrossapp
                ? await crossAppSignMessage(message, { address: walletAddress! })
                : (await privySignMessage({ message }, { address: walletAddress! })).signature;
            assertWalletScope();
            return signature;
        },
        [walletAddress, usesCrossapp, assertWalletScope, crossAppSignMessage, privySignMessage]
    );

    const signTypedData = useCallback(
        async ({ data }: { data: SignTypedDataParams }) => {
            assertWalletScope();
            const signature = usesCrossapp
                ? await crossAppSignTypedData(data, { address: walletAddress! })
                : (await privySignTypedData(data, { address: walletAddress! })).signature;
            assertWalletScope();
            return signature;
        },
        [walletAddress, usesCrossapp, assertWalletScope, crossAppSignTypedData, privySignTypedData]
    );

    const sendTransaction = useCallback(
        async ({ transaction }: { transaction: UnsignedTransactionRequest }) => {
            assertWalletScope();
            const tx = { ...transaction, chainId: transaction.chainId || chainId };
            const hash = usesCrossapp
                ? await crossAppSendTransaction(tx, { address: walletAddress! })
                : (await privySendTransaction(tx, { address: walletAddress! })).hash;
            assertWalletScope();
            return hash;
        },
        [chainId, usesCrossapp, walletAddress, assertWalletScope, crossAppSendTransaction, privySendTransaction]
    );

    const signIn = useCallback(async () => {
        try {
            await authenticate();
            return true;
        } catch {
            return false;
        }
    }, [authenticate]);

    return (
        <GlyphContext.Provider
            value={{
                ready: privyReady,
                authenticated: !!walletAddress && scope.active,
                glyphUrl: glyphUrl as string,
                login: authenticate,
                signIn,
                needsSignature: false,
                authError: null,
                logout,
                signMessage,
                signTypedData,
                sendTransaction,
                apiFetch: scope.active ? apiFetch : null
            }}
        >
            {children}
        </GlyphContext.Provider>
    );
};

export default memo(PrivyStrategy);
