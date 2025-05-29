import { createContext } from "react";
import { GlyphWidgetBalances, GlyphWidgetUser } from "../types";

interface GlyphUserDataContextType {
    user: GlyphWidgetUser | null;
    refreshUser: (force?: boolean) => Promise<void>;
    balances: GlyphWidgetBalances | null;
    refreshBalances: (force?: boolean, cbs?: Record<string, (diffAmount: number) => void>) => Promise<void>;
}

export const GlyphUserDataContext = createContext<GlyphUserDataContextType | undefined>(undefined);
GlyphUserDataContext.displayName = "GlyphUserDataContext";
