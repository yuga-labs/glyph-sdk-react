import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import USDIcon from "../../assets/images/USDIcon.png";
import { LinkIcon } from "../../assets/svg/LinkIcon";
import { useGlyphFunding } from "../../hooks/useGlyphFunding";
import { FundView, INTERNAL_GRADIENT_TYPE } from "../../lib/constants";
import { currencyToSymbol, formatCurrency } from "../../lib/intl";
import { formatInputNumber } from "../../lib/numericInputs";
import WalletViewHeader from "../shared/WalletViewHeader";
import { WalletViewTemplate } from "../shared/WalletViewTemplate";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import TooltipElement from "../ui/tooltip-element";
import WalletFundFailedView from "./WalletFundFailedView";
import WalletFundPendingView from "./WalletFundPendingView";
import WalletFundSuccessView from "./WalletFundSuccessView";
import { NativeTokenIcon } from "../shared/ChainIcon";

export type WalletFundProps = {
    onBack: () => void;
    onEnd: () => void;
    onShowActivity: () => void;
    setGradientType: React.Dispatch<React.SetStateAction<INTERNAL_GRADIENT_TYPE | undefined>>;
};

const MAX_DECIMALS = 2;

export function WalletFundView({ onBack, onEnd, onShowActivity, setGradientType }: WalletFundProps) {
    const QA = false;

    const {
        userCurrency,
        fundAmount,
        fundMinAmount,
        fundMaxAmount,
        fundIntermediaryToken,
        fundDone,
        fundError,
        fundAmountError,
        fundQuote,
        fundStatus,
        quoteLoading,
        doFunding,
        setFundAmount,
        isOnrampEnabled,
        onramppDisabledError,
        fundSymbol
    } = useGlyphFunding();

    const [view, setView] = useState<FundView>(FundView.BUY);

    const [fetchingPaymentLink, setFetchingPaymentLink] = useState<boolean>(false);

    const handleBuy = async () => {
        if (!isOnrampEnabled && !QA) return;
        setFetchingPaymentLink(true);
        doFunding(
            () => {
                setView(FundView.WAIT);
                setFetchingPaymentLink(false);
            },
            (error: string) => {
                toast.error(error);
                setFetchingPaymentLink(false);
            }
        );
    };

    useEffect(() => {
        if (fundDone) setView(FundView.END);
    }, [fundDone]);

    // Set the gradient type to primary when the success/failed view is opened
    useEffect(() => {
        if (view === FundView.END && fundStatus === "SUCCESS") setGradientType(INTERNAL_GRADIENT_TYPE.SUCCESS);
        if (view === FundView.END && fundStatus === "FAILED") setGradientType(INTERNAL_GRADIENT_TYPE.ERROR);
        // Reset the gradient type when the success/failed view is closed
        return () => {
            setGradientType(undefined);
        };
    }, [setGradientType, fundStatus, view]);

    const validAmountEntered = fundAmount && !fundAmountError;

    return (
        <>
            {view === FundView.BUY && (
                <WalletViewTemplate
                    header={
                        <WalletViewHeader
                            fullScreenHeader={{
                                title: "Fund Wallet",
                                onBackClick: onBack
                            }}
                        />
                    }
                    content={
                        <div className="gw-p-4 gw-h-full gw-flex gw-flex-col gw-justify-center">
                            <div
                                className="gw-flex gw-flex-col gw-cursor-text"
                                onClick={(e) => {
                                    const input = e.currentTarget.querySelector("input");
                                    if (input) {
                                        input.focus();
                                    }
                                }}
                            >
                                <div className="gw-typography-body2 gw-text-brand-gray-500">
                                    {validAmountEntered ? "Pay" : "Enter Amount"}
                                </div>
                                <div className="gw-flex gw-justify-between gw-items-center gw-mt-1">
                                    <div
                                        className={`gw-w-full gw-text-center gw-border-b-2 gw-border-border focus-within:gw-border-foreground gw-pb-1 gw-flex gw-justify-between gw-items-center gw-typography-h3-nr`}
                                    >
                                        <span>{currencyToSymbol(userCurrency)}</span>
                                        <div className="gw-flex-1 gw-overflow-hidden">
                                            <input
                                                type="text"
                                                min={fundMinAmount ?? 0}
                                                max={fundMaxAmount ?? 999999}
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
                                                    if (fundAmount?.includes(".") && e.key.includes("."))
                                                        e.preventDefault();
                                                }}
                                                disabled={fetchingPaymentLink || (!isOnrampEnabled && !QA)}
                                                onWheelCapture={(e) => {
                                                    e.currentTarget.blur();
                                                }}
                                                value={fundAmount}
                                                onChange={(e) =>
                                                    setFundAmount((v: string) => {
                                                        let value = formatInputNumber(e.target.value, MAX_DECIMALS);
                                                        if (
                                                            e.target.max &&
                                                            parseFloat(value) > parseFloat(e.target.max)
                                                        )
                                                            value = v;

                                                        return value;
                                                    })
                                                }
                                                placeholder="0"
                                                className="gw-text-foreground gw-bg-transparent focus:gw-outline-none placeholder:gw-text-foreground gw-w-full disabled:gw-cursor-not-allowed"
                                            />
                                        </div>

                                        {userCurrency === "USD" ? (
                                            <img src={USDIcon} alt="coin" className="gw-size-10 gw-rounded-full" />
                                        ) : (
                                            <div className="gw-rounded-full gw-size-10 gw-inline-flex gw-justify-center gw-items-center gw-bg-primary gw-text-primary-foreground gw-typography-body2">
                                                {userCurrency}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="gw-typography-caption">
                                    <div className="gw-mt-2 gw-text-brand-gray-500 gw-text-center">
                                        {fundAmountError ||
                                            (isOnrampEnabled && `${formatCurrency(fundMinAmount ?? 0, userCurrency)} min - ${formatCurrency(fundMaxAmount ?? 999999, userCurrency)} max`)}
                                    </div>

                                    {!validAmountEntered && (
                                        isOnrampEnabled ? (
                                            <div className="gw-mt-4 gw-flex gw-space-x-2 gw-text-brand-gray-500 gw-items-center gw-justify-center">
                                                <span>You will receive {fundSymbol}</span>
                                                <NativeTokenIcon className="gw-size-6" />
                                            </div>
                                        ) : (
                                            <div className="gw-mt-8 gw-text-brand-gray-600 gw-text-center gw-text-xs gw-px-4 gw-py-3 gw-rounded-xl gw-border" style={{ borderColor: '#FFBD42', backgroundColor: 'rgba(253, 215, 53, 0.08)' }}>
                                                To fund your wallet, switch your network to <b className="gw-text-brand-gray-700">ApeChain</b>. From Home, choose ApeChain in the top right. Remember, funds remain on <b className="gw-text-brand-gray-700">ApeChain</b>.
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>

                            {validAmountEntered && (
                                <div>
                                    <div className="gw-flex gw-flex-col gw-mt-5">
                                        <div className="gw-typography-body2 gw-text-brand-gray-500">Receive</div>
                                        <div className="gw-flex gw-justify-between gw-items-center gw-mt-1">
                                            <div className="gw-typography-h3-nr">
                                                {quoteLoading ? (
                                                    <Skeleton className="gw-w-20 gw-h-10" />
                                                ) : (
                                                    fundQuote?.out_tokens_amount
                                                )}
                                            </div>

                                            <NativeTokenIcon className="gw-size-10 gw-rounded-full" />
                                        </div>
                                        <div className="gw-typography-caption gw-text-brand-gray-500 gw-mt-1 gw-text-center gw-flex gw-items-center gw-justify-center gw-gap-0.5">
                                            <span>1 {fundSymbol} = </span>
                                            {quoteLoading ? (
                                                <Skeleton className="gw-w-6 gw-h-4 gw-inline-block" />
                                            ) : (
                                                // TODO: Do the calculation before showing it in diff currency
                                                `${formatCurrency(fundQuote?.ape_to_currency, fundQuote?.currency)}`
                                            )}
                                        </div>
                                    </div>

                                    <div className="gw-flex gw-justify-between gw-py-4 gw-border-b gw-border-muted">
                                        <span className="gw-typography-caption">How this transaction works</span>
                                        <TooltipElement
                                            stopPropagation
                                            description={
                                                <div className="gw-p-3 gw-max-w-xs">
                                                    <div className="gw-typography-body2 !gw-font-bold gw-text-center">
                                                        How This Transaction Works
                                                    </div>
                                                    <p className="gw-typography-caption gw-text-brand-gray-500 gw-mt-2">
                                                        Once you enter an amount, we&apos;ll take care of the rest. Your
                                                        order is processed via Coinbase.
                                                    </p>
                                                    <div className="gw-mt-4 gw-space-y-3">
                                                        <div className="gw-flex gw-items-center gw-space-x-3">
                                                            <div className="gw-size-6 gw-flex-shrink-0 gw-rounded-full gw-border gw-border-secondary gw-flex gw-items-center gw-justify-center gw-typography-body2 gw-text-secondary">
                                                                1
                                                            </div>
                                                            <p className="gw-typography-caption">
                                                                <span className="gw-font-medium">Buy {fundIntermediaryToken}:</span> Your{" "}
                                                                {userCurrency} is converted to {fundIntermediaryToken}
                                                            </p>
                                                        </div>
                                                        <div className="gw-flex gw-items-center gw-space-x-3">
                                                            <div className="gw-size-6 gw-flex-shrink-0 gw-rounded-full gw-border gw-border-secondary gw-flex gw-items-center gw-justify-center gw-typography-body2 gw-text-secondary">
                                                                2
                                                            </div>
                                                            <p className="gw-typography-caption">
                                                                <span className="gw-font-medium">Swap to {fundSymbol}:</span>{" "}
                                                                {fundIntermediaryToken} is exchanged for {fundSymbol} on current chain
                                                            </p>
                                                        </div>
                                                        <div className="gw-flex gw-items-center gw-space-x-3">
                                                            <div className="gw-size-6 gw-flex-shrink-0 gw-rounded-full gw-border gw-border-secondary gw-flex gw-items-center gw-justify-center gw-typography-body2 gw-text-secondary">
                                                                3
                                                            </div>
                                                            <p className="gw-typography-caption">
                                                                <span className="gw-font-medium">Receive Funds:</span>{" "}
                                                                {fundSymbol} is sent to your wallet
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            }
                                            side="left"
                                            align="center"
                                        />
                                    </div>

                                    {/* Tx data */}
                                    <div className="gw-typography-body2 gw-mt-4">
                                        <div className="gw-flex gw-justify-between gw-items-center">
                                            <span>Transaction Time</span>
                                            <span className="gw-text-brand-gray-500">1-5 mins</span>
                                        </div>

                                        <div className="gw-flex gw-justify-between gw-items-center gw-mt-2">
                                            <span>Network Fees</span>
                                            <div className="gw-text-brand-gray-500">
                                                {quoteLoading ? (
                                                    <Skeleton className="gw-w-6 gw-h-3.5" />
                                                ) : (
                                                    `${formatCurrency(fundQuote?.estimated_fees_amount, fundQuote?.currency)}`
                                                )}
                                            </div>
                                        </div>

                                        <div className="gw-flex gw-justify-between gw-items-center gw-mt-2">
                                            <span>Total</span>
                                            <div className="gw-text-brand-gray-500">
                                                {quoteLoading ? (
                                                    <Skeleton className="gw-w-6 gw-h-3.5" />
                                                ) : (
                                                    `${formatCurrency(fundQuote?.in_amount, fundQuote?.currency)}`
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    }
                    footer={
                        <>
                            <Button
                                variant={"tertiary"}
                                className="gw-w-full gw-mb-3"
                                style={{
                                    backgroundColor: isOnrampEnabled ? undefined : '#EAEAEA',
                                    color: isOnrampEnabled ? undefined : '#808080'
                                }}
                                disabled={
                                    quoteLoading ||
                                    !!fundError ||
                                    fetchingPaymentLink ||
                                    (!isOnrampEnabled && !QA) ||
                                    !validAmountEntered
                                }
                                onClick={handleBuy}
                            >
                                {isOnrampEnabled || QA ? (
                                    <>
                                        {validAmountEntered && !quoteLoading ? (
                                            <>
                                                Continue to Coinbase <LinkIcon className="gw-size-4" />
                                            </>
                                        ) : (
                                            "Continue"
                                        )}
                                        {((quoteLoading && validAmountEntered) || fetchingPaymentLink) && (
                                            <Loader2 className="gw-size-4 gw-animate-spin" />
                                        )}
                                    </>
                                ) : (
                                    onramppDisabledError || "Continue"
                                )}
                            </Button>
                            <span
                                className={`gw-inline-flex gw-items-center gw-space-x-2 gw-typography-caption ${fundError ? "gw-text-destructive" : "gw-text-brand-gray-500"}`}
                            >
                                <span>
                                    *{" "}
                                    {fundError
                                        ? fundError
                                        : !validAmountEntered
                                            ? `You pay in ${currencyToSymbol(userCurrency)} (${userCurrency})`
                                            : "Your order will be fulfilled via Coinbase"}
                                </span>
                            </span>
                        </>
                    }
                    mainFooter={false}
                    footerCols={true}
                />
            )}

            {view === FundView.WAIT && (
                <WalletFundPendingView
                    onBack={onBack}
                    id={fundQuote?.id || ""}
                    value={fundQuote?.out_tokens_amount || 0}
                />
            )}

            {view === FundView.END &&
                (fundStatus === "SUCCESS" ? (
                    <WalletFundSuccessView
                        value={fundQuote?.out_tokens_amount || 0}
                        onEnd={onEnd}
                        onShowActivity={onShowActivity}
                    />
                ) : (
                    <WalletFundFailedView id={fundQuote?.id || ""} onEnd={onEnd} onShowActivity={onShowActivity} />
                ))}
        </>
    );
}
