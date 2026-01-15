import { ArrowUpDown, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { debounce } from "throttle-debounce";
import { formatUnits, parseUnits, zeroAddress } from "viem";
import { useChainId } from "wagmi";
import { GlyphSwapContextData, RelayAPIToken, useGlyphSwap } from "../../context/GlyphSwapContext";
import { useGlyph } from "../../hooks/useGlyph";
import { buildErrorPayloadWithCode, PRECHECK_FAILURE_CODE, useRelayExecute } from "../../hooks/useRelayExecute";
import { useRelayIntentStatus } from "../../hooks/useRelayIntentStatus";
import { checkIfGasIsEnough, useRelayQuote } from "../../hooks/useRelayQuote";
import { useTokenBalance } from "../../hooks/useTokenBalance";
import { INTERNAL_GRADIENT_TYPE, MAX_DECIMALS_FOR_CRYPTO, RELAY_APP_FEE_BPS, SwapView } from "../../lib/constants";
import { reformatSwapError, SWAP_ERROR_MESSAGES } from "../../lib/customErrors";
import { formatCurrency } from "../../lib/intl";
import { formatInputNumber } from "../../lib/numericInputs";
import { getFeeBufferAmount } from "../../lib/relayNativeMaxAmount";
import { chainIdToRelayChain, cn, displayNumberPrecision, formatTokenCount, getRPCErrorString } from "../../lib/utils";
import WalletViewHeader from "../shared/WalletViewHeader";
import { WalletViewTemplate } from "../shared/WalletViewTemplate";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import TooltipElement from "../ui/tooltip-element";
import AddGasToSourceChainButton from "./internal/AddGasToSourceChainButton";
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

    const [isTxApproved, setIsTxApproved] = useState<boolean>(false);

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
        const prevFromAmount = formatUnits(BigInt(amount), fromCurrency?.decimals || 18);
        const prevToCurrency = toCurrency;
        const prevToAmount = formatUnits(BigInt(amount), toCurrency?.decimals || 18);
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
            debounce(500, (value: bigint, newTradeType: GlyphSwapContextData["tradeType"]) => {
                setExecuteError("");
                update({
                    amount: value.toString(),
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

    const [transferMaxLoading, setTransferMaxLoading] = useState<boolean>(false);
    const [lastFeeBuffer, setLastFeeBuffer] = useState<bigint>(0n);

    useEffect(() => {
        if (quote) {
            const quoteGasWithBuffer = (BigInt(quote?.fees?.gas?.amount || "0") * 120n) / 100n; // 5% more than the error check
            if (transferMaxLoading) {
                // If the last fee buffer is less than the quote gas, recalculate the fee buffer
                if (lastFeeBuffer < BigInt(quote?.fees?.gas?.amount || "0")) {
                    console.debug("Incorrect fee buffer, recalculating...");
                    const newFeeBuffer = quoteGasWithBuffer;
                    setLastFeeBuffer(newFeeBuffer);
                    const isNativeToken =
                        fromCurrency?.address ===
                        (chainIdToRelayChain(fromCurrency!.chainId!)!.currency?.address ?? zeroAddress);
                    const valueToSet = isNativeToken ? maxSellAmount(newFeeBuffer) : maxSellAmount(0n);
                    setSellAmount(valueToSet);
                    debouncedAmountFunc(
                        isNativeToken
                            ? BigInt(sellTokenBalance ?? "0") > newFeeBuffer
                                ? BigInt(sellTokenBalance ?? "0") - newFeeBuffer
                                : 0n
                            : BigInt(sellTokenBalance ?? "0"),
                        "EXACT_INPUT"
                    );
                    setTransferMaxLoading(false);
                    return;
                }
                // If the last fee buffer is greater than the quote gas, we are good to go and we can set the transfer max loading to false
                setTransferMaxLoading(false);
            }
            if (tradeType === "EXACT_INPUT" && quote.details?.currencyOut?.amount) {
                setBuyAmount(
                    formatTokenCount(
                        quote.details.currencyOut.amount,
                        toCurrency?.decimals || 18,
                        Math.min(toCurrency?.decimals ?? MAX_DECIMALS_FOR_CRYPTO, MAX_DECIMALS_FOR_CRYPTO)
                    ).toString()
                );
            } else if (tradeType === "EXACT_OUTPUT" && quote.details?.currencyIn?.amount) {
                setSellAmount(
                    formatTokenCount(
                        quote.details.currencyIn.amount,
                        fromCurrency?.decimals || 18,
                        Math.min(fromCurrency?.decimals ?? MAX_DECIMALS_FOR_CRYPTO, MAX_DECIMALS_FOR_CRYPTO)
                    ).toString()
                );
            }
        }
    }, [quote]);

    const {
        balance: sellTokenBalance,
        isLoading: sellTokenBalanceLoading,
        error: sellTokenBalanceError
    } = useTokenBalance(fromCurrency?.address, fromCurrency?.chainId);

    // Calculate max sell amount from balance
    const maxSellAmount = useCallback(
        (gasFee: bigint) => {
            if (sellTokenBalance !== undefined && fromCurrency?.decimals && BigInt(sellTokenBalance) > gasFee) {
                return displayNumberPrecision(
                    parseFloat(formatUnits(BigInt(sellTokenBalance) - gasFee, fromCurrency.decimals)),
                    Math.min(fromCurrency.decimals || MAX_DECIMALS_FOR_CRYPTO, MAX_DECIMALS_FOR_CRYPTO)
                ).toString();
            }
            return "0";
        },
        [sellTokenBalance, fromCurrency?.decimals]
    );

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

    const sellAmountInWeiToUse =
        tradeType === "EXACT_INPUT" ? amount : parseUnits(sellAmount, fromCurrency?.decimals || 18);
    const insufficientBalanceError =
        fromCurrency?.decimals && sellAmount && sellTokenBalance !== undefined
            ? BigInt(sellTokenBalance) < BigInt(sellAmountInWeiToUse)
                ? SWAP_ERROR_MESSAGES.INSUFFICIENT_BALANCE
                : null
            : null;

    const hasSourceGas = checkIfGasIsEnough(
        gasCurrencyAddress,
        fromCurrency,
        quoteGas?.amount || "0",
        sourceGasBalance,
        sellAmountInWeiToUse.toString()
    );

    const gasUnavailableError =
        quote &&
        fromCurrency?.chainId &&
        !sourceGasBalanceLoading &&
        !hasSourceGas &&
        !transferMaxLoading &&
        buyAmount !== ""
            ? SWAP_ERROR_MESSAGES.INSUFFICIENT_GAS
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

    const [isFromTokenNative, sourceChainNativeSymbol, sourceChainName] = useMemo(() => {
        if (!fromCurrency?.address || !fromCurrency?.chainId) return [false, undefined, undefined];
        const sourceChain = chainIdToRelayChain(fromCurrency.chainId!);
        const nativeAddress = sourceChain?.currency?.address ?? zeroAddress;
        return [
            fromCurrency.address.toLowerCase() === nativeAddress.toLowerCase(),
            // nativeAddress,
            sourceChain?.currency?.symbol ?? undefined,
            sourceChain?.displayName ?? undefined
        ];
    }, [fromCurrency?.address, fromCurrency?.chainId]); // if from token is native token, source chain native symbol and source chain name

    const [isToTokenNative, destinationChainNativeAddress] = useMemo(() => {
        if (!toCurrency?.address || !toCurrency?.chainId) return [false, undefined];
        const nativeAddress = chainIdToRelayChain(toCurrency.chainId!)!.currency?.address ?? zeroAddress;
        return [toCurrency.address.toLowerCase() === nativeAddress.toLowerCase(), nativeAddress];
    }, [toCurrency?.address, toCurrency?.chainId]); // if to token is native token and destination chain native address

    const addGasToSourceChain = useCallback(
        (fromCurrency: RelayAPIToken | undefined) => {
            if (!quoteGas) return;

            // Set the output currency to the gas currency needed and amount to 2x the gas amount needed
            const gasFromLastQuote = BigInt(quoteGas?.amount || "0");
            const gasToAdd = gasFromLastQuote * 2n;
            setSellAmount(""); // Reset sell amount to 0
            setBuyAmount(formatUnits(gasToAdd, quoteGas?.currency?.decimals || 18));
            if (!fromCurrency) {
                toast.info("Please select the source token to proceed!");
            }
            update({
                fromCurrency: fromCurrency,
                toCurrency: quoteGas?.currency,
                amount: gasToAdd.toString(),
                tradeType: "EXACT_OUTPUT"
            });
        },
        [quoteGas]
    );

    return (
        <>
            {view === SwapView.START && (
                <WalletViewTemplate
                    headerClassName="!gw-py-2"
                    footerClassName="!gw-pb-3 !gw-pt-2 !gw-px-3"
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
                                className="gw-flex gw-flex-col gw-cursor-text gw-border-b gw-border-muted gw-pb-6 gw-relative"
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
                                                        debouncedAmountFunc(
                                                            parseUnits(value, fromCurrency?.decimals || 18),
                                                            "EXACT_INPUT"
                                                        );

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

                                                    // If source token is changed and user entered the source amount manually, reset the sell amount and buy amount and amount.
                                                    if (tradeType === "EXACT_INPUT") {
                                                        setSellAmount("");
                                                        setBuyAmount("");
                                                        update({
                                                            amount: ""
                                                        });
                                                    }

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
                                <div className="gw-flex gw-justify-between gw-items-center gw-w-full gw-text-brand-gray-500 gw-min-h-5">
                                    {currencyInUsd === undefined ? (
                                        <div className="gw-h-5 gw-w-1" />
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
                                                <Skeleton className="gw-h-5 gw-w-10 gw-inline-block gw-ml-0.5" />
                                            </div>
                                        ) : !!sellTokenBalance && fromCurrency?.decimals ? (
                                            <div className="gw-typography-caption gw-flex gw-items-center gw-mr-4 gw-gap-1">
                                                {/* Max button - only show if the sell token balance is greater than 0 */}
                                                {BigInt(sellTokenBalance) > 0n && (
                                                    <>
                                                        <Button
                                                            disabled={transferMaxLoading || !toCurrency}
                                                            className="gw-w-fit !gw-gap-1 !gw-px-2 !gw-py-0.5 !gw-bg-brand-success !gw-text-foreground !gw-h-5"
                                                            onClick={async () => {
                                                                setTransferMaxLoading(true);
                                                                try {
                                                                    if (!fromCurrency) {
                                                                        console.debug(
                                                                            "No fromCurrency to set max sell amount"
                                                                        );
                                                                        return;
                                                                    }
                                                                    const feeGasBuffer = await getFeeBufferAmount(
                                                                        fromCurrency?.chainId as number,
                                                                        BigInt(sellTokenBalance)
                                                                    );
                                                                    const valueToSet = isFromTokenNative
                                                                        ? maxSellAmount(feeGasBuffer)
                                                                        : maxSellAmount(0n);
                                                                    // If the max sell amount is 0, throw an error as we don't have enough balance to cover the gas fee
                                                                    if (valueToSet === "0") {
                                                                        throw new Error(
                                                                            SWAP_ERROR_MESSAGES.FAILED_TO_MAX_LOW_GAS
                                                                        );
                                                                    }

                                                                    const newWeiValueForQuote = isFromTokenNative
                                                                        ? BigInt(sellTokenBalance) - feeGasBuffer
                                                                        : BigInt(sellTokenBalance);

                                                                    if (newWeiValueForQuote.toString() !== amount) {
                                                                        setLastFeeBuffer(feeGasBuffer);
                                                                        setSellAmount(valueToSet);
                                                                        setBuyAmount("");
                                                                        debouncedAmountFunc(
                                                                            newWeiValueForQuote,
                                                                            "EXACT_INPUT"
                                                                        );
                                                                    } else {
                                                                        setTransferMaxLoading(false);
                                                                    }
                                                                } catch (_e: any) {
                                                                    setExecuteError(_e?.message);
                                                                    setTransferMaxLoading(false);
                                                                }
                                                            }}
                                                        >
                                                            {transferMaxLoading && (
                                                                <Loader2 className="!gw-size-3 gw-animate-spin" />
                                                            )}
                                                            <span className="gw-typography-caption">Max</span>
                                                        </Button>
                                                        {(!toCurrency || isFromTokenNative) && (
                                                            <TooltipElement
                                                                description={
                                                                    !toCurrency
                                                                        ? "Select destination token to continue"
                                                                        : "This swap uses a native token, a small amount will be reserved to cover gas fees."
                                                                }
                                                                stopPropagation
                                                                side="bottom"
                                                                align="center"
                                                            />
                                                        )}
                                                    </>
                                                )}
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
                                        "gw-absolute gw-z-10 gw-bottom-0 gw-shadow-buttonMd gw-translate-y-1/2 gw-left-1/2 -gw-translate-x-1/2 gw-h-8 gw-w-8 gw-transition-transform gw-duration-300 gw-ease-in-out",
                                        swapFromAndToTokensAnimation && "gw-rotate-180"
                                    )}
                                    variant={"outline"}
                                    size={"icon"}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSwapFromAndToTokensAnimation((v) => !v);
                                        switchTokensHandler();
                                    }}
                                >
                                    <ArrowUpDown className="!gw-size-5 !gw-text-brand-gray-500" />
                                </Button>
                            </div>

                            {/* To Token */}
                            <div
                                className="gw-flex gw-flex-col gw-cursor-text gw-pt-4 gw-pb-4 gw-relative"
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
                                                        debouncedAmountFunc(
                                                            parseUnits(value, toCurrency?.decimals || 18),
                                                            "EXACT_OUTPUT"
                                                        );

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

                                                    // If destination token is changed and user entered the destination amount manually, reset the sell amount and buy amount and amount.
                                                    if (tradeType === "EXACT_OUTPUT") {
                                                        setBuyAmount("");

                                                        // If the buy amount is not empty and the from currency is not undefined, set the amount to the sell amount and trade type to exact input for better user experience
                                                        if (buyAmount && fromCurrency) {
                                                            update({
                                                                amount: parseUnits(
                                                                    sellAmount,
                                                                    fromCurrency?.decimals || 18
                                                                ).toString(),
                                                                tradeType: "EXACT_INPUT"
                                                            });
                                                        } else {
                                                            update({
                                                                amount: ""
                                                            });
                                                        }
                                                    }

                                                    // Buy token and sell token cannot be same - unset sell token if it is same
                                                    if (
                                                        fromCurrency &&
                                                        fromCurrency.address === t.address &&
                                                        fromCurrency.chainId === t.chainId
                                                    ) {
                                                        setSellAmount("");
                                                        setBuyAmount("");
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
                                    {!isToTokenNative && destinationChainNativeAddress ? (
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
                                            tokenAddress={destinationChainNativeAddress}
                                        />
                                    ) : null}
                                </div>
                            </div>

                            {/* Tx data */}
                            {quoteEnabled && (
                                <div className="gw-typography-body2 gw-pt-3 gw-border-t gw-border-muted">
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

                                    <div className="gw-flex gw-justify-between gw-items-center gw-mt-0.5">
                                        <span>Transaction Time</span>
                                        <span className="gw-text-brand-gray-500">
                                            {quote ? (quote?.details?.timeEstimate || "<15") + "s" : "-"}
                                        </span>
                                    </div>

                                    <div className="gw-flex gw-justify-between gw-items-center gw-mt-0.5">
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

                                    <div className="gw-flex gw-justify-between gw-items-center gw-mt-0.5">
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

                                    <div className="gw-flex gw-justify-between gw-items-center gw-mt-0.5">
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
                                className={`gw-inline-flex gw-items-center gw-text-center gw-space-x-2 gw-mb-2 gw-typography-caption first-letter:gw-uppercase ${blockingError ? "gw-text-destructive" : "gw-text-brand-gray-500"}`}
                            >
                                {(() => {
                                    if (blockingError) {
                                        const error = reformatSwapError(blockingError);
                                        if (error === SWAP_ERROR_MESSAGES.INSUFFICIENT_GAS) {
                                            return (
                                                <div className="gw-flex gw-items-center gw-gap-1">
                                                    <span>{SWAP_ERROR_MESSAGES.INSUFFICIENT_GAS}</span>
                                                    <TooltipElement
                                                        description={`You need to add some ${sourceChainNativeSymbol ?? "gas"} on the ${sourceChainName ?? "source"} chain to proceed with this transaction.`}
                                                        stopPropagation
                                                        side="bottom"
                                                        align="center"
                                                        triggerClassName="gw-text-destructive gw-size-4"
                                                    />
                                                    {quoteGas ? (
                                                        <AddGasToSourceChainButton
                                                            sourceChainNativeSymbol={sourceChainNativeSymbol}
                                                            sourceChainName={sourceChainName}
                                                            addGasToSourceChain={addGasToSourceChain}
                                                        />
                                                    ) : null}
                                                </div>
                                            );
                                        }
                                        return error;
                                    }
                                    return null;
                                })()}
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
                                                // Check if gas amount is enough according to the final quote generated by the backend
                                                const gasAmount = finalQuote?.fees?.gas?.amount;
                                                const hasEnoughGas = checkIfGasIsEnough(
                                                    gasCurrencyAddress,
                                                    fromCurrency,
                                                    gasAmount || "0",
                                                    sourceGasBalance,
                                                    sellAmountInWeiToUse.toString()
                                                );

                                                if (!sourceGasBalanceLoading && !hasEnoughGas) {
                                                    throw buildErrorPayloadWithCode(
                                                        PRECHECK_FAILURE_CODE,
                                                        SWAP_ERROR_MESSAGES.INSUFFICIENT_GAS
                                                    );
                                                }

                                                // If everything goes well, set the transaction status to pending and show the wait view
                                                setTxStatus("PENDING");
                                                setView(SwapView.WAIT);
                                                setIsTxApproved(false);
                                            }
                                        });
                                        setIsTxApproved(true);
                                        const requestId = execResult?.requestId;
                                        const txnId = execResult?.txnId ?? null;

                                        if (requestId && txnId) {
                                            setIntentRequestId(requestId);
                                            setSwapTxnId(txnId);
                                        } else {
                                            toast.error(SWAP_ERROR_MESSAGES.STATUS_CHECK_FAILED);
                                        }
                                    } catch (error) {
                                        if (
                                            typeof error === "object" &&
                                            (error as any)?.code === PRECHECK_FAILURE_CODE
                                        ) {
                                            console.error("Error executing swap - precheck:", error);
                                            setExecuteError(
                                                (error as any)?.message || SWAP_ERROR_MESSAGES.PRECHECK_FAILURE
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
                    isTxApproved={isTxApproved}
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
                        reason={blockingError ? reformatSwapError(blockingError) : null}
                        onEnd={() => onEnd()}
                        onShowActivity={() => onShowActivity()}
                    />
                ))}
        </>
    );
}
