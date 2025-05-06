import { UnsignedTransactionRequest } from "@privy-io/react-auth";
import { useContext } from "react";
import { GlyphContext } from "../context/GlyphContext";
import { Hex } from "viem";
import { GlyphWidgetBalances, GlyphWidgetUser } from "../types";
import { GlyphUserDataContext } from "../context/GlyphUserDataContext";

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

    symbol: string;

    signMessage: (params: { message: string }) => Promise<unknown>;
    sendTransaction: (params: {
        transaction: Omit<UnsignedTransactionRequest, "chainId">;
    }) => Promise<string | { hash: Hex }>;

    login: () => void;

    logout: () => void;

    /**
     * The base URL for the Glyph Widget API (optional, uses default if not provided)
     */
    glyphUrl?: string;
}

export interface GlyphHook extends GlyphInterface {
    /**
     * The user object, or null if the user is not authenticated.
     */
    user: GlyphWidgetUser | null;

    refreshUser: (force?: boolean) => Promise<void>;

    /**
     * The balances object, or null if the user is not authenticated.
     */
    balances: GlyphWidgetBalances | null;

    refreshBalances: (force?: boolean, cbs?: Record<string, (diffAmount: number) => void>) => Promise<void>;
}

export const useGlyph = (): GlyphHook => {
    const context = useContext(GlyphContext);
    if (!context) throw new Error("useGlyph must be used within GlyphProvider");

    const userCtx = useContext(GlyphUserDataContext);
    if (!userCtx) throw new Error("useGlyph must be used within GlyphUserDataProvider");

    const { ready, authenticated, login, logout, signMessage, symbol, sendTransaction, glyphUrl, hideWidget } = context;
    const { user, refreshUser, balances, refreshBalances } = userCtx;

    return {
        ready,
        authenticated,
        user,
        refreshUser,
        balances,
        refreshBalances,
        login,
        logout,
        signMessage,
        symbol,
        sendTransaction,
        glyphUrl,
        hideWidget
    };
};
