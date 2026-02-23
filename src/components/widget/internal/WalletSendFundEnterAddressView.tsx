import { memo, useEffect } from "react";
import truncateEthAddress from "truncate-eth-address";
import { checksumAddress, Hex, isAddress } from "viem";
import { CaretDownIcon } from "../../../assets/svg/CaretDownIcon";
import { useGlyph } from "../../../hooks/useGlyph";
import { SendView } from "../../../lib/constants";
import { cn, ethereumAvatar } from "../../../lib/utils";
import UserAvatar from "../../shared/UserAvatar";
import WalletViewHeader from "../../shared/WalletViewHeader";
import { WalletViewTemplate } from "../../shared/WalletViewTemplate";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";

interface WalletSendFundEnterAddressViewProps {
    onBack: () => void;
    setView: (view: SendView) => void;
    setRecipientAddress: (address: string) => void;
    setRecipientAddressError: (error: string) => void;
    recipientAddress: string;
    recipientAddressError: string | null;
}

const WalletSendFundEnterAddressView = ({
    onBack,
    setView,
    setRecipientAddress,
    setRecipientAddressError,
    recipientAddress,
    recipientAddressError
}: WalletSendFundEnterAddressViewProps) => {
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
                    isStickyHeader={true}
                    fullScreenHeader={{
                        title: "Send Funds",
                        onBackClick: onBack
                    }}
                />
            }
            isStickyHeader={true}
            content={
                <div className="gw-p-4 gw-pt-0 gw-h-full gw-flex gw-flex-col">
                    <div>
                        <div className="gw-typography-body2 gw-text-brand-gray-500">From</div>
                        <div
                            className={cn(
                                "gw-rounded-full gw-px-2.5 gw-py-2 gw-mt-3 gw-flex gw-items-center gw-space-x-4 gw-justify-between gw-w-full",
                                "gw-bg-brand-white/40 gw-backdrop-blur-sm gw-border gw-border-brand-white/20 gw-shadow-liquidSm" // liquid glass shadow
                            )}
                        >
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
                            leadingIcon={
                                isAddress(recipientAddress)
                                    ? {
                                          element: (
                                              <UserAvatar
                                                  className="gw-size-10 gw-flex-shrink-0"
                                                  overrideAlt="Recipient Wallet Address PFP"
                                                  overrideUrl={ethereumAvatar(recipientAddress)}
                                              />
                                          ),
                                          className: "gw-justify-center gw-w-14"
                                      }
                                    : undefined
                            }
                            id="recipientAddress"
                            className={cn(
                                "gw-rounded-full gw-border gw-py-4 gw-h-auto gw-mt-3 gw-flex gw-items-center gw-space-x-4 gw-justify-between gw-w-full",
                                isAddress(recipientAddress) && "gw-pl-14"
                            )}
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
                        className="gw-w-full gw-shadow-2xl before:gw-backdrop-blur-sm"
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
            footerClassName="gw-sticky gw-bottom-0 gw-z-10"
            mainFooter={false}
            footerCols={true}
        />
    );
};

export default memo(WalletSendFundEnterAddressView);
