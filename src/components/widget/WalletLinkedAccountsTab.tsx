import truncateEthAddress from "truncate-eth-address";
import { PlusSign } from "../../assets/svg/PlusSign";
import { useGlyph } from "../../hooks/useGlyph";
import CopyButton from "../shared/CopyButton";
import { Button } from "../ui/button";
import TooltipElement from "../ui/tooltip-element";

export function WalletLinkedAccountsTab() {
    const { user, glyphUrl } = useGlyph();
    const profileUrl = new URL("/profile", glyphUrl).toString();

    return (
        <div className="gw-p-4 gw-flex gw-flex-col gw-justify-between gw-min-h-full">
            <div>
                <div className="gw-mb-6 gw-flex gw-items-center gw-justify-between">
                    <h6>Wallets</h6>
                    <TooltipElement
                        stopPropagation
                        description="Your standard crypto wallet for storing assets, sending, and receiving funds."
                        side="left"
                        align="center"
                    />
                </div>

                {/* Show Glyph wallet */}
                {user?.hasProfile && (
                    <div className="gw-flex gw-items-center gw-w-full">
                        <div className="gw-flex gw-items-start">
                            <div className="gw-typography-body1">
                                <div className="gw-font-medium">Main Wallet</div>
                                <div className="gw-text-brand-gray-500 gw-typography-caption">
                                    {truncateEthAddress(user.evmWallet)}
                                </div>
                            </div>
                        </div>
                        <CopyButton
                            text=""
                            textToCopy={user.evmWallet}
                            className="gw-ml-auto"
                            iconClassName="gw-size-5"
                        />
                    </div>
                )}
                {/* Show smart wallet */}
                {/* {user?.smartWallet && (
                    <div className="gw-flex gw-items-center gw-w-full gw-mt-2">
                        <div className="gw-flex gw-items-center">
                            <GlyphIcon className="gw-size-8 gw-text-primary" />
                            <div className="gw-ml-4 gw-typography-body2">
                                <div>Smart Wallet</div>
                                <div className="gw-text-brand-gray-500">{truncateEthAddress(user.smartWallet)}</div>
                            </div>
                        </div>
                        <CopyButton
                            text=""
                            textToCopy={user.smartWallet}
                            className="gw-ml-auto"
                            iconClassName="gw-size-5"
                        />
                    </div>
                )} */}

                <hr className="gw-my-5 gw-border-muted" />

                <div className="gw-mb-6 gw-flex gw-items-center gw-justify-between">
                    <span>Linked Wallets</span>
                    <TooltipElement
                        stopPropagation
                        description={
                            "Prove token ownership across multiple wallets, access gated content, and manage assets without transfers."
                        }
                        side="left"
                        align="center"
                    />
                </div>

                {/* Show linked wallets */}
                {user?.linkedWallets?.length ? (
                    user?.linkedWallets?.map?.((wallet) => (
                        <div key={wallet.address} className="gw-flex gw-items-center gw-w-full gw-mt-2">
                            <div className="gw-flex gw-items-center">
                                <div className="gw-flex gw-items-start">
                                    <div className="gw-typography-body1">
                                        <div className="gw-font-medium gw-capitalize">
                                            {wallet.walletClientType?.split?.("_")?.join?.(" ") || "External Wallet"}
                                        </div>
                                        <div className="gw-text-brand-gray-500 gw-typography-caption">
                                            {truncateEthAddress(wallet.address)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <CopyButton
                                text=""
                                textToCopy={wallet.address}
                                className="gw-ml-auto"
                                iconClassName="gw-size-5"
                            />
                        </div>
                    ))
                ) : (
                    <div className="gw-flex gw-items-center gw-justify-center gw-w-full gw-text-center gw-my-8 gw-text-brand-gray-500 gw-typography-body2">
                        To link an existing wallet or
                        <br />
                        account, please go to the
                        <br />
                        Glyph Dashboard.
                    </div>
                )}
            </div>

            <Button
                className="gw-w-full gw-mt-5"
                onClick={() => {
                    window.open(`${profileUrl}?linkAccounts=true`, "_blank");
                }}
                variant={"link"}
            >
                <PlusSign className="!gw-size-3 gw-mr-1" />
                Link Wallet or Account
            </Button>
        </div>
    );
}
