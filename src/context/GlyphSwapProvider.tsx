import { useCallback, useState } from "react";
import { useGlyphApi } from "../hooks/useGlyphApi";
import { GlyphSwapContext, GlyphSwapContextData } from "./GlyphSwapContext";

export function GlyphSwapProvider({ children }: { children: React.ReactNode }) {
    const { glyphApiFetch } = useGlyphApi();

    const [data, setData] = useState<GlyphSwapContextData>({
        fromCurrency: undefined,
        toCurrency: undefined,
        tradeType: "EXACT_INPUT",
        amount: "", // amount in wei
        topupGas: false,
        topupGasAmount: "2000000" // $2
    });

    const update = useCallback((data: Partial<GlyphSwapContext>) => {
        setData((prev) => ({ ...prev, ...data }));
    }, []);

    const reportSwapFailed = useCallback(
        async (id: string) => {
            if (!glyphApiFetch) return;
            await glyphApiFetch(`/api/widget/swap/quote/${id}/failed`, {
                method: "PATCH"
            });
        },
        [glyphApiFetch]
    );

    return (
        <GlyphSwapContext.Provider value={{ ...data, update, reportSwapFailed }}>{children}</GlyphSwapContext.Provider>
    );
}
