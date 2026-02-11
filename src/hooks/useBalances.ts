import { useContext } from "react";
import { GlyphUserDataContext } from "../context/GlyphUserDataContext";

export function useBalances() {
    const context = useContext(GlyphUserDataContext);
    if (!context) throw new Error("useBalances must be used within GlyphProvider");

    const { balances, hasBalances, refreshBalances } = context;

    return { balances, hasBalances, refreshBalances };
}
