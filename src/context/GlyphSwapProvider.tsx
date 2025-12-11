import { useCallback, useState } from "react";
import { GlyphSwapContext, GlyphSwapContextData } from "./GlyphSwapContext";
import { useGlyphApi } from "../hooks/useGlyphApi";

export function GlyphSwapProvider({ children }: { children: React.ReactNode }) {
    const { glyphApiFetch } = useGlyphApi();

    const [data, setData] = useState<GlyphSwapContextData>({
        fromCurrency: undefined,
        toCurrency: undefined,
        tradeType: "EXACT_INPUT",
        amount: "",
        topupGas: false,
        topupGasAmount: "2000000" // $2
    });

    const update = useCallback((data: Partial<GlyphSwapContext>) => {
        setData((prev) => ({ ...prev, ...data }));
    }, []);

    const reportSwapFailed = useCallback(async (id: string) => {
        if (!glyphApiFetch) return;
        await glyphApiFetch(`/api/widget/swap/quote/${id}/failed`, {
            method: "PATCH"
        });
    }, [glyphApiFetch]);

    return <GlyphSwapContext.Provider value={{ ...data, update, reportSwapFailed }}>{children}</GlyphSwapContext.Provider>;
}
