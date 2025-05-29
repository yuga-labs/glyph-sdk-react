import { useState } from "react";
import { toast } from "sonner";
import { useGlyphApi } from "./useGlyphApi";
import { useChainId } from "wagmi";

export type ActivityBlockExplorerItem = {
    url: string;
    text: string;
};

export type ActivityItem = {
    id: string;
    type: "fund" | "send";
    type_text: string;
    status: string;
    status_text: string | null;
    status_color: string;
    symbol: string;
    value: string;
    amount: string;
    amount_currency: string;
    allowIdCopy: boolean;
    blockExplorerTxns?: ActivityBlockExplorerItem[];
};

export type ActivityGroup = {
    label: string;
    transactions: ActivityItem[];
};

export function useActivity(pageSize = 10) {
    const { glyphApiFetch } = useGlyphApi();
    const chainId = useChainId();
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [transactionGroups, setTransactionGroups] = useState<ActivityGroup[]>([]);

    const fetchTransactions = async (reset = false): Promise<ActivityGroup[] | null> => {
        try {
            setIsLoading(true);
            // start from beginning if reset
            const currentOffset = reset ? 0 : offset;

            if (!glyphApiFetch) return null;
            const res = await glyphApiFetch(
                `/api/widget/activity?chainId=${chainId}&offset=${currentOffset}&size=${pageSize}`
            );
            if (!res.ok) throw new Error("Failed to fetch transactions");

            const data = await res.json();
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

            return newGroups;
        } catch (e) {
            toast.error("Failed to fetch transactions");
            return null;
        } finally {
            setIsLoading(false);
        }
    };

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
        transactionGroups,
        fetchTransactions,
        loadMore,
        reset,
        hasMore,
        isLoading
    };
}
