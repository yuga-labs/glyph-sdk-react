import { X } from "lucide-react";
import { memo } from "react";
import { FailureIcon } from "../../../assets/svg/FailureIcon";
import CopyButton from "../../shared/CopyButton";
import { WalletViewTemplate } from "../../shared/WalletViewTemplate";
import { Button } from "../../ui/button";

interface WalletFundFailedViewProps {
    onEnd: () => void;
    onShowActivity: () => void;
    id: string;
}

const WalletFundFailedView: React.FC<WalletFundFailedViewProps> = ({ onEnd, onShowActivity, id }) => {
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
                            <FailureIcon className="gw-size-24" />
                            <span className="gw-mt-7 gw-typography-h4-nr gw-text-center">
                                Transaction
                                <br />
                                failed.
                            </span>
                            <span className="gw-mt-3 gw-text-center gw-whitespace-pre-wrap !gw-leading-tight">
                                {`Your transaction failed.\nPlease try again.`}
                            </span>

                            <div className="gw-my-10 gw-flex gw-p-4 gw-items-center gw-w-full gw-justify-center gw-space-x-2 gw-typography-caption">
                                <span>Transaction ID: </span>
                                <CopyButton
                                    className="!gw-text-foreground"
                                    textToCopy={id}
                                    text={id.slice(0, 20) + "..."}
                                />
                            </div>

                            <Button variant="tertiary" className="gw-w-full" onClick={onShowActivity}>
                                View Activity
                            </Button>
                        </div>
                    </div>
                </div>
            }
        />
    );
};

export default memo(WalletFundFailedView);
