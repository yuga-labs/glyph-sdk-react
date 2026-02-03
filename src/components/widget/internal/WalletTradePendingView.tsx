import { memo, useMemo } from "react";
import { CaretDownIcon } from "../../../assets/svg/CaretDownIcon";
import LoadingCircleIcon from "../../../assets/svg/LoadingCircleIcon";
import { useGlyphSwap } from "../../../context/GlyphSwapContext";
import { chainIdToRelayChain } from "../../../lib/utils";
import { LinkWithIcon } from "../../shared/LinkWithIcon";
import WalletViewHeader from "../../shared/WalletViewHeader";
import { WalletViewTemplate } from "../../shared/WalletViewTemplate";
import { Button } from "../../ui/button";
import { TokenAndChainIcon } from "./TokenAndChainIcon";

interface WalletTradePendingViewProps {
    onBack: () => void;
    txDetails?: {
        hash?: string;
        blockExplorerUrl?: string;
        blockExplorerName?: string;
        estimatedTime?: number;
    };
    sellAmount: number;
    buyAmount: number;
    isTxApproved: boolean;
}

const WalletTradePendingView: React.FC<WalletTradePendingViewProps> = ({
    onBack,
    txDetails,
    sellAmount,
    buyAmount,
    isTxApproved
}) => {
    const { fromCurrency, toCurrency } = useGlyphSwap();

    const fromChain = useMemo(
        () => (fromCurrency?.chainId ? chainIdToRelayChain(fromCurrency?.chainId) : undefined),
        [fromCurrency?.chainId]
    );
    const toChain = useMemo(
        () => (toCurrency?.chainId ? chainIdToRelayChain(toCurrency?.chainId) : undefined),
        [toCurrency?.chainId]
    );

    const isGlyphDashboard = useMemo(() => {
        return ["useglyph.io", "staging.useglyph.io"].includes(window.location.hostname);
    }, []);

    return (
        <WalletViewTemplate
            header={
                <WalletViewHeader
                    fullScreenHeader={{
                        title: "Transaction Status",
                        onCloseClick: onBack
                    }}
                />
            }
            footerClassName="!gw-pt-2"
            content={
                <div className="gw-p-4 gw-h-full">
                    <h6>{!isGlyphDashboard && !isTxApproved ? "Waiting For Approval" : "Finalizing Transaction"}</h6>
                    <div className="gw-mt-4 gw-typography-caption gw-flex gw-justify-between gw-items-center">
                        <span>Estimated wait time:</span>
                        <span className="gw-text-brand-gray-500">
                            {/* Add 15 seconds buffer to fetch status */}
                            {txDetails?.estimatedTime ? `${txDetails?.estimatedTime} secs` : "<15 secs"}
                        </span>
                    </div>

                    <div className="gw-mt-4 gw-flex gw-justify-center gw-items-center">
                        <div className="gw-rounded-full gw-flex gw-flex-col gw-items-center gw-justify-center gw-p-10 gw-relative gw-size-64 gw-overflow-hidden gw-bg-white dark:gw-bg-black">
                            <LoadingCircleIcon className="gw-absolute gw-inset-0 gw-animate-spin gw-size-64 gw-z-0" />

                            <div className="gw-flex gw-items-center gw-justify-between gw-relative gw-z-10">
                                <TokenAndChainIcon
                                    token={{
                                        name: fromCurrency?.name,
                                        logoUrl: fromCurrency?.metadata?.logoURI
                                    }}
                                    chain={
                                        fromChain
                                            ? {
                                                  id: fromChain?.id,
                                                  name: fromChain?.name,
                                                  logoUrl: fromChain?.iconUrl
                                              }
                                            : undefined
                                    }
                                    tokenClassName="gw-size-8"
                                    chainClassName="gw-size-4"
                                />

                                <div className="gw-px-2 gw-flex gw-flex-col gw-gap-0.5">
                                    <span className="gw-typography-h6">{sellAmount}</span>
                                    <span className="gw-typography-caption gw-text-brand-gray-500">
                                        {fromCurrency?.symbol}
                                    </span>
                                </div>
                            </div>

                            <div className="gw-flex gw-gap-3 gw-items-center">
                                <div className="gw-my-5 gw-flex gw-flex-col gw-items-center gw-justify-center gw-text-brand-success gw-relative gw-z-10">
                                    <CaretDownIcon className="gw-animate-pulse gw-w-4" />
                                    <CaretDownIcon className="gw-animate-pulse gw-delay-300 gw-w-4" />
                                    <CaretDownIcon className="gw-animate-pulse gw-delay-600 gw-w-4" />
                                </div>
                            </div>

                            <div className="gw-flex gw-items-center gw-justify-between gw-relative gw-z-10">
                                <TokenAndChainIcon
                                    token={{
                                        name: toCurrency?.name,
                                        logoUrl: toCurrency?.metadata?.logoURI
                                    }}
                                    chain={
                                        toChain
                                            ? {
                                                  id: toChain.id,
                                                  name: toChain.name,
                                                  logoUrl: toChain.iconUrl
                                              }
                                            : undefined
                                    }
                                    tokenClassName="gw-size-8"
                                    chainClassName="gw-size-4"
                                />

                                <div className="gw-px-2 gw-flex gw-flex-col gw-gap-0.5">
                                    <span className="gw-typography-h6">{buyAmount}</span>
                                    <span className="gw-typography-caption gw-text-brand-gray-500">
                                        {toCurrency?.symbol}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            }
            footer={
                <>
                    <span className="gw-inline-flex gw-items-center gw-space-x-2 gw-typography-caption gw-text-brand-gray-500 gw-text-center">
                        {txDetails?.hash && txDetails?.blockExplorerUrl ? (
                            <LinkWithIcon
                                key={txDetails?.hash}
                                text={`View on ${txDetails?.blockExplorerName || "block explorer"}`}
                                url={txDetails?.blockExplorerUrl}
                            />
                        ) : (
                            <span>
                                {!isGlyphDashboard && !isTxApproved ? (
                                    <span className="gw-text-foreground">
                                        *Approvals open in a new window for your safety. Please approve each and return
                                        here.*
                                    </span>
                                ) : (
                                    "*Please do not close this tab.*"
                                )}
                            </span>
                        )}
                    </span>
                    <Button variant="outline" className="gw-w-full gw-mt-4" onClick={onBack}>
                        Back to Home
                    </Button>
                </>
            }
            footerCols={true}
            mainFooter={false}
        />
    );
};

export default memo(WalletTradePendingView);
