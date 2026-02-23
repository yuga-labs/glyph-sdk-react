import { X } from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";
import truncateEthAddress from "truncate-eth-address";
import BackIcon from "../../assets/svg/BackIcon";
import { useGlyph } from "../../hooks/useGlyph";
import { cn } from "../../lib/utils";
import ChainSelector from "./ChainSelector";
import CopyButton from "./CopyButton";
import UserAvatar from "./UserAvatar";

interface WalletViewHeaderProps {
    fullScreenHeader?: {
        title?: string;
        onBackClick?: () => void;
        onCloseClick?: () => void;
    };
    onProfileClick?: () => void;
    isStickyHeader: boolean;
}

const WalletViewHeader = ({ fullScreenHeader, onProfileClick, isStickyHeader }: WalletViewHeaderProps) => {
    const { user } = useGlyph();

    const headerRef = useRef<HTMLDivElement>(null);
    const [isStuck, setIsStuck] = useState(false);

    // Detect when header is stuck by checking if content has scrolled past header
    useEffect(() => {
        if (!isStickyHeader) return;

        if (!fullScreenHeader?.title) return;

        const headerElement = headerRef.current;
        if (!headerElement) return;

        // Find the scrolling container (gw-wallet-view) and content area
        const scrollContainer = headerElement.closest(".gw-wallet-view") as HTMLElement;
        const contentArea = scrollContainer?.querySelector(".gw-wallet-content") as HTMLElement;
        if (!scrollContainer || !contentArea) return;

        // Get the initial offset - how far the header is from the top of the scroll container
        const headerWrapper = headerElement.closest(".gw-wallet-header") as HTMLElement;
        const initialHeaderOffset = headerWrapper ? headerWrapper.offsetTop : 0;

        const checkStuck = () => {
            const scrollTop = scrollContainer.scrollTop;

            // Header is stuck when we've scrolled past the header's original position
            const isCurrentlyStuck = scrollTop > initialHeaderOffset;
            setIsStuck(isCurrentlyStuck);
        };

        // Check initially
        checkStuck();

        // Check on scroll
        scrollContainer.addEventListener("scroll", checkStuck, { passive: true });

        return () => {
            scrollContainer.removeEventListener("scroll", checkStuck);
        };
    }, [fullScreenHeader?.title, isStickyHeader]);

    return fullScreenHeader && fullScreenHeader?.title ? (
        <>
            <div ref={headerRef} className="gw-flex gw-items-center gw-space-x-4 gw-justify-between gw-w-full">
                <div className="gw-size-12">
                    {fullScreenHeader?.onBackClick ? (
                        <button
                            className={cn("gw-size-full gw-inline-flex gw-items-center")}
                            onClick={fullScreenHeader?.onBackClick}
                        >
                            <span
                                className={cn(
                                    "gw-transition-all gw-duration-300",
                                    isStuck
                                        ? "gw-px-1 gw-py-1 gw-bg-white/40 gw-backdrop-blur-sm gw-border gw-border-brand-white/20 gw-shadow-liquidSm gw-rounded-full"
                                        : "gw-border-transparent gw-shadow-none"
                                )}
                            >
                                <BackIcon
                                    className={cn("gw-transition-all", isStuck ? "gw-w-5 gw-h-5" : "gw-w-6 gw-h-6")}
                                />
                            </span>
                        </button>
                    ) : null}
                </div>
                <div
                    className={cn(
                        "gw-transition-all gw-duration-300",
                        isStuck
                            ? "gw-px-2 gw-py-1 gw-bg-white/40 gw-backdrop-blur-sm gw-border gw-border-brand-white/20 gw-shadow-liquidSm gw-rounded-full gw-typography-body2"
                            : "gw-typography-subtitle1 gw-border-transparent gw-shadow-none"
                    )}
                >
                    {fullScreenHeader.title}
                </div>
                <div className="gw-size-12">
                    {fullScreenHeader?.onCloseClick ? (
                        <button
                            className={cn("gw-size-full gw-inline-flex gw-items-center")}
                            onClick={fullScreenHeader?.onCloseClick}
                        >
                            <span
                                className={cn(
                                    "gw-transition-all gw-duration-300",
                                    isStuck
                                        ? "gw-px-1 gw-py-1 gw-bg-white/40 gw-backdrop-blur-sm gw-border gw-border-brand-white/20 gw-shadow-liquidSm gw-rounded-full"
                                        : "gw-border-transparent gw-shadow-none"
                                )}
                            >
                                <X className={cn("gw-transition-all", isStuck ? "gw-w-5 gw-h-5" : "gw-w-6 gw-h-6")} />
                            </span>
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

                {/* Chain Selector */}
                <ChainSelector />
            </div>
        </>
    );
};

export default memo(WalletViewHeader);
