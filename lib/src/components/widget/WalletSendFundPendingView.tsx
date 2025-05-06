import React from "react";
import truncateEthAddress from "truncate-eth-address";
import { CaretDownIcon } from "../../assets/svg/CaretDownIcon";
import LoadingCircleIcon from "../../assets/svg/LoadingCircleIcon.";
import { useGlyph } from "../../hooks/useGlyph";
import { ethereumAvatar } from "../../lib/utils";
import UserAvatar from "../shared/UserAvatar";
import WalletViewHeader from "../shared/WalletViewHeader";
import { WalletViewTemplate } from "../shared/WalletViewTemplate";
import { Button } from "../ui/button";
import { SendFundQuote } from "./WalletSendFundView";
import { LinkWithIcon } from "../shared/LinkWithIcon";

interface WalletSendFundPendingViewProps {
    onBack: () => void;
    txHash: string | undefined;
    txBlockExplorerUrl: string | undefined;
    txBlockExplorerName: string | undefined;
    quote: SendFundQuote;
    tokenSymbol: string;
    TokenIcon: React.FC<React.SVGProps<SVGSVGElement>>;
}

const WalletSendFundPendingView: React.FC<WalletSendFundPendingViewProps> = ({
    onBack,
    txHash,
    txBlockExplorerUrl,
    txBlockExplorerName,
    quote,
    tokenSymbol,
    TokenIcon
}) => {
    const { user } = useGlyph();

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
            content={
                <div className="gw-p-4 gw-h-full">
                    <h6>In Progress</h6>
                    <div className="gw-mt-4 gw-typography-caption gw-flex gw-justify-between gw-items-center">
                        <span>Estimated wait time:</span>
                        <span className="gw-text-brand-gray-500">1 min</span>
                    </div>

                    <div className="gw-mt-4 gw-flex gw-justify-center gw-items-center">
                        <div className="gw-rounded-full gw-flex gw-flex-col gw-items-center gw-justify-center gw-p-10 gw-relative gw-size-64 gw-overflow-hidden gw-bg-white dark:gw-bg-black">
                            <LoadingCircleIcon className="gw-absolute gw-inset-0 gw-animate-spin gw-size-64 gw-z-0" />

                            <div className="gw-flex gw-items-center gw-space-x-3 gw-justify-between gw-relative gw-z-10">
                                <UserAvatar className="gw-size-8" />

                                <div className="gw-flex gw-flex-col gw-typography-body2">
                                    <div className="">From</div>
                                    <div>{truncateEthAddress(user!.evmWallet)}</div>
                                </div>
                            </div>

                            <div className="gw-flex gw-gap-3 gw-items-center">
                                <div className="gw-my-5 gw-flex gw-flex-col gw-items-center gw-justify-center gw-text-brand-success gw-relative gw-z-10">
                                    <CaretDownIcon className="gw-animate-pulse gw-w-4" />
                                    <CaretDownIcon className="gw-animate-pulse gw-delay-300 gw-w-4" />
                                    <CaretDownIcon className="gw-animate-pulse gw-delay-600 gw-w-4" />
                                </div>

                                <div className="gw-flex gw-items-center gw-justify-center gw-relative gw-z-10">
                                    <TokenIcon className="gw-size-6" />

                                    <div className="gw-typography-body2 gw-ml-2">
                                        <span>{quote?.receivable_amount_in_token}</span>{" "}
                                        <span className="gw-text-brand-gray-500">{tokenSymbol}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="gw-flex gw-items-center gw-space-x-3 gw-justify-between gw-relative gw-z-10">
                                <UserAvatar
                                    className="gw-size-8"
                                    overrideAlt="Recipient Wallet Address PFP"
                                    overrideUrl={ethereumAvatar(quote?.receiver_address)}
                                />

                                <div className="gw-flex gw-flex-col gw-typography-body2">
                                    <div className="">To</div>
                                    <div>{truncateEthAddress(quote?.receiver_address)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            }
            footer={
                <>
                    {txHash && txBlockExplorerUrl && (
                        <span className="gw-inline-flex gw-items-center gw-space-x-2 gw-typography-caption gw-text-brand-gray-500">
                            <LinkWithIcon
                                key={txHash}
                                text={`View on ${txBlockExplorerName || "block explorer"}`}
                                url={txBlockExplorerUrl}
                            />
                        </span>
                    )}
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

export default React.memo(WalletSendFundPendingView);
