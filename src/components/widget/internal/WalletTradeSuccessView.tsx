import { X } from "lucide-react";
import { memo, useMemo } from "react";
import { CaretDownIcon } from "../../../assets/svg/CaretDownIcon";
import { SuccessIcon } from "../../../assets/svg/SuccessIcon";
import { useGlyphSwap } from "../../../context/GlyphSwapContext";
import { relayClient } from "../../../lib/relay";
import { LinkWithIcon } from "../../shared/LinkWithIcon";
import { WalletViewTemplate } from "../../shared/WalletViewTemplate";
import { Button } from "../../ui/button";
import { TokenAndChainIcon } from "./TokenAndChainIcon";

interface WalletSendFundSuccessViewProps {
    onEnd: () => void;
    onShowActivity: () => void;

    sellAmount: number;
    buyAmount: number;

    txDetails?: {
        hash?: string;
        blockExplorerUrl?: string;
        blockExplorerName?: string;
    };
}

const WalletSendFundSuccessView: React.FC<WalletSendFundSuccessViewProps> = ({
    onEnd,
    onShowActivity,
    sellAmount,
    buyAmount,
    txDetails
}) => {
    const relayChains = relayClient.chains || [];

    const { fromCurrency, toCurrency } = useGlyphSwap();

    const fromChain = useMemo(
        () => relayChains.find((chain) => chain.id === fromCurrency?.chainId),
        [fromCurrency?.chainId]
    );
    const toChain = useMemo(() => relayChains.find((chain) => chain.id === toCurrency?.chainId), [toCurrency?.chainId]);

    return (
        <WalletViewTemplate
            content={
                <div className="gw-w-full gw-min-h-full gw-flex gw-flex-col gw-items-center gw-rounded-3xl gw-relative">
                    <div className="gw-flex gw-justify-end gw-w-full gw-p-4 gw-relative gw-z-10">
                        <div className="gw-size-12">
                            <button
                                className="gw-size-full gw-inline-flex gw-justify-center gw-items-center"
                                onClick={onEnd}
                            >
                                <X className="gw-size-6" />
                            </button>
                        </div>
                    </div>

                    <div className="gw-w-full gw-p-4 gw-relative gw-z-10 gw-flex-1 gw-flex-col gw-flex gw-justify-end">
                        <div className="gw-flex gw-flex-col gw-items-center gw-w-full">
                            <SuccessIcon className="gw-size-24" />
                            <span className="gw-mt-7 gw-typography-h4-nr">Success</span>
                            <span className="gw-mt-3 gw-text-center gw-whitespace-pre-wrap !gw-leading-tight">
                                {fromCurrency?.symbol &&
                                    toCurrency?.symbol &&
                                    `You have successfully swapped\n${fromCurrency.symbol} for ${toCurrency.symbol}`}
                            </span>

                            <div className="gw-my-6 gw-rounded-2xl gw-bg-background gw-drop-shadow-buttonLg gw-flex gw-p-4 gw-items-center gw-space-x-3 gw-w-full gw-justify-center">
                                <TokenAndChainIcon
                                    token={{
                                        name: fromCurrency?.name,
                                        logoUrl: fromCurrency?.metadata?.logoURI
                                    }}
                                    chain={
                                        fromChain && {
                                            id: fromChain?.id,
                                            name: fromChain?.name,
                                            logoUrl: fromChain?.iconUrl
                                        }
                                    }
                                    tokenClassName="gw-size-8"
                                    chainClassName="gw-size-4"
                                />
                                <div className="gw-flex gw-flex-col gw-gap-0.5 gw-min-w-12">
                                    <span className="gw-typography-body1 !gw-leading-none">{sellAmount}</span>
                                    <span className="gw-typography-caption gw-text-brand-gray-500">
                                        {fromCurrency?.symbol}
                                    </span>
                                </div>
                                <div className="gw-flex gw-items-center gw-justify-center gw-text-brand-success gw-relative gw-z-10">
                                    <CaretDownIcon className="gw-w-3 -gw-rotate-90 gw-opacity-50" />
                                    <CaretDownIcon className="gw-w-3 -gw-ml-1 -gw-rotate-90" />
                                </div>
                                <TokenAndChainIcon
                                    token={{
                                        name: toCurrency?.name,
                                        logoUrl: toCurrency?.metadata?.logoURI
                                    }}
                                    chain={
                                        toChain && {
                                            id: toChain.id,
                                            name: toChain.name,
                                            logoUrl: toChain.iconUrl
                                        }
                                    }
                                    tokenClassName="gw-size-8"
                                    chainClassName="gw-size-4"
                                />
                                <div className="gw-flex gw-flex-col gw-gap-0.5 gw-min-w-12">
                                    <span className="gw-typography-body1 !gw-leading-none">{buyAmount}</span>
                                    <span className="gw-typography-caption gw-text-brand-gray-500">
                                        {toCurrency?.symbol}
                                    </span>
                                </div>
                            </div>

                            <div className="gw-my-1 gw-flex gw-p-4 gw-items-center gw-w-full gw-justify-center gw-space-x-2 gw-typography-caption">
                                {txDetails?.hash && txDetails?.blockExplorerUrl ? (
                                    <LinkWithIcon
                                        key={txDetails.hash}
                                        text={`View on ${txDetails.blockExplorerName || "block explorer"}`}
                                        url={txDetails.blockExplorerUrl}
                                    />
                                ) : null}
                            </div>

                            <Button variant="tertiary" className="gw-w-full" onClick={onShowActivity}>
                                View Transaction
                            </Button>
                        </div>
                    </div>
                </div>
            }
        />
    );
};

export default memo(WalletSendFundSuccessView);
