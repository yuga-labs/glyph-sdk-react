import { useCallback, useEffect, useMemo, useState } from "react";
import { debounce } from "throttle-debounce";
import { formatCurrency } from "../lib/intl";
import { openPopup } from "../lib/popup";
import { useBalances } from "./useBalances";
import { useGlyph } from "./useGlyph";
import { FUND_STATUS_API, FundQuoteDTO, useGlyphFundingApi } from "./useGlyphFundingApi";
import { useChainId } from "wagmi";
import { apeChain } from "viem/chains";

const ONRAMP_POPUP_HEIGHT = 720; // recommended height of a Coinbase Onramp popup window.
const ONRAMP_POPUP_WIDTH = 460; // recommended width of a Coinbase Onramp popup window.
const ONRAMP_FUNDING_STATUS_REFRESH_INTERNAL_MS = 10 * 1000;

const ONRAMP_UNSUPPORTED_REGION_MSG = "Region not supported";
const ONRAMP_UNSUPPORTED_CHAIN_MSG = "Chain not supported";

type INITIAL_FUND_STATUS = "STARTED";
export type GLYPH_FUND_STATUS = INITIAL_FUND_STATUS | FUND_STATUS_API;

export function useGlyphFunding() {
    const { user } = useGlyph();
    const { refreshBalances } = useBalances();
    const chainId = useChainId();
    const { getPaymentLink, createQuote, getQuoteStatus, refreshQuote } = useGlyphFundingApi();

    const [fundAmount, setFundAmount_] = useState<string>("");
    const [currency, setCurrency] = useState<string>("");
    const [minFundingAmount, setMinFundingAmount] = useState<number>(2);
    const [maxFundingAmount, setMaxFundingAmount] = useState<number>(999999);
    const [fundAmountError, setFundAmountError] = useState<string | null>(null);
    const [fundStatus, setFundStatus] = useState<GLYPH_FUND_STATUS>("STARTED");
    const [quoteLoading, setQuoteLoading] = useState<boolean>(false);
    const [fundInProgress, setFundInProgress] = useState<boolean>(false);
    const [fundStatusFetchCount, setFundStatusFetchCount] = useState<number>(0);
    const [fundQuote, setFundQuote] = useState<FundQuoteDTO | null>(null);
    const [fundError, setFundError] = useState<string | null>(null);
    const [fundDone, setFundDone] = useState<boolean>(false);

    // update min and max funding amounts when user is ready
    useEffect(() => {
        if (!user) return;

        setCurrency(user.currency ?? "USD");
        setMinFundingAmount(user.minFundingAmount ?? 2);
        setMaxFundingAmount(user.maxFundingAmount ?? 999999);
    }, [user]);

    // handle fund amount changes
    const setFundAmount = useCallback(
        (val: React.SetStateAction<string>) => {
            const value = typeof val === "string" ? val : val(fundAmount);
            setFundAmount_(value);

            // Validate the amount
            if (Number(value) < minFundingAmount) {
                setFundAmountError(
                    `Minimum funding amount for your location is ${formatCurrency(minFundingAmount, currency)}.`
                );
                return;
            }
            if (Number(value) > maxFundingAmount) {
                setFundAmountError(
                    `Maximum funding amount for your location is ${formatCurrency(maxFundingAmount, currency)}.`
                );
                return;
            }

            // Clear any errors and prepare for a new quote
            setFundQuote(null);
            setQuoteLoading(true);
            setFundError(null);
            setFundAmountError(null);
        },
        [fundAmount, minFundingAmount, maxFundingAmount, currency]
    );

    const generateQuote = useMemo(
        () =>
            debounce(1500, async (address: string, amount_usd: string) => {
                try {
                    setQuoteLoading(true);
                    const res = await createQuote(
                        address,
                        amount_usd,
                        currency,
                        user!.country,
                        user?.subdivision,
                        true
                    );
                    if (!res.ok) throw new Error(res?.error || "Could not fetch the quote");

                    setFundError(null);
                    setFundQuote(res.quote);
                } catch (e: any) {
                    // Ignore if the error is AbortError
                    if (e?.name === "AbortError") return;
                    setFundError(e?.message as string);
                }

                setQuoteLoading(false);
            }),
        [currency, user, createQuote]
    );

    const updateQuote = useCallback(
        async (id: string, amount_usd: string) => {
            try {
                setQuoteLoading(true);
                const res = await refreshQuote(id, amount_usd);
                if (!res.ok) throw new Error(res?.error || "Could not update the quote");

                setFundQuote(res.quote);
            } catch (e: any) {
                setFundError(e?.message);
            }

            setQuoteLoading(false);
        },
        [refreshQuote]
    );

    // automatically update quote if set, else generate a new one if possible and necessary
    useEffect(() => {
        if (!user) return;
        if (!currency) return;
        if (!fundAmount) return;
        if (fundInProgress) return;
        if (fundDone) return;
        if (fundAmountError) return;

        if (fundQuote) {
            const interval = setInterval(
                () => updateQuote(fundQuote.id, `${fundAmount}`),
                fundQuote.refresh_in_seconds * 1000
            );
            return () => clearInterval(interval);
        } else {
            // Use the debounced version of generateQuote
            generateQuote(user!.evmWallet, `${fundAmount}`);
        }
    }, [currency, fundAmount, fundAmountError, fundDone, fundInProgress, fundQuote, generateQuote, user, updateQuote]);

    const doFunding = async (onSuccess: () => void, onError: (error: string) => void) => {
        if (!user) return onError("User not authenticated");

        try {
            if (!fundQuote) return onError("Cannot create payment link for invalid quote");

            // open a new empty tab (Safari does not support opening a new tab with a popup)
            const popUpWindow = openPopup({ url: "", height: ONRAMP_POPUP_HEIGHT, width: ONRAMP_POPUP_WIDTH });

            if (!popUpWindow) return onError("Cannot open popup");

            const res = await getPaymentLink(fundQuote);
            if (!res.ok) return onError(res?.error || "Cannot create payment link");

            // redirect to the payment link
            popUpWindow.location.href = res.url;
            setFundInProgress(true);
        } catch (e: any) {
            return onError(e?.message || "Error initiating funding");
        }

        return onSuccess();
    };

    const fetchFundStatus = useCallback(
        async (onError: (error: string) => void) => {
            setFundStatusFetchCount((c) => c + 1);
            try {
                if (!fundQuote) throw new Error("Cannot fetch funding status for invalid quote");

                const res = await getQuoteStatus(fundQuote);
                if (!res.ok) return onError("Error fetching funding status");

                setFundStatus(res.status!);

                if (res.status === "SUCCESS" || res.status === "FAILED") {
                    if (res.status === "FAILED") setFundError(res.details);
                    else await refreshBalances(true);
                    setFundInProgress(false);
                    setFundDone(true);
                }
            } catch (e: any) {
                onError(e?.message || "Error fetching funding status");
                return;
            }
        },
        [fundQuote, getQuoteStatus, refreshBalances]
    );

    // automatically refresh funding status every `ONRAMP_FUNDING_STATUS_REFRESH_INTERNAL_MS` miliseconds when funding is in progress
    useEffect(() => {
        if (!fundInProgress) return;

        // fetch instantly the first time, then use the interval
        const interval = setInterval(
            () => fetchFundStatus(setFundError),
            fundStatusFetchCount ? ONRAMP_FUNDING_STATUS_REFRESH_INTERNAL_MS : 0
        );
        return () => clearInterval(interval);
    }, [fundInProgress, fundStatusFetchCount, fetchFundStatus]);

    //
    const isOnrampDisabledByRegion = !(user?.isOnrampEnabled || false);
    const isOnrampDisabledByChain = chainId !== apeChain.id;
    const onramppDisabledError = isOnrampDisabledByRegion
        ? ONRAMP_UNSUPPORTED_REGION_MSG
        : isOnrampDisabledByChain
          ? ONRAMP_UNSUPPORTED_CHAIN_MSG
          : null;

    return {
        userCurrency: currency,
        fundMinAmount: minFundingAmount,
        fundMaxAmount: maxFundingAmount,
        fundIntermediaryToken: user?.cb_token,
        fundIntermediaryChain: user?.cb_chain,
        fundAmount,
        fundAmountError,
        fundDone,
        fundError,
        fundInProgress,
        fundQuote,
        fundStatus,
        isOnrampEnabled: !(isOnrampDisabledByRegion || isOnrampDisabledByChain),
        onramppDisabledError,
        quoteLoading,
        doFunding,
        setFundAmount
    };
}
