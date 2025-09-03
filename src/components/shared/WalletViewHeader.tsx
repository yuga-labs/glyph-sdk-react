import { ChevronDown, X } from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";
import truncateEthAddress from "truncate-eth-address";
import { Chain } from "viem";
import { useChainId, useChains, useSwitchChain } from "wagmi";
import BackIcon from "../../assets/svg/BackIcon";
import Ellipse from "../../assets/svg/Ellipse";
import { useGlyph } from "../../hooks/useGlyph";
import { CHAIN_ICONS, IS_TESTNET_CHAIN, TESTNET_CSS_CLASS } from "../../lib/constants";
import { cn } from "../../lib/utils";
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

const WalletViewHeader = ({ fullScreenHeader, onProfileClick }: WalletViewHeaderProps) => {
    const { user, hasBalances } = useGlyph();
    const chainId = useChainId();
    const { switchChain } = useSwitchChain();
    const chains = useChains();
    const [sortedChains, setSortedChains] = useState<Chain[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const isTestnet = IS_TESTNET_CHAIN.get(chainId) || false;
    const ChainIcon = CHAIN_ICONS[chainId] || Ellipse;

    useEffect(() => {
        setSortedChains(chains.slice().sort((a, b) => (a.id === chainId ? -1 : 1) - (b.id === chainId ? -1 : 1)));
    }, [chains, chainId]);

    // close chain selector (dropdown) when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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

                {/* Chain Selector */}
                {chains?.length === 1 ? (
                    <ChainIcon className={cn("gw-size-8", isTestnet && TESTNET_CSS_CLASS)} />
                ) : (
                    <div className="gw-relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            disabled={!hasBalances}
                            className="gw-rounded-full gw-shadow-buttonMd gw-px-1 gw-py-1 gw-h-auto gw-w-auto gw-min-w-0 !gw-ring-0 gw-flex gw-items-center gw-space-x-1"
                        >
                            <div className="gw-w-8 gw-h-8 gw-rounded-full">
                                <ChainIcon className={cn("gw-size-8", isTestnet && TESTNET_CSS_CLASS)} />
                            </div>
                            <ChevronDown className="gw-size-4 gw-text-gray-500" />
                        </button>

                        {isOpen && (
                            <div className="gw-absolute gw-top-full gw-right-0 gw-mt-1 gw-bg-white gw-rounded-xl gw-shadow-md gw-z-50 gw-min-w-[8rem] gw-overflow-hidden">
                                {sortedChains.map((ch) => {
                                    const isCurrentChain = ch.id === chainId;
                                    const OptionChainIcon = CHAIN_ICONS[ch.id] || Ellipse;
                                    const isTestnetChain = IS_TESTNET_CHAIN.get(ch.id) || false;
                                    return (
                                        <button
                                            key={ch.id}
                                            onClick={() => {
                                                switchChain({ chainId: ch.id });
                                                setIsOpen(false);
                                            }}
                                            disabled={isCurrentChain}
                                            className={cn(
                                                "gw-w-full gw-flex gw-items-center gw-space-x-2 gw-px-1 gw-py-1 gw-text-left",
                                                isCurrentChain ? "gw-bg-green-500/15" : "hover:gw-bg-gray-50"
                                            )}
                                        >
                                            <div className="gw-w-9 gw-h-9 gw-rounded-full gw-p-1">
                                                <OptionChainIcon
                                                    className={cn(
                                                        "gw-size-6 gw-text-white",
                                                        isTestnetChain && TESTNET_CSS_CLASS
                                                    )}
                                                />
                                            </div>
                                            <span className={cn("gw-text-sm", isCurrentChain && "!gw-font-bold")}>
                                                {ch.name}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default memo(WalletViewHeader);
