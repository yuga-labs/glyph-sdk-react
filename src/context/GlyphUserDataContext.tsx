import { createContext } from "react";
import { GlyphWidgetBalances, GlyphWidgetUser } from "../types";

interface GlyphUserDataContextType {
    user: GlyphWidgetUser | null;
    isUserLoading: boolean;
    isUserError: boolean;
    refreshUser: (force?: boolean) => Promise<void>;
    balances: GlyphWidgetBalances | null;
    hasBalances: boolean;
    isBalancesLoading: boolean;
    isBalancesError: boolean;
    refreshBalances: (force?: boolean, cbs?: Record<string, (diffAmount: number) => void>) => Promise<void>;
    setFetchForAllNetworks: (value: boolean) => void;
    fetchForAllNetworks: boolean;
}

export const GlyphUserDataContext = createContext<GlyphUserDataContextType | undefined>(undefined);
