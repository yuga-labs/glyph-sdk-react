import { paths } from "@relayprotocol/relay-sdk";
import { createContext, useContext } from "react";

export type RelayAPIToken = paths["/currencies/v2"]["post"]["responses"]["200"]["content"]["application/json"][number];

export type GlyphSwapContextData = {
    fromCurrency: RelayAPIToken | undefined;
    toCurrency: RelayAPIToken | undefined;
    tradeType: "EXACT_INPUT" | "EXACT_OUTPUT";
    amount: string; // amount in wei
    topupGas: boolean;
    topupGasAmount: string;
};

type GlyphSwapContextFns = {
    update: (data: Partial<GlyphSwapContext>) => void;
    reportSwapFailed: (id: string) => Promise<void>;
};

export type GlyphSwapContext = GlyphSwapContextData & GlyphSwapContextFns;

export const GlyphSwapContext = createContext<GlyphSwapContext | undefined>(undefined);

export const useGlyphSwap = () => {
    const context = useContext(GlyphSwapContext);
    if (!context) throw new Error("useGlyphSwap must be used within GlyphSwapProvider");

    return context;
};
