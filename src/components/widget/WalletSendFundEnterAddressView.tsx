import React, { useEffect } from "react";
import truncateEthAddress from "truncate-eth-address";
import { checksumAddress, Hex, isAddress } from "viem";
import { CaretDownIcon } from "../../assets/svg/CaretDownIcon";
import { useGlyph } from "../../hooks/useGlyph";
import { SendView } from "../../lib/constants";
import UserAvatar from "../shared/UserAvatar";
import WalletViewHeader from "../shared/WalletViewHeader";
import { WalletViewTemplate } from "../shared/WalletViewTemplate";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface WalletSendFundEnterAddressViewProps {
    onBack: () => void;
    setView: (view: SendView) => void;
    setRecipientAddress: (address: string) => void;
    setRecipientAddressError: (error: string) => void;
    recipientAddress: string;
    recipientAddressError: string | null;
}

const WalletSendFundEnterAddressView: React.FC<WalletSendFundEnterAddressViewProps> = ({
    onBack,
    setView,
    setRecipientAddress,
    setRecipientAddressError,
    recipientAddress,
    recipientAddressError
}) => {
    const { user } = useGlyph();

    useEffect(() => {
        if (recipientAddressError) return;
        if (!recipientAddress) return;

        if (!isAddress(recipientAddress, { strict: false }))
            setRecipientAddressError("Please enter a valid recipient wallet address");
    }, [recipientAddress, recipientAddressError, setRecipientAddressError]);

    return (
        <WalletViewTemplate
            header={
                <WalletViewHeader
                    fullScreenHeader={{
                        title: "Send Funds",
                        onBackClick: onBack
                    }}
                />
            }
            content={
                <div className="gw-p-4 gw-h-full gw-flex gw-flex-col">
                    <div>
                        <div className="gw-typography-body2 gw-text-brand-gray-500">From</div>
                        <div className="gw-rounded-full gw-shadow-buttonMd gw-px-2.5 gw-py-2 gw-mt-3 gw-flex gw-items-center gw-space-x-4 gw-justify-between gw-w-full">
                            <div className="gw-flex gw-items-center gw-space-x-4 gw-justify-between">
                                <UserAvatar className="gw-size-11" />

                                <div className="gw-flex gw-flex-col">
                                    <div className="gw-mt-1.5 gw-typography-subtitle1 gw-text-left">{user?.name}</div>
                                    <div className="gw-typography-body2 gw-text-brand-gray-500">
                                        {truncateEthAddress(user?.evmWallet || "")}
                                    </div>
                                </div>

                                <div />
                            </div>
                        </div>
                    </div>

                    <div className="gw-flex gw-flex-col gw-items-center gw-justify-center gw-text-primary gw-my-6 gw-relative gw-z-10">
                        <CaretDownIcon className="gw-w-5 gw-opacity-50" />
                        <CaretDownIcon className="gw-w-5" />
                    </div>

                    <div>
                        <Input
                            label={{
                                htmlFor: "recipientAddress",
                                value: "To"
                            }}
                            id="recipientAddress"
                            className="gw-rounded-full gw-border gw-py-3 gw-mt-3 gw-flex gw-items-center gw-space-x-4 gw-justify-between gw-w-full"
                            placeholder="Enter recipient wallet address"
                            value={recipientAddress}
                            onChange={(e) => {
                                setRecipientAddress(e.target.value);
                                if (!e.target.value) return setRecipientAddressError("");

                                if (!isAddress(e.target.value, { strict: false }))
                                    return setRecipientAddressError("Please enter a valid wallet address");

                                if (
                                    user?.evmWallet &&
                                    checksumAddress(e.target.value as Hex) === checksumAddress(user?.evmWallet as Hex)
                                )
                                    return setRecipientAddressError("You cannot send funds to your own wallet");

                                setRecipientAddressError("");
                            }}
                            supportingText={{
                                value: recipientAddressError || "",
                                isError: !!recipientAddressError,
                                className: "gw-ml-2"
                            }}
                        />
                    </div>
                </div>
            }
            footer={
                <>
                    <Button
                        variant={"tertiary"}
                        className="gw-w-full gw-mt-4"
                        disabled={!recipientAddress || !!recipientAddressError}
                        onClick={() => {
                            setRecipientAddress(checksumAddress(recipientAddress as Hex));
                            setView(SendView.ENTER_AMOUNT);
                        }}
                    >
                        Continue
                    </Button>
                </>
            }
            mainFooter={false}
            footerCols={true}
        />
    );
};

export default React.memo(WalletSendFundEnterAddressView);
