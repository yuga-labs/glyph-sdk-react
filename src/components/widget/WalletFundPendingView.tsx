import React from "react";
import truncateEthAddress from "truncate-eth-address";
import ApecoinIcon from "../../assets/svg/ApecoinIcon";
import { CaretDownIcon } from "../../assets/svg/CaretDownIcon";
import LoadingCircleIcon from "../../assets/svg/LoadingCircleIcon.";
import { useGlyph } from "../../hooks/useGlyph";
import CopyButton from "../shared/CopyButton";
import UserAvatar from "../shared/UserAvatar";
import WalletViewHeader from "../shared/WalletViewHeader";
import { WalletViewTemplate } from "../shared/WalletViewTemplate";
import { Button } from "../ui/button";

interface WalletFundPendingViewProps {
    onBack: () => void;
    id: string;
    value: number;
}

const WalletFundPendingView: React.FC<WalletFundPendingViewProps> = ({ onBack, id, value }) => {
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
                    <h6>Finalizing Purchase</h6>
                    <div className="gw-mt-4 gw-typography-caption gw-flex gw-justify-between gw-items-center">
                        <span>Estimated wait time:</span>
                        <span className="gw-text-brand-gray-500">1-5 mins</span>
                    </div>

                    <div className="gw-mt-4 gw-flex gw-justify-center gw-items-center">
                        <div className="gw-rounded-full gw-flex gw-flex-col gw-items-center gw-justify-center gw-p-10 gw-relative gw-size-64 gw-overflow-hidden gw-bg-white dark:gw-bg-black">
                            <LoadingCircleIcon className="gw-absolute gw-inset-0 gw-animate-spin gw-size-64 gw-z-0" />

                            <div className="gw-flex gw-items-center gw-justify-center gw-relative gw-z-10">
                                <ApecoinIcon className="gw-size-8" />

                                <div className="gw-typography-h6 gw-ml-3">
                                    <span>{value}</span> <span className="gw-text-brand-gray-500">APE</span>
                                </div>
                            </div>

                            <div className="gw-my-4 gw-flex gw-flex-col gw-items-center gw-justify-center gw-text-brand-success gw-relative gw-z-10">
                                <CaretDownIcon className="gw-animate-pulse gw-w-4" />
                                <CaretDownIcon className="gw-animate-pulse gw-delay-300 gw-w-4" />
                                <CaretDownIcon className="gw-animate-pulse gw-delay-600 gw-w-4" />
                            </div>

                            <div className="gw-flex gw-items-center gw-space-x-3 gw-justify-between gw-relative gw-z-10">
                                <UserAvatar className="gw-size-8" />

                                <div className="gw-flex gw-flex-col gw-typography-body2">
                                    <div className="">{user?.name}</div>
                                    <div className="gw-text-brand-gray-600">{truncateEthAddress(user!.evmWallet)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            }
            footer={
                <>
                    <span className="gw-inline-flex gw-items-center gw-space-x-2 gw-typography-caption gw-text-brand-gray-500">
                        <span>Transaction ID: </span>
                        <CopyButton textToCopy={id} text={id.slice(0, 20) + "..."} />
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

export default React.memo(WalletFundPendingView);
