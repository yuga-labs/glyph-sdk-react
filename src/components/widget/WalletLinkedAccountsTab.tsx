import { useEffect, useRef, useState } from "react";
import truncateEthAddress from "truncate-eth-address";
import { PlusSign } from "../../assets/svg/PlusSign";
import { useGlyph } from "../../hooks/useGlyph";
import { cn } from "../../lib/utils";
import CopyButton from "../shared/CopyButton";
import { Button } from "../ui/button";
import TooltipElement from "../ui/tooltip-element";

export function WalletLinkedAccountsTab() {
    const { user, glyphUrl } = useGlyph();
    const profileUrl = new URL("/profile", glyphUrl).toString();

    const sentinelRef = useRef<HTMLDivElement>(null);
    const [isStuck, setIsStuck] = useState(false);

    // Detect when sticky element is stuck using a sentinel element
    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                // When sentinel is not intersecting (scrolled past), sticky element is stuck
                setIsStuck(!entry.isIntersecting);
            },
            {
                root: null,
                rootMargin: "0px",
                threshold: 0
            }
        );

        observer.observe(sentinel);

        return () => {
            observer.disconnect();
        };
    }, []);

    return (
        <div className="gw-p-4 gw-flex gw-flex-col gw-justify-between gw-min-h-full gw-relative">
            <div>
                {/* Sentinel element to detect when sticky is stuck */}
                <div ref={sentinelRef} className="gw-absolute gw-top-4" />
                <div
                    className={cn(
                        "gw-sticky gw-inline-block gw-z-10 gw-top-4 gw-transition-all gw-duration-300",
                        isStuck
                            ? "gw-px-2 gw-py-1 gw-bg-white/20 gw-backdrop-blur-sm gw-border gw-border-brand-white/20 gw-shadow-liquid gw-rounded-full gw-typography-body2 gw-left-1/2 -gw-translate-x-1/2"
                            : "gw-typography-body1 gw-left-0 gw-translate-x-0 gw-border-transparent gw-shadow-none"
                    )}
                >
                    My Wallets
                </div>

                <div className="gw-absolute gw-top-4 gw-right-4">
                    <TooltipElement
                        stopPropagation
                        description="Your standard crypto wallet for storing assets, sending, and receiving funds."
                        side="left"
                        align="center"
                    />
                </div>

                {/* Show Glyph wallet */}
                {user?.hasProfile && (
                    <div className="gw-flex gw-items-center gw-w-full gw-mt-3">
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
