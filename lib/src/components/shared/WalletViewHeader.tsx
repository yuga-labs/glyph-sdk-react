import { X } from "lucide-react";
import React from "react";
import truncateEthAddress from "truncate-eth-address";
import ApechainIcon from "../../assets/svg/ApechainIcon";
import BackIcon from "../../assets/svg/BackIcon";
import { useGlyph } from "../../hooks/useGlyph";
import CopyButton from "./CopyButton";
import UserAvatar from "./UserAvatar";

interface WalletViewHeaderProps {
    fullScreenHeader?: {
        title?: string;
        onBackClick?: () => void;
        onCloseClick?: () => void;
    };
    onProfileClick?: () => void;
}

const WalletViewHeader: React.FC<WalletViewHeaderProps> = ({ fullScreenHeader, onProfileClick }) => {
    const { user } = useGlyph();

    return fullScreenHeader && fullScreenHeader?.title ? (
        <>
            <div className="gw-flex gw-items-center gw-space-x-4 gw-justify-between gw-w-full">
                <div className="gw-size-12">
                    {fullScreenHeader?.onBackClick ? (
                        <button
                            className="gw-size-full gw-inline-flex gw-justify-center gw-items-center"
                            onClick={fullScreenHeader?.onBackClick}
                        >
                            <BackIcon className="gw-size-6" />
                        </button>
                    ) : null}
                </div>
                <div className="gw-typography-subtitle1">{fullScreenHeader.title}</div>
                <div className="gw-size-12">
                    {fullScreenHeader?.onCloseClick ? (
                        <button
                            className="gw-size-full gw-inline-flex gw-justify-center gw-items-center"
                            onClick={fullScreenHeader?.onCloseClick}
                        >
                            <X className="gw-size-6" />
                        </button>
                    ) : null}
                </div>
            </div>
        </>
    ) : (
        <>
            <div className="gw-flex gw-items-center gw-space-x-4 gw-justify-between gw-w-full">
                <div className="gw-flex gw-items-center gw-space-x-4 gw-justify-between">
                    <button onClick={onProfileClick} disabled={!user?.hasProfile}>
                        <UserAvatar className="gw-size-12" />
                    </button>

                    <div className="gw-flex gw-flex-col">
                        <button onClick={onProfileClick} disabled={!user?.hasProfile}>
                            <div className="gw-mt-1.5 gw-typography-subtitle1 gw-text-left">{user?.name}</div>
                        </button>
                        <div>
                            <CopyButton
                                textClassName="gw-max-w-56 gw-break-all gw-typography-body2"
                                text={truncateEthAddress(user!.evmWallet)}
                                textToCopy={user!.evmWallet}
                            />
                        </div>
                    </div>
                </div>

                <ApechainIcon className="gw-size-9" />
            </div>
        </>
    );
};

export default React.memo(WalletViewHeader);
