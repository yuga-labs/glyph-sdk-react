import { X } from "lucide-react";
import { memo } from "react";
import truncateEthAddress from "truncate-eth-address";
import { CaretDownIcon } from "../../../assets/svg/CaretDownIcon";
import { SuccessIcon } from "../../../assets/svg/SuccessIcon";
import { useGlyph } from "../../../hooks/useGlyph";
import { ethereumAvatar } from "../../../lib/utils";
import UserAvatar from "../../shared/UserAvatar";
import { WalletViewTemplate } from "../../shared/WalletViewTemplate";
import { Button } from "../../ui/button";
import { SendFundQuote } from "../WalletSendFundView";

interface WalletSendFundSuccessViewProps {
    onEnd: () => void;
    onShowActivity: () => void;
    quote: SendFundQuote;
    tokenSymbol: string;
}

const WalletSendFundSuccessView: React.FC<WalletSendFundSuccessViewProps> = ({
    onEnd,
    onShowActivity,
    quote,
    tokenSymbol
}) => {
    const { user } = useGlyph();

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
                                {`${quote.receivable_amount_in_token} ${tokenSymbol} have been successfully\nsent to ${truncateEthAddress(quote.receiver_address)}`}
                            </span>

                            <div className="gw-my-10 gw-rounded-2xl gw-bg-brand-white dark:gw-bg-brand-black gw-drop-shadow-buttonLg gw-flex gw-p-4 gw-items-center gw-space-x-2 gw-w-full gw-justify-between">
                                <div className="gw-flex gw-gap-2 gw-items-center">
                                    <UserAvatar className="gw-size-6 gw-flex-shrink-0" />
                                    <div className="gw-flex gw-flex-col gw-typography-caption">
                                        <span className="gw-text-brand-gray-500">From</span>
                                        <span className="gw-break-all">
                                            {user?.name || truncateEthAddress(user?.evmWallet || "")}
                                        </span>
                                    </div>
                                </div>
                                <div className="gw-flex gw-items-center gw-justify-center gw-text-brand-success gw-relative gw-z-10">
                                    <CaretDownIcon className="gw-w-3 -gw-rotate-90 gw-opacity-50" />
                                    <CaretDownIcon className="gw-w-3 -gw-ml-1 -gw-rotate-90" />
                                </div>
                                <div className="gw-flex gw-gap-2 gw-items-center gw-min-w-24">
                                    <UserAvatar
                                        className="gw-size-6 gw-flex-shrink-0"
                                        overrideAlt="Recipient Wallet Address PFP"
                                        overrideUrl={ethereumAvatar(quote.receiver_address)}
                                    />
                                    <div className="gw-flex gw-flex-col gw-typography-caption">
                                        <span className="gw-text-brand-gray-500">To</span>
                                        <span className="gw-break-all">
                                            {truncateEthAddress(quote.receiver_address)}
                                        </span>
                                    </div>
                                </div>
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
