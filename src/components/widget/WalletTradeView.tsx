import { ArrowUpDown } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { debounce } from "throttle-debounce";
import { formatUnits, zeroAddress } from "viem";
import { useChainId } from "wagmi";
import { GlyphSwapContextData, useGlyphSwap } from "../../context/GlyphSwapContext";
import { useGlyph } from "../../hooks/useGlyph";
import { buildErrorPayloadWithCode, PRECHECK_FAILURE_CODE, useRelayExecute } from "../../hooks/useRelayExecute";
import { useRelayIntentStatus } from "../../hooks/useRelayIntentStatus";
import { checkIfGasIsEnough, useRelayQuote } from "../../hooks/useRelayQuote";
import { useTokenBalance } from "../../hooks/useTokenBalance";
import { INTERNAL_GRADIENT_TYPE, MAX_DECIMALS_FOR_CRYPTO, RELAY_APP_FEE_BPS, SwapView } from "../../lib/constants";
import { formatCurrency } from "../../lib/intl";
import { formatInputNumber } from "../../lib/numericInputs";
import { cn, displayNumberPrecision, getRPCErrorString } from "../../lib/utils";
import WalletViewHeader from "../shared/WalletViewHeader";
import { WalletViewTemplate } from "../shared/WalletViewTemplate";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import SwapChainAndTokenSelector from "./internal/SwapChainAndTokenSelector";
import { WalletSwapTopUpGas } from "./internal/WalletSwapTopUpGas";
import WalletTradeFailedView from "./internal/WalletTradeFailedView";
import WalletTradePendingView from "./internal/WalletTradePendingView";
import WalletTradeSuccessView from "./internal/WalletTradeSuccessView";

export type WalletTradeProps = {
    onBack: () => void;
    onEnd: () => void;
    onShowActivity: () => void;
    setGradientType: React.Dispatch<React.SetStateAction<INTERNAL_GRADIENT_TYPE | undefined>>;
};

export function WalletTradeView({ onBack, onEnd, onShowActivity, setGradientType }: WalletTradeProps) {
    const { fetchForAllNetworks } = useGlyph();
    const chainId = useChainId();

    const [view, setView] = useState<SwapView>(SwapView.START);
    const [txStatus, setTxStatus] = useState<"SUCCESS" | "FAILED" | "PENDING">("PENDING");
    const [intentRequestId, setIntentRequestId] = useState<string | null>(null);
    const [swapTxnId, setSwapTxnId] = useState<string | null>(null);

    // Swap hooks
    const { update, reportSwapFailed, fromCurrency, toCurrency, tradeType, amount, topupGas } = useGlyphSwap();
    const { mutateAsync: executeSwap, isPending: executePending } = useRelayExecute();
    const {
        data: quote,
        isLoading: quoteLoading,
        error: quoteError,
        isEnabled: quoteEnabled,
        appFeesWaived,
        operation
    } = useRelayQuote(view === SwapView.START);
    const onError = useCallback(async () => {
        if (swapTxnId) await reportSwapFailed(swapTxnId);
        setSwapTxnId(null);
    }, [swapTxnId, setSwapTxnId, reportSwapFailed]);
    const { txDetails, error: swapError } = useRelayIntentStatus({
        intentRequestId,
        setTxStatus,
        setView,
        onError
    });

    const switchTokensHandler = () => {
        const prevFromCurrency = fromCurrency;
        const prevFromAmount = amount;
        const prevToCurrency = toCurrency;
        const prevToAmount = amount;
        update({
            fromCurrency: prevToCurrency,
            toCurrency: prevFromCurrency,
            tradeType: tradeType === "EXACT_INPUT" ? "EXACT_OUTPUT" : "EXACT_INPUT"
        });

        if (tradeType === "EXACT_INPUT") {
            setBuyAmount(prevFromAmount);
        } else {
            setSellAmount(prevToAmount);
        }
    };

    // Update the amount and trade type with some debounce - such that quote is not fetched for every user interaction
    const debouncedAmountFunc = useMemo(
        () =>
            debounce(500, (value: string, newTradeType: GlyphSwapContextData["tradeType"]) => {
                setExecuteError("");
                update({
                    amount: value,
                    tradeType: newTradeType
                });
            }),
        [update] // safe to keep as a dep
    );

    const [executeError, setExecuteError] = useState<string>("");

    const [swapFromAndToTokensAnimation, setSwapFromAndToTokensAnimation] = useState<boolean>(false);

    useEffect(() => {
        // Reset amount so that quote is not refilled on remount
        return () => {
            update({
                amount: "",
                topupGas: false,
                fromCurrency: undefined,
                toCurrency: undefined
            });
        };
    }, []);

    // Set the gradient type to primary when the success/failed view is opened
    useEffect(() => {
        if (view === SwapView.END && txStatus === "SUCCESS") {
            setGradientType(INTERNAL_GRADIENT_TYPE.SUCCESS);
        }
        if (view === SwapView.END && txStatus === "FAILED") setGradientType(INTERNAL_GRADIENT_TYPE.ERROR);
        // Reset the gradient type when the success/failed view is closed
        return () => {
            setGradientType(undefined);
        };
    }, [setGradientType, txStatus, view]);

    // Temporary variables
    const [sellAmount, setSellAmount] = useState<string>("");
    const [buyAmount, setBuyAmount] = useState<string>("");

    useEffect(() => {
        if (quote) {
            if (tradeType === "EXACT_INPUT" && quote.details?.currencyOut?.amountFormatted) {
                setBuyAmount(
                    formatInputNumber(
                        quote.details.currencyOut.amountFormatted,
                        Math.min(toCurrency?.decimals ?? MAX_DECIMALS_FOR_CRYPTO, MAX_DECIMALS_FOR_CRYPTO)
                    )
                );
            } else if (tradeType === "EXACT_OUTPUT" && quote.details?.currencyIn?.amountFormatted) {
                setSellAmount(
                    formatInputNumber(
                        quote.details.currencyIn.amountFormatted,
                        Math.min(fromCurrency?.decimals ?? MAX_DECIMALS_FOR_CRYPTO, MAX_DECIMALS_FOR_CRYPTO)
                    )
                );
            }
        }
    }, [quote]);

    const {
        balance: sellTokenBalance,
        isLoading: sellTokenBalanceLoading,
        error: sellTokenBalanceError
    } = useTokenBalance(fromCurrency?.address, fromCurrency?.chainId);

    const {
        balance: buyTokenBalance,
        isLoading: buyTokenBalanceLoading,
        error: buyTokenBalanceError
    } = useTokenBalance(toCurrency?.address, toCurrency?.chainId);

    const quoteGas = quote?.fees?.gas;

    // Source chain gas balance to determine if transaction can be executed
    const gasCurrencyAddress = quoteGas?.currency?.address || zeroAddress;
    const {
        balance: sourceGasBalance,
        isLoading: sourceGasBalanceLoading,
        error: sourceGasBalanceError
    } = useTokenBalance(gasCurrencyAddress, fromCurrency?.chainId);

    const insufficientBalanceError =
        fromCurrency?.decimals && sellAmount && sellTokenBalance !== undefined
            ? Number(formatUnits(BigInt(sellTokenBalance), fromCurrency?.decimals)) < Number(sellAmount)
                ? "Insufficient balance"
                : null
            : null;

    const hasSourceGas = checkIfGasIsEnough(
        gasCurrencyAddress,
        fromCurrency,
        quoteGas?.amount || "0",
        sourceGasBalance,
        amount || "0"
    );

    const gasUnavailableError =
        quote && fromCurrency?.chainId && !sourceGasBalanceLoading && !hasSourceGas
            ? "Insufficient gas to execute transaction."
            : null;

    const blockingError =
        swapError || // Error from swap intent status
        executeError || // Error during execution
        (view === SwapView.START
            ? quoteError?.message ||
              sellTokenBalanceError ||
              buyTokenBalanceError ||
              sourceGasBalanceError ||
              insufficientBalanceError ||
              gasUnavailableError
            : undefined); // These errors are only relevant when on start screen

    const appFees = Number(quote?.fees?.app?.amountUsd || "0"); // It's absolute value

    const totalImpact = Math.abs(Number(quote?.details?.totalImpact?.usd || "0")); // It's negative already
    const networkFees = Math.abs(totalImpact - appFees);

    const currencyInUsd = quote?.details?.currencyIn?.amountUsd
        ? Number(quote?.details?.currencyIn?.amountUsd)
        : undefined;
    const currencyOutUsd = quote?.details?.currencyOut?.amountUsd
        ? Number(quote?.details?.currencyOut?.amountUsd)
        : undefined;

    return (
        <>
            {view === SwapView.START && (
                <WalletViewTemplate
                    headerClassName="!gw-py-2"
                    footerClassName="!gw-py-3 !gw-px-3"
                    header={
                        <WalletViewHeader
                            fullScreenHeader={{
                                title: "Swap",
                                onBackClick: onBack
                            }}
                        />
                    }
                    content={
                        <div className="gw-px-4 gw-h-full gw-flex gw-flex-col gw-justify-start">
                            {/* From Token */}
                            <div
                                className="gw-flex gw-flex-col gw-cursor-text gw-border-b gw-border-muted gw-pb-4 gw-relative"
                                onClick={(e) => {
                                    const input = e.currentTarget.querySelector("input");
                                    if (input) {
                                        input.focus();
                                    }
                                }}
                            >
                                <div className="gw-typography-caption gw-text-brand-gray-500">Sell</div>

                                {/* Sell Input */}
                                <div className="gw-flex gw-justify-between gw-items-center gw-mt-1 gw-mb-1.5">
                                    <div
                                        className={`gw-w-full gw-text-center gw-flex gw-justify-between gw-items-center gw-typography-h3-nr gw-gap-1`}
                                    >
                                        <div className="gw-flex-1 gw-overflow-hidden">
                                            <input
                                                type="text"
                                                onKeyDown={(e) => {
                                                    // allow backspace, left arrow, right arrow
                                                    if (
                                                        e.key === "Backspace" ||
                                                        e.key === "ArrowLeft" ||
                                                        e.key === "ArrowRight"
                                                    )
                                                        return;

                                                    // only allow digits and at most one decimal point
                                                    if (!/[0-9.]$/.test(e.key)) e.preventDefault();
                                                    if (sellAmount?.includes(".") && e.key.includes("."))
                                                        e.preventDefault();
                                                }}
                                                onWheelCapture={(e) => {
                                                    e.currentTarget.blur();
                                                }}
                                                value={sellAmount}
                                                onChange={(e) => {
                                                    setSellAmount(() => {
                                                        const value = formatInputNumber(
                                                            e.target.value,
                                                            Math.min(
                                                                fromCurrency?.decimals || MAX_DECIMALS_FOR_CRYPTO,
                                                                MAX_DECIMALS_FOR_CRYPTO
                                                            )
                                                        );

                                                        // If value is reset, reset the other value as well
                                                        if (e.target.value === "") {
                                                            setBuyAmount("");
                                                        }

                                                        // If sell amount is manually changed - that means user want swap of type "EXACT_INPUT"
                                                        debouncedAmountFunc(value, "EXACT_INPUT");

                                                        return value;
                                                    });
                                                }}
                                                placeholder="0"
                                                className="gw-text-foreground gw-bg-transparent focus:gw-outline-none placeholder:gw-text-foreground gw-w-full disabled:gw-cursor-not-allowed"
                                            />
                                        </div>

                                        {/* From Token selector */}
                                        {chainId && (
                                            <SwapChainAndTokenSelector
                                                selectedToken={fromCurrency}
                                                onTokenSelect={(t) => {
                                                    update({
                                                        fromCurrency: t
                                                    });
                                                    // Sell token and buy token cannot be same - unset buy token if it is same
                                                    if (
                                                        toCurrency &&
                                                        toCurrency.address === t.address &&
                                                        toCurrency.chainId === t.chainId
                                                    ) {
                                                        setBuyAmount("");
                                                        update({
                                                            amount: "",
                                                            toCurrency: undefined
                                                        });
                                                    }
                                                }}
                                                defaultChainId={fetchForAllNetworks ? undefined : chainId}
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* Value in USD and tokens available */}
                                <div className="gw-flex gw-justify-between gw-items-center gw-w-full gw-text-brand-gray-500">
                                    {currencyInUsd === undefined ? (
                                        <div className="gw-h-4 gw-w-1" />
                                    ) : (
                                        <div className="gw-typography-caption">
                                            {currencyInUsd < 0.01
                                                ? "<$0.01"
                                                : `${formatCurrency(currencyInUsd || "0", "USD")}`}
                                        </div>
                                    )}
                                    <>
                                        {sellTokenBalanceLoading ? (
                                            <div className="gw-typography-caption gw-flex gw-items-center gw-mr-4">
                                                <Skeleton className="gw-h-4 gw-w-10 gw-inline-block gw-ml-0.5" />
                                            </div>
                                        ) : sellTokenBalance !== undefined && fromCurrency?.decimals ? (
                                            <div className="gw-typography-caption gw-flex gw-items-center gw-mr-4">
                                                {displayNumberPrecision(
                                                    parseFloat(
                                                        formatUnits(BigInt(sellTokenBalance), fromCurrency?.decimals)
                                                    ),
                                                    Math.min(
                                                        fromCurrency?.decimals || MAX_DECIMALS_FOR_CRYPTO,
                                                        MAX_DECIMALS_FOR_CRYPTO
                                                    )
                                                )}{" "}
                                                {fromCurrency?.symbol}
                                            </div>
                                        ) : (
                                            <div className="gw-h-4 gw-w-1" />
                                        )}
                                    </>
                                </div>

                                {/* Swap to and from tokens */}
                                <Button
                                    className={cn(
                                        "gw-absolute gw-z-10 gw-bottom-0 gw-shadow-buttonMd gw-translate-y-1/2 gw-left-1/2 -gw-translate-x-1/2 gw-h-10 gw-transition-transform gw-duration-300 gw-ease-in-out",
                                        swapFromAndToTokensAnimation && "gw-rotate-180"
                                    )}
                                    variant={"outline"}
                                    size={"icon"}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSwapFromAndToTokensAnimation((v) => !v);
                                        // TODO: Logic to swap to and from tokens
                                        switchTokensHandler();
                                    }}
                                >
                                    <ArrowUpDown className="!gw-size-6 !gw-text-brand-gray-500" />
                                </Button>
                            </div>

                            {/* To Token */}
                            <div
                                className="gw-flex gw-flex-col gw-cursor-text gw-pt-4 gw-pb-2 gw-relative"
                                onClick={(e) => {
                                    const input = e.currentTarget.querySelector("input");
                                    if (input) {
                                        input.focus();
                                    }
                                }}
                            >
                                <div className="gw-typography-caption gw-text-brand-gray-500">Buy</div>

                                {/*Buy Input */}
                                <div className="gw-flex gw-justify-between gw-items-center gw-mt-1 gw-mb-1.5">
                                    <div
                                        className={`gw-w-full gw-text-center gw-flex gw-justify-between gw-items-center gw-typography-h3-nr gw-gap-1`}
                                    >
                                        <div className="gw-flex-1 gw-overflow-hidden">
                                            <input
                                                type="text"
                                                onKeyDown={(e) => {
                                                    // allow backspace, left arrow, right arrow
                                                    if (
                                                        e.key === "Backspace" ||
                                                        e.key === "ArrowLeft" ||
                                                        e.key === "ArrowRight"
                                                    )
                                                        return;

                                                    // only allow digits and at most one decimal point
                                                    if (!/[0-9.]$/.test(e.key)) e.preventDefault();
                                                    if (buyAmount?.includes(".") && e.key.includes("."))
                                                        e.preventDefault();
                                                }}
                                                onWheelCapture={(e) => {
                                                    e.currentTarget.blur();
                                                }}
                                                value={buyAmount}
                                                onChange={(e) =>
                                                    setBuyAmount(() => {
                                                        const value = formatInputNumber(
                                                            e.target.value,
                                                            Math.min(
                                                                toCurrency?.decimals || MAX_DECIMALS_FOR_CRYPTO,
                                                                MAX_DECIMALS_FOR_CRYPTO
                                                            )
                                                        );

                                                        // If value is reset, reset the other value as well
                                                        if (e.target.value === "") {
                                                            setSellAmount("");
                                                        }

                                                        // If buy amount is manually changed - that means user want swap of type "EXACT_OUTPUT"
                                                        debouncedAmountFunc(value, "EXACT_OUTPUT");

                                                        return value;
                                                    })
                                                }
                                                placeholder="0"
                                                className="gw-text-foreground gw-bg-transparent focus:gw-outline-none placeholder:gw-text-foreground gw-w-full disabled:gw-cursor-not-allowed"
                                            />
                                        </div>

                                        {/* To Token selector */}
                                        {chainId && (
                                            <SwapChainAndTokenSelector
                                                selectedToken={toCurrency}
                                                onTokenSelect={(t) => {
                                                    update({
                                                        toCurrency: t
                                                    });
                                                    // Buy token and sell token cannot be same - unset sell token if it is same
                                                    if (
                                                        fromCurrency &&
                                                        fromCurrency.address === t.address &&
                                                        fromCurrency.chainId === t.chainId
                                                    ) {
                                                        setSellAmount("");
                                                        update({
                                                            amount: "",
                                                            fromCurrency: undefined
                                                        });
                                                    }
                                                }}
                                                defaultChainId={fetchForAllNetworks ? undefined : chainId}
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* Value in USD and tokens available */}
                                <div className="gw-flex gw-justify-between gw-items-center gw-w-full gw-text-brand-gray-500">
                                    {currencyOutUsd === undefined ? (
                                        <div className="gw-h-4 gw-w-1" />
                                    ) : (
                                        <div className="gw-typography-caption">
                                            {currencyOutUsd < 0.01
                                                ? "<$0.01"
                                                : `${formatCurrency(currencyOutUsd || "0", "USD")}`}
                                        </div>
                                    )}
                                    {
                                        <>
                                            {buyTokenBalanceLoading ? (
                                                <div className="gw-typography-caption gw-flex gw-items-center gw-mr-4">
                                                    <Skeleton className="gw-h-4 gw-w-10 gw-inline-block gw-ml-0.5" />
                                                </div>
                                            ) : buyTokenBalance !== undefined && toCurrency?.decimals ? (
                                                <div className="gw-typography-caption gw-flex gw-items-center gw-mr-4">
                                                    {displayNumberPrecision(
                                                        parseFloat(
                                                            formatUnits(BigInt(buyTokenBalance), toCurrency?.decimals)
                                                        ),
                                                        Math.min(
                                                            toCurrency?.decimals || MAX_DECIMALS_FOR_CRYPTO,
                                                            MAX_DECIMALS_FOR_CRYPTO
                                                        )
                                                    )}{" "}
                                                    {toCurrency?.symbol}
                                                </div>
                                            ) : (
                                                <div className="gw-h-4 gw-w-1" />
                                            )}
                                        </>
                                    }
                                </div>

                                {/* Reserve height for the gas top up button */}
                                <div className="gw-h-5 gw-mt-1 gw-flex gw-items-center">
                                    {/* Only show if the current buy token is not the native token */}
                                    {toCurrency?.address !== zeroAddress ? (
                                        <WalletSwapTopUpGas
                                            destinationChainId={toCurrency?.chainId}
                                            topUpGas={topupGas}
                                            setTopUpGas={(v) => {
                                                update({
                                                    topupGas: v
                                                });
                                            }}
                                            topUpDetails={quote?.details?.currencyGasTopup}
                                            quoteReady={!!quote}
                                        />
                                    ) : null}
                                </div>
                            </div>

                            {/* Tx data */}
                            {quoteEnabled && (
                                <div className="gw-typography-body2 gw-pt-4 gw-border-t gw-border-muted">
                                    <div className="gw-flex gw-justify-between gw-items-center">
                                        <span>Max Slippage</span>
                                        <span className="gw-text-brand-gray-500 gw-flex gw-items-center gw-gap-2">
                                            <span className="gw-text-foreground gw-bg-muted gw-rounded-full gw-px-2 gw-py-0.5 gw-typography-caption">
                                                Auto
                                            </span>
                                            <span>
                                                {/* If same chain, show origin slippage, else destination slippage */}
                                                {quote
                                                    ? (fromCurrency?.chainId === toCurrency?.chainId
                                                          ? quote?.details?.slippageTolerance?.origin?.percent
                                                          : quote?.details?.slippageTolerance?.destination?.percent ||
                                                            "0") + "%"
                                                    : "-"}
                                            </span>
                                        </span>
                                    </div>

                                    <div className="gw-flex gw-justify-between gw-items-center gw-mt-1">
                                        <span>Transaction Time</span>
                                        <span className="gw-text-brand-gray-500">
                                            {quote ? (quote?.details?.timeEstimate || "<15") + "s" : "-"}
                                        </span>
                                    </div>

                                    <div className="gw-flex gw-justify-between gw-items-center gw-mt-1">
                                        <span>Fees {appFeesWaived ? "" : `(${RELAY_APP_FEE_BPS / 100}%)`}</span>
                                        <div className="gw-text-brand-gray-500">
                                            {quote ? (
                                                appFeesWaived ? (
                                                    "0"
                                                ) : appFees < 0.01 ? (
                                                    "<$0.01"
                                                ) : (
                                                    `${formatCurrency(appFees || "0", "USD")}`
                                                )
                                            ) : quoteLoading ? (
                                                <Skeleton className="gw-w-6 gw-h-3.5" />
                                            ) : (
                                                "-"
                                            )}
                                        </div>
                                    </div>

                                    <div className="gw-flex gw-justify-between gw-items-center gw-mt-1">
                                        <span>Network Fees</span>
                                        <div className="gw-text-brand-gray-500">
                                            {quote ? (
                                                networkFees < 0.01 ? (
                                                    "<$0.01"
                                                ) : (
                                                    `${formatCurrency(networkFees || "0", "USD")}`
                                                )
                                            ) : quoteLoading ? (
                                                <Skeleton className="gw-w-6 gw-h-3.5" />
                                            ) : (
                                                "-"
                                            )}
                                        </div>
                                    </div>

                                    <div className="gw-flex gw-justify-between gw-items-center gw-mt-1">
                                        <span>Total</span>
                                        <div className="gw-text-foreground gw-font-medium">
                                            {quote && currencyInUsd ? (
                                                currencyInUsd < 0.01 ? (
                                                    "<$0.01"
                                                ) : (
                                                    `${formatCurrency(currencyInUsd || "0", "USD")}`
                                                )
                                            ) : quoteLoading ? (
                                                <Skeleton className="gw-w-6 gw-h-3.5" />
                                            ) : (
                                                "-"
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    }
                    footer={
                        <>
                            <span
                                className={`gw-inline-flex gw-items-center gw-capitalize gw-text-center gw-space-x-2 gw-mb-2 gw-typography-caption ${blockingError ? "gw-text-destructive" : "gw-text-brand-gray-500"}`}
                            >
                                {blockingError}
                            </span>
                            <Button
                                variant={"tertiary"}
                                className="gw-w-full"
                                disabled={!!blockingError || !quote || !currencyInUsd || executePending}
                                onClick={async () => {
                                    if (!quote || blockingError) return;

                                    try {
                                        const execResult = await executeSwap({
                                            qt: quote,
                                            onExecutionStart: (finalQuote) => {
                                                // Check if gas amoutn is enough according to the final quote generated by the backend
                                                const gasAmount = finalQuote?.fees?.gas?.amount;
                                                const hasEnoughGas = checkIfGasIsEnough(
                                                    gasCurrencyAddress,
                                                    fromCurrency,
                                                    gasAmount || "0",
                                                    sourceGasBalance,
                                                    amount || "0"
                                                );

                                                if (!sourceGasBalanceLoading && !hasEnoughGas) {
                                                    throw buildErrorPayloadWithCode(
                                                        PRECHECK_FAILURE_CODE,
                                                        "Insufficient gas to execute transaction"
                                                    );
                                                }

                                                // If everything goes well, set the transaction status to pending and show the wait view
                                                setTxStatus("PENDING");
                                                setView(SwapView.WAIT);
                                            }
                                        });
                                        const requestId = execResult?.requestId;
                                        const txnId = execResult?.txnId ?? null;

                                        if (requestId && txnId) {
                                            setIntentRequestId(requestId);
                                            setSwapTxnId(txnId);
                                        } else {
                                            toast.error(
                                                "Couldn't fetch swap status, check blockchain directly or contact support"
                                            );
                                        }
                                    } catch (error) {
                                        if (
                                            typeof error === "object" &&
                                            (error as any)?.code === PRECHECK_FAILURE_CODE
                                        ) {
                                            console.error("Error executing swap - precheck:", error);
                                            setExecuteError(
                                                (error as any)?.message ||
                                                    "Something went wrong during the swap precheck"
                                            );
                                            return;
                                        }
                                        console.error("Error executing swap:", error);
                                        setExecuteError(getRPCErrorString(error));
                                        setTxStatus("FAILED");
                                        setView(SwapView.END);
                                    }
                                }}
                            >
                                {executePending
                                    ? "Preparing transaction..."
                                    : operation === "wrap"
                                      ? "Wrap"
                                      : operation === "unwrap"
                                        ? "Unwrap"
                                        : "Swap"}
                            </Button>
                        </>
                    }
                    mainFooter={false}
                    footerCols={true}
                />
            )}

            {view === SwapView.WAIT && (
                <WalletTradePendingView
                    onBack={onBack}
                    txDetails={{ ...txDetails, estimatedTime: quote?.details?.timeEstimate }}
                    sellAmount={Number(sellAmount)}
                    buyAmount={Number(buyAmount)}
                />
            )}

            {view === SwapView.END &&
                (txStatus === "SUCCESS" ? (
                    <WalletTradeSuccessView
                        txDetails={txDetails}
                        onEnd={() => onEnd()}
                        onShowActivity={() => onShowActivity()}
                        sellAmount={Number(sellAmount)}
                        buyAmount={Number(buyAmount)}
                    />
                ) : (
                    <WalletTradeFailedView
                        txDetails={txDetails}
                        reason={blockingError}
                        onEnd={() => onEnd()}
                        onShowActivity={() => onShowActivity()}
                    />
                ))}
        </>
    );
}
