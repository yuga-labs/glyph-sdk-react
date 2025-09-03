import { useQuery } from "@tanstack/react-query";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { deepEqual, useChainId } from "wagmi";
import { useGlyphApi } from "../hooks/useGlyphApi";
import { TOKEN_REFRESH_INTERVAL_MS, USER_REFRESH_INTERVAL_MS } from "../lib/constants";
import { createLogger } from "../lib/utils";
import { GlyphWidgetBalances, GlyphWidgetUser } from "../types";
import { GlyphContext } from "./GlyphContext";
import { GlyphUserDataContext } from "./GlyphUserDataContext";

const logger = createLogger("GlyphData");

interface GlyphUserDataProviderProps {
    children: React.ReactNode;
}

export const GlyphUserDataProvider = ({ children }: GlyphUserDataProviderProps) => {
    const context = useContext(GlyphContext);
    if (!context) throw new Error("GlyphUserDataProvider must be used within GlyphProvider");

    const { ready, authenticated } = context;
    const { glyphApiFetch } = useGlyphApi();
    const chainId = useChainId();
    const chainIdRef = useRef(chainId);
    const [balances, setBalances] = useState<GlyphWidgetBalances | null>(null);
    const [balancesLoading, setBalancesLoading] = useState<boolean>(false);
    const [balancesLastRefreshed, setBalancesLastRefreshed] = useState<number>(0);
    const [hasBalances, setHasBalances] = useState<boolean>(false);

    const {
        data: user,
        refetch: refetchUserQuery,
        error: userError
    } = useQuery<GlyphWidgetUser | null>({
        queryKey: ["glyphWidgetUser", authenticated], // Query key depends on authentication status
        queryFn: async () => {
            if (!glyphApiFetch) {
                logger.warn("widget fetch not available");
                return null;
            }

            try {
                const resp = await glyphApiFetch("/api/widget/user");
                if (!resp.ok) {
                    // Try to parse error message, otherwise use status text
                    let errorMsg = `Failed to fetch user data: ${resp.status} ${resp.statusText}`;
                    try {
                        const errorBody = await resp.json();
                        errorMsg = errorBody.message || errorBody.error || errorMsg;
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    } catch (e) {
                        logger.warn("User data API error response", resp.status, errorMsg);
                        throw new Error(errorMsg);
                    }
                }
                const userData: GlyphWidgetUser = await resp.json();
                return userData;
            } catch (err) {
                logger.warn("User data fetch exception in useQuery", err);
                throw err; // throw error for react-query (triggers retry)
            }
        },
        enabled: ready && authenticated && !!glyphApiFetch,
        refetchInterval: USER_REFRESH_INTERVAL_MS,
        retry: (failureCount) => {
            const shouldRetry = failureCount < 5; // Retry up to 5 times (1 minute?)
            if (shouldRetry) logger.debug(`Retrying user fetch (attempt ${failureCount + 1})...`);
            return shouldRetry;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000) // Exponential backoff
    });

    const refreshBalances = useCallback(
        async (force: boolean = false, cbs?: Record<string, (diffAmount: number) => void>) => {
            if (!ready) return;
            if (!authenticated) return;
            if (!glyphApiFetch) return;
            if (!user) return;
            if (balancesLoading) return;

            const now = Date.now();
            if (!force && now - balancesLastRefreshed < TOKEN_REFRESH_INTERVAL_MS) return;

            try {
                setBalancesLoading(true);
                const res = await glyphApiFetch(`/api/widget/balances?chainId=${chainId}`);
                if (res.ok) {
                    const balanceData: GlyphWidgetBalances = await res.json();
                    if (deepEqual(balances, balanceData)) return setHasBalances(true);

                    // iterate over all cbs and call them if the balance has changed
                    Object.entries(cbs || {}).forEach(([symbol, cb]) => {
                        const newValue = balanceData?.tokens?.find?.((token) => token.symbol === symbol)?.value || "0";
                        const oldValue = balances?.tokens?.find?.((token) => token.symbol === symbol)?.value || "0";
                        if (newValue && newValue !== oldValue) cb(Number(newValue) - Number(oldValue));
                    });
                    // update the whole object
                    setBalances(balanceData);
                    setBalancesLastRefreshed(now);
                    setHasBalances(true);
                } else {
                    throw new Error("Failed to refresh balances");
                }
            } catch (err) {
                logger.warn("balances error", err);
                toast.error("Failed to refresh balances");
            } finally {
                setBalancesLoading(false);
            }
        },
        [authenticated, balances, balancesLastRefreshed, balancesLoading, chainId, ready, user, glyphApiFetch]
    );

    // Log user fetch errors from useQuery
    useEffect(() => {
        if (userError) {
            logger.error("Failed to load/refresh user data:", userError);
            // You could potentially show a toast here if needed,
            // but useQuery manages the error state internally.
            // toast.error("Failed to load user data.");
        }
    }, [userError]);

    // Wrapper function to match the existing context type for refreshUser
    // Calling refetch() ignores staleTime, effectively acting like force=true
    const refreshUser = useCallback(
        async (force: boolean = false): Promise<void> => {
            logger.debug(`Triggering user data refresh (force=${force})...`);
            await refetchUserQuery();
        },
        [refetchUserQuery]
    );

    // initially load balances
    useEffect(() => {
        if (ready && authenticated && glyphApiFetch && !balances) refreshBalances();
    }, [ready, authenticated, chainId, glyphApiFetch, refreshBalances, balances]);

    // reset balances when the user logs out
    useEffect(() => {
        if (ready && !authenticated && balances) {
            setBalances(null);
            setBalancesLastRefreshed(0);
            setHasBalances(false);
        }
    }, [ready, authenticated, balances]);

    // automatically refresh balances every 1 minute
    useEffect(() => {
        const interval = setInterval(() => refreshBalances(), TOKEN_REFRESH_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [refreshBalances]);

    // force refresh balances when chainId changes
    useEffect(() => {
        if (chainIdRef.current !== chainId) {
            setHasBalances(false);
            refreshBalances(true); // force balances reload
            chainIdRef.current = chainId;
        }
    }, [chainId, refreshBalances]);

    return (
        <GlyphUserDataContext.Provider
            value={{
                user: user ?? null, // Provide user data from query, default to null
                balances,
                hasBalances,
                refreshUser, // Provide the wrapped refetch function
                refreshBalances
            }}
        >
            {children}
        </GlyphUserDataContext.Provider>
    );
};
