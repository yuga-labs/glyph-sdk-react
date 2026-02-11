import { useState } from "react";
import { WalletMainViewTab } from "../../../lib/constants";
import { cn } from "../../../lib/utils";

export function WalletTokenVSNftSwitcher({
    activeTab,
    setActiveTab
}: {
    activeTab: WalletMainViewTab;
    setActiveTab: (tab: WalletMainViewTab) => void;
}) {
    const [isAnimating, setIsAnimating] = useState(false);

    const handleTabChange = (tab: WalletMainViewTab) => {
        setIsAnimating(true);
        setActiveTab(tab);
        setTimeout(() => setIsAnimating(false), 300);
    };
    return (
        <div className="gw-mx-auto gw-w-fit gw-relative gw-z-0 gw-my-2">
            <div className="gw-mx-auto gw-w-fit gw-rounded-full gw-bg-brand-clay">
                <div className="gw-flex">
                    <div className="gw-flex-1 gw-px-2 gw-py-1 gw-relative gw-z-20 gw-min-w-[60px]">
                        <button
                            onClick={() => handleTabChange(WalletMainViewTab.TOKENS)}
                            className={cn(
                                activeTab === WalletMainViewTab.TOKENS ? "gw-text-background" : "",
                                "gw-px-2 gw-w-full gw-text-center gw-justify-center gw-flex gw-items-center gw-transition-colors gw-delay-75 gw-duration-300"
                            )}
                        >
                            Tokens
                        </button>
                    </div>

                    <div className="gw-flex-1 gw-px-2 gw-py-1 gw-relative gw-z-20 gw-min-w-[60px]">
                        <button
                            onClick={() => handleTabChange(WalletMainViewTab.NFTS)}
                            className={cn(
                                activeTab === WalletMainViewTab.NFTS ? "gw-text-background" : "",
                                "gw-px-2 gw-w-full gw-text-center gw-justify-center gw-flex gw-items-center gw-transition-colors gw-delay-75 gw-duration-300"
                            )}
                        >
                            NFTs
                        </button>
                    </div>
                </div>
            </div>
            <div
                className={cn(
                    "gw-absolute gw-bottom-0 gw-left-0 gw-h-full gw-rounded-full gw-right-0 gw-w-1/2 gw-bg-foreground gw-z-10 gw-transition-all gw-duration-300 gw-ease-in-out",
                    activeTab === WalletMainViewTab.NFTS ? "gw-left-1/2" : "",
                    isAnimating ? "gw-scale-110" : ""
                )}
            />
        </div>
    );
}
