import { useCallback } from "react";
import { useGlyphApi } from "./useGlyphApi";
import { useChainId } from "wagmi";

let controller: AbortController | null = null;

export type FUND_STATUS_API = "WAITING" | "IN_PROGRESS" | "SUCCESS" | "FAILED";

export type FundQuoteDTO = {
    id: string;
    in_amount: number;
    estimated_fees_amount: number;
    currency: string;
    out_tokens_amount: number;
    ape_to_currency: number;
    deposit_address: string;
    refresh_in_seconds: number;
    error?: string;
};

export type FundQuoteStatusOk = {
    ok: true;
    status: FUND_STATUS_API;
    details: string;
};

export type FundQuoteStatusError = {
    ok: false;
    status: null;
    details?: string;
};

export type FundQuoteStatus = FundQuoteStatusOk | FundQuoteStatusError;

export function useGlyphFundingApi() {
    const { glyphApiFetch } = useGlyphApi();
    const chainId = useChainId();
    const getPaymentLink = useCallback(
        async (quote: FundQuoteDTO) => {
            if (glyphApiFetch && quote?.id) {
                const res = await glyphApiFetch(`/api/widget/onramp/quote/${quote.id}/buy`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" }
                });
                const json = await res.json();
                return { url: res.ok ? json.url : null, ok: res.ok, error: json.error };
            }
            return { url: null, ok: false };
        },
        [glyphApiFetch]
    );

    const createQuote = useCallback(
        async (
            amount: string,
            currency: string,
            country: string,
            subdivision?: string,
            takeLatest?: boolean
        ) => {
            // Cancel previous request
            if (takeLatest) controller?.abort?.();

            if (!glyphApiFetch) return { quote: null, ok: false, error: "Glyph API not ready" };

            controller = new AbortController();
            const signal = controller.signal;
            const res = await glyphApiFetch("/api/widget/onramp/quote", {
                method: "POST",
                body: JSON.stringify({ chainId, amount, currency, country, subdivision }),
                headers: { "Content-Type": "application/json" },
                signal
            });

            const json = (await res.json()) as FundQuoteDTO;
            return { quote: res.ok ? json : null, ok: res.ok, error: json.error };
        },
        [chainId, glyphApiFetch]
    );

    const refreshQuote = useCallback(
        async (quote_id: string, amount: string) => {
            if (!glyphApiFetch) return { quote: null, ok: false, error: "Glyph API not ready" };

            const res = await glyphApiFetch(`/api/widget/onramp/quote/${quote_id}`, {
                method: "PATCH",
                body: JSON.stringify({ amount }),
                headers: { "Content-Type": "application/json" }
            });

            const json = (await res.json()) as FundQuoteDTO;
            return { quote: res.ok ? json : null, ok: res.ok, error: json.error };
        },
        [glyphApiFetch]
    );

    const getQuoteStatus = useCallback(
        async (quote: FundQuoteDTO): Promise<FundQuoteStatus> => {
            if (glyphApiFetch && quote?.id) {
                const res = await glyphApiFetch(`/api/widget/onramp/quote/${quote.id}/status`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" }
                });

                if (res.ok) {
                    const body = (await res.json()) as { status: FUND_STATUS_API; details: string };
                    return { ...body, ok: true };
                }

                return { status: null, ok: false };
            }
            return { status: null, ok: false, details: "" };
        },
        [glyphApiFetch]
    );

    return { getPaymentLink, createQuote, getQuoteStatus, refreshQuote };
}
