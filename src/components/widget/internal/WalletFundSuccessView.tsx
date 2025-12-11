import { X } from "lucide-react";
import { memo } from "react";
import truncateEthAddress from "truncate-eth-address";
import { CaretDownIcon } from "../../../assets/svg/CaretDownIcon";
import { SuccessIcon } from "../../../assets/svg/SuccessIcon";
import { useGlyph } from "../../../hooks/useGlyph";
import UserAvatar from "../../shared/UserAvatar";
import { WalletViewTemplate } from "../../shared/WalletViewTemplate";
import { Button } from "../../ui/button";
import NativeTokenIcon from "../../shared/NativeTokenIcon";

interface WalletFundSuccessViewProps {
    onEnd: () => void;
    onShowActivity: () => void;
    value: number;
}

const WalletFundSuccessView: React.FC<WalletFundSuccessViewProps> = ({ onEnd, onShowActivity, value }) => {
    const { user, nativeSymbol } = useGlyph();

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
                                {`Your account has been\nsuccessfully funded!`}
                            </span>

                            <div className="gw-my-10 gw-rounded-2xl gw-bg-background gw-drop-shadow-buttonLg gw-flex gw-p-4 gw-items-center gw-space-x-3 gw-w-full gw-justify-center">
                                <NativeTokenIcon className="gw-size-6 gw-flex-shrink-0" />
                                <div className="gw-typography-body2">
                                    <span>
                                        {value} {nativeSymbol}
                                    </span>
                                </div>
                                <div className="gw-flex gw-items-center gw-justify-center gw-text-brand-success gw-relative gw-z-10">
                                    <CaretDownIcon className="gw-w-3 -gw-rotate-90 gw-opacity-50" />
                                    <CaretDownIcon className="gw-w-3 -gw-ml-1 -gw-rotate-90" />
                                </div>
                                <UserAvatar className="gw-size-6 gw-flex-shrink-0" />
                                <span className="gw-break-all gw-typography-body2">
                                    {truncateEthAddress(user!.evmWallet)}
                                </span>
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

export default memo(WalletFundSuccessView);
