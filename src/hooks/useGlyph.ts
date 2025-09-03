import { UnsignedTransactionRequest } from "@privy-io/react-auth";
import { useContext, useEffect, useState } from "react";
import { Hex } from "viem";
import { GlyphContext } from "../context/GlyphContext";
import { GlyphUserDataContext } from "../context/GlyphUserDataContext";
import { DASHBOARD_BASE_URL } from "../lib/constants";
import { GlyphWidgetBalances, GlyphWidgetUser } from "../types";

export interface GlyphInterface {
    /**
     * Check whether the `GlyphContext` is ready to be used. You should wait for this to
     * be true before using values such as `authenticated` and `user`.
     */
    ready: boolean;

    /**
     * True if the user is authenticated, false otherwise.
     *
     * You should always check that `ready` is true before using this value. Otherwise,
     * the value may outdated while the Glyph context finishes its initialization.
     */
    authenticated: boolean;

    /**
     * Whether to hide the Glyph Widget.
     */
    hideWidget?: boolean;

    signMessage: (params: { message: string }) => Promise<unknown>;
    sendTransaction: (params: {
        transaction: Omit<UnsignedTransactionRequest, "chainId">;
    }) => Promise<string | { hash: Hex }>;

    login: () => void;

    logout: () => void;

    /**
     * The base URL for the Glyph Widget API (optional, uses default DASHBOARD_BASE_URL from envs if not provided)
     */
    glyphUrl: string;
}

export interface GlyphHook extends GlyphInterface {
    /**
     * The user object, or null if the user is not authenticated.
     */
    user: GlyphWidgetUser | null;

    refreshUser: (force?: boolean) => Promise<void>;

    /**
     * The symbol of the native token, or "APE" if not found.
     */
    nativeSymbol: string;

    /**
     * The balances object, or null if the user is not authenticated.
     */
    balances: GlyphWidgetBalances | null;

    /**
     * Whether the balances have been loaded (false on first load or when user just switched chains)
     */
    hasBalances: boolean;

    refreshBalances: (force?: boolean, cbs?: Record<string, (diffAmount: number) => void>) => Promise<void>;
}

export const useGlyph = (): GlyphHook => {
    const context = useContext(GlyphContext);
    if (!context) throw new Error("useGlyph must be used within GlyphProvider");

    const userCtx = useContext(GlyphUserDataContext);
    if (!userCtx) throw new Error("useGlyph must be used within GlyphUserDataProvider");

    const { ready, authenticated, login, logout, signMessage, sendTransaction, glyphUrl, hideWidget } = context;
    const { user, refreshUser, balances, hasBalances, refreshBalances } = userCtx;

    const [nativeSymbol, setNativeSymbol] = useState<string>("");

    useEffect(() => {
        if (!hasBalances || !ready || !authenticated) return;
        if (balances?.tokens?.find?.((token) => token.native)) {
            setNativeSymbol(balances?.tokens?.find?.((token) => token.native)?.symbol || "APE");
        }
    }, [balances, hasBalances, ready, authenticated]);

    return {
        ready,
        authenticated,
        user,
        refreshUser,
        balances,
        hasBalances,
        refreshBalances,
        login,
        logout,
        signMessage,
        nativeSymbol,
        sendTransaction,
        glyphUrl: glyphUrl || DASHBOARD_BASE_URL, // Return the glyphUrl if it is overridden, otherwise return the default dashboard URL from envs
        hideWidget
    };
};
