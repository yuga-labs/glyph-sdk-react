import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { debounce } from "throttle-debounce";
import truncateEthAddress from "truncate-eth-address";
import { erc20Abi, formatUnits, Hex, parseEther, zeroAddress } from "viem";
import { apeChain } from "viem/chains";
import { useWriteContract } from "wagmi";
import { CaretDownIcon } from "../../assets/svg/CaretDownIcon";
import NoTokenIcon from "../../assets/svg/NoTokenIcon";
import { useBalances } from "../../hooks/useBalances";
import { useGlyph } from "../../hooks/useGlyph";
import { useGlyphApi } from "../../hooks/useGlyphApi";
import { INTERNAL_GRADIENT_TYPE, SendView, TOKEN_LOGOS } from "../../lib/constants";
import { formatCurrency } from "../../lib/intl";
import { formatInputNumber } from "../../lib/numericInputs";
import { publicClient } from "../../lib/providers";
import { cn, createLogger, displayNumberPrecision, ethereumAvatar, tokenToBigIntWei } from "../../lib/utils";
import UserAvatar from "../shared/UserAvatar";
import WalletViewHeader from "../shared/WalletViewHeader";
import { WalletViewTemplate } from "../shared/WalletViewTemplate";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger } from "../ui/select";
import { Skeleton } from "../ui/skeleton";
import WalletSendFundEnterAddressView from "./WalletSendFundEnterAddressView";
import WalletSendFundFailedView from "./WalletSendFundFailedView";
import WalletSendFundPendingView from "./WalletSendFundPendingView";
import WalletSendFundSuccessView from "./WalletSendFundSuccessView";

export type WalletSendFundProps = {
    onBack: () => void;
    onEnd: () => void;
    onShowActivity: () => void;
    setGradientType: React.Dispatch<React.SetStateAction<INTERNAL_GRADIENT_TYPE | undefined>>;
};

export type SendFundQuote = {
    tokenAddress: Hex;
    receivable_amount: bigint;
    receivable_amount_in_token: number;
    receivable_amount_in_currency: number;
    estimated_fees_amount: string;
    estimated_fees_amount_in_currency: number | undefined;
    currency: string;
    in_amount: string;
    receiver_address: Hex;
    maxPriorityFeePerGas: bigint;
    maxFeePerGas: bigint;
    gasLimit: bigint;
};

const DEFAULT_TOKEN_MAX_DECIMALS = 6; // useful for ETH
const SEND_STATUS_REFRESH_INTERNAL_MS = 10 * 1000; // 10 seconds
const MAX_BALANCE_ERROR = "Not enough balance";

export function WalletSendFundView({ onBack, onEnd, onShowActivity, setGradientType }: WalletSendFundProps) {
    const { user, sendTransaction } = useGlyph();
    const { glyphApiFetch } = useGlyphApi();

    const [recipientAddress, setRecipientAddress] = useState<string>("");
    const [recipientAddressError, setRecipientAddressError] = useState<string | null>(null);

    const { refreshBalances, balances } = useBalances();

    const [view, setView] = useState<SendView>(SendView.ENTER_ADDRESS);

    const [tokenAddress, setTokenAddress] = useState<Hex>(zeroAddress);
    const nativeToken = useMemo(
        () => balances?.tokens?.find((token) => token.address === zeroAddress),
        [balances?.tokens]
    );
    const token = useMemo(
        () => balances?.tokens?.find((token) => token.address === tokenAddress),
        [tokenAddress, balances?.tokens]
    );

    const [sendAmount, setSendAmount] = useState<string>("");
    const [debouncedSendAmount, setDebouncedSendAmount] = useState<number>(Number(sendAmount));
    const [transferMax, setTransferMax] = useState<boolean>(false);

    const [quote, setQuote] = useState<SendFundQuote | null>(null);
    const [quoteLoading, setQuoteLoading] = useState<boolean>(false);
    const [isSignaturePending, setIsSignaturePending] = useState<boolean>(false);

    const [isPending, setIsPending] = useState<boolean>(false);
    const [statusFetchCount, setStatusFetchCount] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);
    const [maxValueError, setMaxValueError] = useState<boolean>(false);
    const [txHash, setTxHash] = useState<string>();
    const [txBlockExplorerUrl, setTxBlockExplorerUrl] = useState<string>();
    const [txBlockExplorerName, setTxBlockExplorerName] = useState<string>();
    const [txStatus, setTxStatus] = useState<"SUCCESS" | "FAILED" | "PENDING">("PENDING");

    const { writeContractAsync } = useWriteContract();

    const logger = createLogger("SendFundView");

    useEffect(() => {
        if (!Number(token?.value || "0")) {
            setQuoteLoading(false);
            return setError("No tokens to send");
        }
    }, [token, setError, setQuoteLoading]);

    useEffect(() => {
        const fetchQuote = async () => {
            // If on any other screen or signature is pending, don't fetch quote
            if (view !== SendView.ENTER_AMOUNT || isSignaturePending || maxValueError) return;

            if (
                debouncedSendAmount &&
                recipientAddress &&
                tokenAddress &&
                (transferMax || debouncedSendAmount <= Number(token?.value || 0))
            ) {
                setQuote(null);
                setQuoteLoading(true);
                setError(null);
                const { maxFeePerGas } = await publicClient.estimateFeesPerGas();

                let gasUnits;
                try {
                    const valueToSend =
                        (transferMax || debouncedSendAmount === Number(token?.value || 0)) && token?.valueInWei
                            ? BigInt(token?.valueInWei)
                            : parseEther(`${debouncedSendAmount}`);
                    if (tokenAddress === zeroAddress) {
                        gasUnits = await publicClient.estimateGas({
                            account: user?.evmWallet as Hex,
                            to: recipientAddress as Hex,
                            value: valueToSend
                        });
                    } else {
                        gasUnits = await publicClient.estimateContractGas({
                            abi: erc20Abi,
                            functionName: "transfer",
                            args: [recipientAddress as Hex, valueToSend],
                            account: user?.evmWallet as Hex,
                            address: tokenAddress as Hex,
                            maxFeePerGas,
                            maxPriorityFeePerGas: maxFeePerGas / 2n
                        });
                    }
                } catch (error: any) {
                    setError(error?.shortMessage || "Failed to estimate gas");
                    setQuoteLoading(false);
                    return;
                }

                const gasCost = maxFeePerGas * gasUnits;

                let valueToReturn: bigint;
                // If user is sending native token and has selected max amount, we need to subtract the gas cost from the total balance
                if (
                    tokenAddress === zeroAddress &&
                    (transferMax || debouncedSendAmount === Number(token?.value || 0))
                ) {
                    valueToReturn = BigInt(token?.valueInWei || 0) - gasCost;
                } else {
                    // If user is sending ERC20 token, we need to use the amount entered by the user (true for max amount as well)
                    if (gasCost > BigInt(nativeToken?.valueInWei || 0)) {
                        setError("Insufficient gas balance");
                        setQuoteLoading(false);
                        return;
                    }
                    valueToReturn = tokenToBigIntWei(debouncedSendAmount, token?.decimals || 18);
                }

                const maxPriorityFeePerGas = maxFeePerGas / 2n;

                const receivableAmountInToken = displayNumberPrecision(
                    +formatUnits(valueToReturn, token?.decimals || 18),
                    token?.displayDecimals
                );

                setQuote({
                    tokenAddress,
                    receiver_address: recipientAddress as Hex,
                    maxPriorityFeePerGas,
                    maxFeePerGas,
                    receivable_amount: valueToReturn,
                    receivable_amount_in_token: receivableAmountInToken,
                    receivable_amount_in_currency: displayNumberPrecision(
                        receivableAmountInToken * +(token?.rateInCurrency || 0)
                    ),
                    estimated_fees_amount: formatUnits(gasCost, nativeToken?.decimals || 18),
                    estimated_fees_amount_in_currency: displayNumberPrecision(
                        +formatUnits(gasCost, nativeToken?.decimals || 18) * +(nativeToken?.rateInCurrency || 0)
                    ),
                    currency: nativeToken?.currency || "",
                    in_amount: debouncedSendAmount.toString(),
                    gasLimit: gasUnits
                });

                setQuoteLoading(false);
            }
        };

        // Initial fetch
        fetchQuote();

        // Set up interval
        const interval = setInterval(fetchQuote, 5000);

        // Cleanup
        return () => clearInterval(interval);
    }, [
        debouncedSendAmount,
        isSignaturePending,
        maxValueError,
        nativeToken,
        recipientAddress,
        tokenAddress,
        token,
        transferMax,
        user,
        view
    ]);

    useEffect(() => {
        if (view === SendView.WAIT) setIsPending(true);
    }, [view]);

    useEffect(() => {
        if (!isPending) return setStatusFetchCount(0);
    }, [isPending]);

    const fetchSendStatus = useCallback(async () => {
        if (!glyphApiFetch) return toast.error("Glyph API not ready");

        setStatusFetchCount((c) => c + 1);
        try {
            if (!txHash) throw new Error("Cannot fetch tx status for ID"); // we know it's "hash" instead of "ID"

            const res = await glyphApiFetch(`/api/widget/transactions/${txHash}`);
            if (!res.ok) {
                throw new Error("Cannot fetch tx status");
            }
            const data = await res.json();
            setTxStatus(data.status!);
            setTxBlockExplorerUrl(data.blockExplorerUrl);
            setTxBlockExplorerName(data.blockExplorerName);

            if (data.status === "PENDING") return;

            await refreshBalances(true);
            setIsPending(false);
            setView(SendView.END);
        } catch (e: any) {
            toast.error(e?.message);
            return;
        }
    }, [txHash, glyphApiFetch, refreshBalances]);

    // check tx status every `SEND_STATUS_REFRESH_INTERNAL_MS` miliseconds when tx is in progress
    useEffect(() => {
        if (!isPending) return;

        // fetch instantly the first time, then use the interval
        const interval = setInterval(() => fetchSendStatus(), statusFetchCount ? SEND_STATUS_REFRESH_INTERNAL_MS : 0);
        return () => clearInterval(interval);
    }, [isPending, statusFetchCount, fetchSendStatus]);

    const debouncedFunc = useMemo(
        () =>
            debounce(500, (value: string) => {
                setQuote(null);
                setDebouncedSendAmount(Number(value));
            }),
        []
    );

    // Set the gradient type to primary when the success/failed view is opened
    useEffect(() => {
        if (view === SendView.END && txStatus === "SUCCESS") setGradientType(INTERNAL_GRADIENT_TYPE.SUCCESS);
        if (view === SendView.END && txStatus === "FAILED") setGradientType(INTERNAL_GRADIENT_TYPE.ERROR);
        // Reset the gradient type when the success/failed view is closed
        return () => {
            setGradientType(undefined);
        };
    }, [setGradientType, txStatus, view]);

    const validAmountEntered = debouncedSendAmount > 0 && debouncedSendAmount <= Number(token?.value || "0");

    const TokenIcon = token?.symbol ? TOKEN_LOGOS[token.symbol as keyof typeof TOKEN_LOGOS] : NoTokenIcon;

    return (
        <>
            {view === SendView.ENTER_ADDRESS && (
                <WalletSendFundEnterAddressView
                    onBack={onBack}
                    setView={setView}
                    setRecipientAddress={setRecipientAddress}
                    setRecipientAddressError={setRecipientAddressError}
                    recipientAddress={recipientAddress}
                    recipientAddressError={recipientAddressError}
                />
            )}

            {view === SendView.ENTER_AMOUNT && (
                <WalletViewTemplate
                    header={
                        <WalletViewHeader
                            fullScreenHeader={{
                                title: "Send Funds",
                                onBackClick: () => {
                                    setView(SendView.ENTER_ADDRESS);
                                }
                            }}
                        />
                    }
                    content={
                        <div
                            className={cn(
                                "gw-px-4 gw-pt-3 gw-h-full gw-flex gw-flex-col gw-justify-between gw-items-center gw-gap-3"
                            )}
                        >
                            <div className="gw-w-full">
                                <div className="gw-flex gw-justify-between gw-items-center gw-w-full">
                                    <h6>{!validAmountEntered ? "Enter Amount" : "Sending"}</h6>
                                    <div>
                                        <Select
                                            value={tokenAddress}
                                            onValueChange={(value) => {
                                                // Reset amounts if token changes
                                                setSendAmount("");
                                                setTransferMax(false);
                                                // Directly reset debounced amount to 0 (without delay)
                                                setDebouncedSendAmount(0);
                                                setError(null);
                                                setQuote(null);
                                                setTokenAddress(value as Hex);
                                            }}
                                        >
                                            <SelectTrigger className="gw-h-auto gw-p-1">
                                                <TokenIcon className="gw-w-6 gw-h-6 gw-mr-2" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {balances?.tokens?.map((t, index) => {
                                                    if (t?.hide) return null;
                                                    const TokenIcon = TOKEN_LOGOS[t.symbol] || NoTokenIcon;

                                                    return (
                                                        <div key={t.address}>
                                                            <SelectItem value={t.address} className="gw-w-full">
                                                                <div className="gw-flex gw-justify-between gw-items-center gw-w-full gw-p-1 gw-gap-4">
                                                                    <div className="gw-flex gw-items-center gw-space-x-3">
                                                                        <TokenIcon className="gw-w-8 gw-h-8" />
                                                                        <div className="gw-flex gw-flex-col gw-items-between gw-justify-end">
                                                                            <span className="gw-font-medium">
                                                                                {t.name}
                                                                            </span>
                                                                            {/* TODO: To be replaced with movement */}
                                                                            <span className="gw-text-brand-gray-500">
                                                                                {t.symbol}
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    <div className="gw-flex gw-flex-col gw-items-between gw-justify-end gw-text-end">
                                                                        <span className="gw-font-medium">
                                                                            {formatCurrency(t.amount, t.currency)}
                                                                        </span>
                                                                        <span className="gw-text-brand-gray-500">
                                                                            {t.value}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </SelectItem>
                                                            {index < (balances?.tokens?.length || 0) - 1 && (
                                                                <SelectSeparator />
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                {/* Balance */}
                                <div className="gw-flex gw-justify-between gw-items-center gw-w-full gw-typography-body2 gw-mt-2">
                                    <div>Balance</div>
                                    <div className="gw-text-brand-gray-600">
                                        {token?.value} ({formatCurrency(token?.amount || 0, token?.currency || "")})
                                    </div>
                                </div>
                            </div>

                            <div
                                className="gw-flex gw-flex-col gw-cursor-text gw-w-full"
                                onClick={(e) => {
                                    const input = e.currentTarget.querySelector("input");
                                    if (input) {
                                        input.focus();
                                    }
                                }}
                            >
                                <div className="gw-flex gw-justify-between gw-items-center gw-mt-1 gw-flex-col">
                                    <div className="gw-w-full gw-text-center gw-border-b-2 gw-border-border focus-within:gw-border-foreground gw-pb-1 gw-typography-h2-nr gw-flex gw-justify-between gw-items-center">
                                        <div className="gw-flex gw-items-baseline gw-gap-2 gw-justify-center gw-flex-1">
                                            <div className="gw-relative gw-inline-block gw-max-w-44">
                                                <div className="gw-flex-1 gw-overflow-hidden">
                                                    <span
                                                        aria-hidden
                                                        className="gw-invisible gw-whitespace-pre gw-select-none gw-max-w-60"
                                                    >
                                                        {sendAmount || "0"}
                                                    </span>
                                                    <input
                                                        type="text"
                                                        max={token?.value || "0"}
                                                        disabled={!Number(token?.value || "0")}
                                                        // Don't allow "e" in field type number
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
                                                            if (sendAmount?.includes(".") && e.key.includes("."))
                                                                e.preventDefault();

                                                            // check if this keystroke would make the value exceed the max
                                                            const input = e.currentTarget as HTMLInputElement;
                                                            const newValue = input.value + e.key;
                                                            if (
                                                                input.max &&
                                                                !isNaN(parseFloat(newValue)) &&
                                                                parseFloat(newValue) > parseFloat(input.max)
                                                            ) {
                                                                setError(MAX_BALANCE_ERROR);
                                                            }
                                                        }}
                                                        onWheelCapture={(e) => {
                                                            e.currentTarget.blur();
                                                        }}
                                                        value={sendAmount}
                                                        onChange={(e) => {
                                                            // Reset transfer max if amount is changed
                                                            const value = formatInputNumber(
                                                                e.target.value,
                                                                token?.displayDecimals || DEFAULT_TOKEN_MAX_DECIMALS
                                                            );

                                                            // check if input exceeds balance
                                                            if (
                                                                !isNaN(parseFloat(e.target.max)) &&
                                                                parseFloat(value) > parseFloat(e.target.max)
                                                            ) {
                                                                // allow setting the wrong value only once
                                                                if (maxValueError) return;
                                                                setMaxValueError(true);
                                                            } else {
                                                                setError(null);
                                                                setMaxValueError(false);
                                                            }

                                                            debouncedFunc(value);
                                                            setSendAmount(value);
                                                            setTransferMax(false);
                                                        }}
                                                        placeholder="0"
                                                        className={cn(
                                                            "gw-text-foreground gw-bg-transparent focus:gw-outline-none placeholder:gw-text-foreground gw-absolute gw-inset-0 gw-w-full gw-max-w-44",
                                                            !Number(token?.value || "0") &&
                                                                "gw-opacity-50 gw-cursor-not-allowed"
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                            <span className="gw-text-input gw-typography-h4-nr">
                                                {token?.symbol || ""}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="gw-flex gw-justify-center gw-items-center gw-mt-4 gw-gap-4">
                                        {token?.rateInCurrency && (
                                            <div className="gw-text-brand-gray-600">
                                                {formatCurrency(+token?.rateInCurrency * +sendAmount, token?.currency)}
                                            </div>
                                        )}
                                        <Button
                                            variant="tertiary"
                                            size="sm"
                                            disabled={!Number(token?.value || "0")}
                                            className="gw-rounded-lg gw-py-1 gw-px-2 gw-h-auto gw-w-16"
                                            onClick={() => {
                                                const valueToSet = transferMax ? "" : `${+(token?.value || 0) || ""}`;
                                                setSendAmount(valueToSet);
                                                debouncedFunc(valueToSet);
                                                setTransferMax((v) => !v);
                                            }}
                                        >
                                            <span className="gw-typography-overline">
                                                {!transferMax ? "Max" : "Clear"}
                                            </span>
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {validAmountEntered ? (
                                <div className="gw-typography-caption gw-mt-3 gw-w-full">
                                    <div className="gw-flex gw-justify-between gw-items-center gw-space-x-1">
                                        <span>Transaction Time</span>
                                        {quoteLoading || !quote ? (
                                            <Skeleton className="gw-w-20 gw-h-4" />
                                        ) : (
                                            <span className="gw-text-brand-gray-500 gw-text-right">{`<1 min`}</span>
                                        )}
                                    </div>

                                    <div className="gw-flex gw-justify-between gw-items-center gw-mt-2 gw-space-x-1">
                                        <span>Network Fees</span>
                                        <div className="gw-text-brand-gray-500 gw-text-right">
                                            {quoteLoading || !quote ? (
                                                <Skeleton className="gw-w-20 gw-h-4" />
                                            ) : (
                                                `${displayNumberPrecision(quote?.estimated_fees_amount_in_currency, nativeToken?.displayDecimals)} ${nativeToken?.symbol} (${formatCurrency(quote?.estimated_fees_amount_in_currency, quote?.currency)})`
                                            )}
                                        </div>
                                    </div>

                                    <div className="gw-flex gw-justify-between gw-items-center gw-mt-2 gw-space-x-1">
                                        <span>Expected receivable amount</span>
                                        <div className="gw-text-brand-gray-500 gw-text-right">
                                            {quoteLoading || !quote ? (
                                                <Skeleton className="gw-w-20 gw-h-4" />
                                            ) : (
                                                `${quote?.receivable_amount_in_token} ${token?.symbol} (${quote?.receivable_amount_in_currency} ${token?.currency})`
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div />
                            )}
                        </div>
                    }
                    footer={
                        <>
                            <div className="gw-p-3 gw-rounded-2xl gw-bg-background gw-drop-shadow-buttonLg gw-flex gw-items-center gw-space-x-2 gw-w-full gw-justify-between">
                                <div className="gw-flex gw-gap-2 gw-items-center">
                                    <UserAvatar className="gw-size-6 gw-flex-shrink-0" />
                                    <div className="gw-flex gw-flex-col gw-typography-caption">
                                        <span className="gw-text-brand-gray-500">From</span>
                                        <span className="gw-break-all">
                                            {user?.name || truncateEthAddress(user?.evmWallet || "")}
                                        </span>
                                    </div>
                                </div>
                                <div className="gw-flex gw-items-center gw-justify-center gw-text-primary gw-relative gw-z-10">
                                    <CaretDownIcon className="gw-w-3 -gw-rotate-90 gw-opacity-50" />
                                    <CaretDownIcon className="gw-w-3 -gw-ml-1 -gw-rotate-90" />
                                </div>
                                <div className="gw-flex gw-gap-2 gw-items-center gw-min-w-24">
                                    <UserAvatar
                                        className="gw-size-6 gw-flex-shrink-0"
                                        overrideAlt="Recipient Wallet Address PFP"
                                        overrideUrl={ethereumAvatar(recipientAddress)}
                                    />
                                    <div className="gw-flex gw-flex-col gw-typography-caption">
                                        <span className="gw-text-brand-gray-500">To</span>
                                        <span className="gw-break-all">{truncateEthAddress(recipientAddress)}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="gw-text-destructive gw-typography-caption gw-text-center gw-mt-1 gw-h-3">
                                {error ? error : null}
                            </div>
                            <Button
                                variant="default"
                                className="gw-w-full gw-mt-2"
                                disabled={
                                    isSignaturePending ||
                                    quoteLoading ||
                                    !!error ||
                                    !quote ||
                                    !sendAmount ||
                                    +sendAmount <= 0 ||
                                    (token?.value ? +sendAmount > +token.value : false)
                                }
                                onClick={async () => {
                                    let receipt;
                                    setIsSignaturePending(true);
                                    setError(null);
                                    try {
                                        if (!quote?.receivable_amount) {
                                            throw new Error("No receivable amount");
                                        }

                                        let hash_: string | undefined;
                                        if (tokenAddress === zeroAddress) {
                                            receipt = await sendTransaction({
                                                transaction: {
                                                    to: recipientAddress,
                                                    value: quote?.receivable_amount,
                                                    maxFeePerGas: quote?.maxFeePerGas,
                                                    maxPriorityFeePerGas: quote?.maxPriorityFeePerGas
                                                }
                                            });
                                            hash_ = typeof receipt === "object" ? receipt.hash : receipt;
                                        } else {
                                            const txData = await publicClient.simulateContract({
                                                abi: erc20Abi,
                                                functionName: "transfer",
                                                account: user?.evmWallet as Hex,
                                                address: tokenAddress as Hex,
                                                args: [recipientAddress as Hex, quote?.receivable_amount],
                                                chain: apeChain,
                                                gas: quote?.gasLimit,
                                                maxFeePerGas: quote?.maxFeePerGas,
                                                maxPriorityFeePerGas: quote?.maxPriorityFeePerGas
                                            });
                                            receipt = await writeContractAsync({
                                                abi: erc20Abi,
                                                functionName: "transfer",
                                                account: user?.evmWallet as Hex,
                                                address: tokenAddress as Hex,
                                                args: [recipientAddress as Hex, quote?.receivable_amount],
                                                chain: apeChain,
                                                // gas: quote?.gasLimit,
                                                maxFeePerGas: txData?.request?.maxFeePerGas,
                                                maxPriorityFeePerGas: txData?.request?.maxPriorityFeePerGas
                                            });
                                            hash_ = receipt;
                                        }
                                        logger.debug("using tx", hash_);
                                        if (!glyphApiFetch) return toast.error("Glyph API not ready");
                                        const res = await glyphApiFetch(`/api/widget/transactions/${hash_}`, {
                                            method: "POST",
                                            body: JSON.stringify({
                                                chainId: apeChain.id // If not set it uses apeChain by default, but we set it explicitly here
                                            })
                                        });
                                        if (res.ok) {
                                            setTxHash(hash_);
                                            setError(null);
                                            setView(SendView.WAIT);
                                        } else setError("Failed to send transaction");
                                    } catch (error) {
                                        setError("Request rejected or failed");
                                        toast.error("Request rejected or failed");
                                    } finally {
                                        setIsSignaturePending(false);
                                    }
                                }}
                            >
                                Send
                                {isSignaturePending && <Loader2 className="gw-size-4 gw-animate-spin" />}
                            </Button>
                        </>
                    }
                    mainFooter={false}
                    footerCols={true}
                />
            )}

            {view === SendView.WAIT && (
                <WalletSendFundPendingView
                    onBack={onBack}
                    txHash={txHash}
                    txBlockExplorerUrl={txBlockExplorerUrl}
                    txBlockExplorerName={txBlockExplorerName}
                    quote={quote!}
                    tokenSymbol={token?.symbol || ""}
                    TokenIcon={TokenIcon}
                />
            )}

            {view === SendView.END &&
                (txStatus === "SUCCESS" ? (
                    <WalletSendFundSuccessView
                        onEnd={() =>
                            refreshBalances(true)
                                .catch()
                                .finally(() => onEnd())
                        }
                        onShowActivity={() =>
                            refreshBalances()
                                .catch()
                                .finally(() => onShowActivity())
                        }
                        quote={quote!}
                        tokenSymbol={token?.symbol || ""}
                    />
                ) : (
                    <WalletSendFundFailedView
                        txHash={txHash}
                        txBlockExplorerUrl={txBlockExplorerUrl}
                        txBlockExplorerName={txBlockExplorerName}
                        onEnd={() =>
                            refreshBalances(true)
                                .catch()
                                .finally(() => onEnd())
                        }
                        onShowActivity={() =>
                            refreshBalances()
                                .catch()
                                .finally(() => onShowActivity())
                        }
                    />
                ))}
        </>
    );
}
