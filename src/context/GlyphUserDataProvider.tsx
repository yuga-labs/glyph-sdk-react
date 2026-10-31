import { decodeGlyphBalances } from "../lib/balancesImageTransport";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import react, { PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { isAddress } from "viem";
import { deepEqual, useChainId } from "wagmi";
import { TOKEN_REFRESH_INTERVAL_MS, USER_REFRESH_INTERVAL_MS } from "../lib/constants";
import { createLogger } from "../lib/utils";
import { GlyphWidgetBalances, GlyphWidgetUser } from "../types";
import { GlyphContext } from "./GlyphContext";
import { GlyphUserDataContext } from "./GlyphUserDataContext";
import { fetchScopedGlyphData, shouldRetryGlyphData } from "./glyphDataQuery";

const logger = createLogger("GlyphData");

export const GlyphUserDataProvider: react.FC<PropsWithChildren> = ({ children }) => {
    const context = useContext(GlyphContext);
    if (!context) throw new Error("GlyphUserDataProvider must be used within GlyphProvider");
    const { ready, authenticated, apiFetch, glyphUrl } = context;
    const queryClient = useQueryClient();
    const chainId = useChainId();
    const [fetchForAllNetworks, setFetchForAllNetworks] = useState(false);
    const resolvedChainId = fetchForAllNetworks ? "all" : chainId;

    // A capability is tied to its strategy's identity. Never serialize it, a token,
    // or an address into a key. New provider/auth/API lifetimes get opaque IDs.
    const session = useMemo(
        () => ({
            key: crypto.randomUUID(),
            apiFetch: ready && authenticated ? apiFetch : null,
            glyphUrl,
            active: true
        }),
        [ready, authenticated, apiFetch, glyphUrl]
    );
    const currentSession = useRef(session);
    currentSession.current = session;
    const isCurrentSession = useCallback(
        () => currentSession.current === session && session.active && !!session.apiFetch,
        [session]
    );
    useEffect(() => {
        session.active = true;
        return () => {
            session.active = false;
            void queryClient.cancelQueries({ predicate: (query) => query.queryKey[1] === session.key });
        };
    }, [session, queryClient]);

    const userQuery = useQuery({
        queryKey: ["glyphWidgetUser", session.key],
        queryFn: ({ signal }) =>
            fetchScopedGlyphData<GlyphWidgetUser>(
                session.apiFetch,
                "/api/widget/user",
                signal,
                isCurrentSession,
                session.key
            ),
        enabled: isCurrentSession(),
        // Private data must not survive this provider/session or inherit the host's
        // keepPreviousData setting when keys change.
        gcTime: 0,
        placeholderData: () => undefined,
        refetchInterval: USER_REFRESH_INTERVAL_MS,
        retry: (count, error) => isCurrentSession() && shouldRetryGlyphData(error, count, 5),
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000)
    });
    const user =
        isCurrentSession() && !userQuery.isError && userQuery.data?.scope === session.key ? userQuery.data.value : null;

    // The widget user DTO has no id. Wallet readiness gates balances; opaque
    // session/scope IDs isolate the cache without serializing wallet addresses.
    const evmWallet = user?.evmWallet;
    const balanceScope = useMemo(
        () => ({
            key: crypto.randomUUID(),
            session,
            chain: resolvedChainId,
            evmWallet,
            active: true
        }),
        [session, resolvedChainId, evmWallet]
    );
    const currentBalanceScope = useRef(balanceScope);
    currentBalanceScope.current = balanceScope;
    const isCurrentBalanceScope = useCallback(
        () =>
            isCurrentSession() &&
            currentBalanceScope.current === balanceScope &&
            balanceScope.active &&
            typeof balanceScope.evmWallet === "string" &&
            isAddress(balanceScope.evmWallet, { strict: false }),
        [balanceScope, isCurrentSession]
    );
    useEffect(() => {
        balanceScope.active = true;
        return () => {
            balanceScope.active = false;
            void queryClient.cancelQueries({
                queryKey: ["glyphWidgetBalances", session.key, balanceScope.key],
                exact: true
            });
        };
    }, [balanceScope, session, queryClient]);

    const balancesQuery = useQuery({
        queryKey: ["glyphWidgetBalances", session.key, balanceScope.key],
        queryFn: ({ signal }) =>
            fetchScopedGlyphData<GlyphWidgetBalances>(
                session.apiFetch,
                `/api/widget/balances?chainId=${balanceScope.chain}&nftImageEncoding=references-v1`,
                signal,
                isCurrentBalanceScope,
                balanceScope.key,
                decodeGlyphBalances
            ),
        enabled: isCurrentBalanceScope(),
        gcTime: 0,
        placeholderData: () => undefined,
        refetchInterval: TOKEN_REFRESH_INTERVAL_MS,
        retry: (count, error) => isCurrentBalanceScope() && shouldRetryGlyphData(error, count, 3),
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000)
    });
    const balances =
        isCurrentBalanceScope() && !balancesQuery.isError && balancesQuery.data?.scope === balanceScope.key
            ? balancesQuery.data.value
            : null;

    const { refetch: refetchUserQuery } = userQuery;
    const { refetch: refetchBalancesQuery } = balancesQuery;
    const refreshUser = useCallback(
        async (force = false): Promise<void> => {
            // QueryObserver.refetch bypasses enabled and can follow a changed key.
            // Saved callbacks must therefore check their original capability first.
            if (!isCurrentSession()) return;
            // Preserve fire-and-forget callers: errors remain in query state.
            await refetchUserQuery({ throwOnError: false, cancelRefetch: force });
        },
        [isCurrentSession, refetchUserQuery]
    );

    const refreshBalances = useCallback(
        async (force = false, cbs?: Record<string, (diffAmount: number) => void>): Promise<void> => {
            if (!isCurrentBalanceScope()) return;
            const result = await refetchBalancesQuery({ throwOnError: false, cancelRefetch: force });
            if (!isCurrentBalanceScope() || result.isError || result.data?.scope !== balanceScope.key || !cbs) return;
            const next = result.data.value;
            if (deepEqual(balances, next)) return;
            for (const [symbol, callback] of Object.entries(cbs)) {
                // A callback may synchronously log out or change the provider.
                if (!isCurrentBalanceScope()) return;
                const value =
                    next.tokens?.find((token) => `${token.chainId}:${token.address}` === symbol)?.value || "0";
                const previous =
                    balances?.tokens?.find((token) => `${token.chainId}:${token.address}` === symbol)?.value || "0";
                if (value !== previous) callback(Number(value) - Number(previous));
            }
        },
        [isCurrentBalanceScope, refetchBalancesQuery, balanceScope, balances]
    );

    useEffect(() => {
        if (isCurrentSession() && userQuery.error) logger.error("Failed to load/refresh user data");
    }, [isCurrentSession, userQuery.error]);
    useEffect(() => {
        if (isCurrentBalanceScope() && balancesQuery.error) toast.error("Failed to fetch balances");
    }, [isCurrentBalanceScope, balancesQuery.error]);

    return (
        <GlyphUserDataContext.Provider
            value={{
                user,
                balances,
                hasBalances: !!balances,
                isBalancesLoading: isCurrentBalanceScope() && balancesQuery.isFetching,
                refreshUser,
                refreshBalances,
                setFetchForAllNetworks,
                fetchForAllNetworks
            }}
        >
            {children}
        </GlyphUserDataContext.Provider>
    );
};
