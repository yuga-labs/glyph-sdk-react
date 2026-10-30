import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useGlyphReadScope } from "./useGlyphReadScope";
import { fetchScopedGlyphData } from "../context/glyphDataQuery";
import { useChainId } from "wagmi";
import { useGlyph } from "./useGlyph";
import { relayClient } from "../lib/relay";

export type ActivityBlockExplorerItem = {
    url: string;
    text: string;
};

export enum DB_OFFCHAIN_TX_TYPE {
    FUND = "FUND",
    SWAP = "SWAP",
    WITHDRAW = "WITHDRAW"
}

export enum DB_ONCHAIN_TX_TYPE {
    SEND = "SEND",
    RECEIVE = "RECEIVE",
    TRANSFER = "TRANSFER",
    PAY = "PAY"
}

export type ActivityType = DB_OFFCHAIN_TX_TYPE | DB_ONCHAIN_TX_TYPE;

export type ActivityItem = {
    id: string;
    type: ActivityType;
    type_text: string;
    status: string;
    status_text: string | null;
    status_color: string;
    symbol: string;
    value: string;
    amount: string;
    amount_currency: string;
    name_on_list: string | null;
    allowIdCopy: boolean;
    detail_rows: string[];
    blockExplorerTxns?: ActivityBlockExplorerItem[];
    chain_id: number;
};

export type ActivityGroup = {
    label: string;
    transactions: ActivityItem[];
};

export function useActivity(
    pageSize = 10,
    filter?: {
        types: ActivityType[];
    }
) {
    const chains = relayClient?.chains || [];
    const { fetchForAllNetworks, user } = useGlyph();
    const { scope, isCurrent } = useGlyphReadScope(user?.evmWallet);
    const abortController = useRef<AbortController | null>(null);
    const chainId = useChainId();
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [transactionGroups, setTransactionGroups] = useState<ActivityGroup[]>([]);

    const types = filter?.types?.join(",") ?? "";
    const chainIds = fetchForAllNetworks ? chains.map((c) => c.id).join(",") : String(chainId);
    const requestKey = `${scope.key}:${chainIds}:${pageSize}:${types}`;
    const currentKey = useRef(requestKey);
    currentKey.current = requestKey;
    const [dataKey, setDataKey] = useState(requestKey);
    useEffect(() => {
        setOffset(0);
        setHasMore(true);
        setIsLoading(false);
        setTransactionGroups([]);
        setDataKey(requestKey);
        return () => {
            abortController.current?.abort();
        };
    }, [requestKey]);

    const fetchTransactions = useCallback(
        async (reset = false): Promise<ActivityGroup[] | null> => {
            if (!isCurrent() || currentKey.current !== requestKey) return null;
            abortController.current?.abort();
            const controller = new AbortController();
            abortController.current = controller;
            const active = () => isCurrent() && currentKey.current === requestKey && !controller.signal.aborted;
            try {
                setIsLoading(true);

                // start from beginning if reset
                const currentOffset = reset ? 0 : offset;
                if (reset) setTransactionGroups([]);

                const { value: data } = await fetchScopedGlyphData<{
                    groups?: ActivityGroup[];
                    transactions?: ActivityItem[];
                }>(
                    scope.apiFetch,
                    `/api/widget/activity?chainId=${chainIds}&offset=${currentOffset}&size=${pageSize}&type=${types}`,
                    controller.signal,
                    active,
                    scope.key
                );
                let newGroups: ActivityGroup[] = [];

                // grouped transactions
                if (data.groups) newGroups = data.groups;
                // support old format (no grouping)
                else if (data.transactions) {
                    newGroups = [
                        {
                            label: "",
                            transactions: data.transactions
                        }
                    ];
                }

                if (reset) {
                    setTransactionGroups(newGroups);
                    setOffset(newGroups.reduce((count, group) => count + group.transactions.length, 0));
                } else {
                    const mergedGroups = mergeTransactionGroups(transactionGroups, newGroups);
                    setTransactionGroups(mergedGroups);
                    setOffset(currentOffset + pageSize);
                }

                // check if we have more to load
                const totalNewTransactions = newGroups.reduce((count, group) => count + group.transactions.length, 0);
                setHasMore(totalNewTransactions === pageSize);
                setDataKey(requestKey);
                return newGroups;
            } catch (e: any) {
                // handle and don't retry if aborted
                if (e?.name?.includes?.("AbortError")) {
                    return null;
                }
                if (active()) toast.error("Failed to fetch transactions");
                return null;
            } finally {
                if (isCurrent() && currentKey.current === requestKey && abortController.current === controller) {
                    setIsLoading(false);
                }
            }
        },
        [scope, isCurrent, requestKey, chainIds, types, pageSize, offset, transactionGroups]
    );

    const loadMore = async (): Promise<boolean> => {
        if (!hasMore || isLoading) return false;
        await fetchTransactions();
        return true;
    };

    const reset = async (): Promise<void> => {
        setOffset(0);
        setHasMore(true);
        await fetchTransactions(true);
    };

    // merge transactions from overlapping groups
    const mergeTransactionGroups = (existing: ActivityGroup[], newGroups: ActivityGroup[]): ActivityGroup[] => {
        const mergedGroups: Record<string, ActivityItem[]> = {};

        existing.forEach((group) => {
            mergedGroups[group.label] = [...(mergedGroups[group.label] || []), ...group.transactions];
        });

        newGroups.forEach((group) => {
            mergedGroups[group.label] = [...(mergedGroups[group.label] || []), ...group.transactions];
        });

        const result = Object.entries(mergedGroups).map(([label, transactions]) => ({
            label,
            transactions
        }));

        result.sort((a, b) => {
            // handle empty label case (for old format)
            if (!a.label) return -1;
            if (!b.label) return 1;

            // TODO: handle custom (no date) labels (e.g. "today", "last 24 hours", "last 7 days", etc)
            const dateA = new Date(a.label);
            const dateB = new Date(b.label);
            return dateB.getTime() - dateA.getTime();
        });

        return result;
    };

    return {
        refreshKey: requestKey,
        transactionGroups: dataKey === requestKey && isCurrent() ? transactionGroups : [],
        fetchTransactions,
        loadMore,
        reset,
        hasMore,
        isLoading
    };
}
