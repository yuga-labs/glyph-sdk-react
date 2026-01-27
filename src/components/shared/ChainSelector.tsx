import { ChevronDown, Globe } from "lucide-react";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Chain } from "viem";
import { useChainId, useChains, useSwitchChain } from "wagmi";
import { useGlyph } from "../../hooks/useGlyph";
import { CHAIN_NAMES } from "../../lib/constants";
import { cn, getRelayChainsAndIcons } from "../../lib/utils";
import { Skeleton } from "../ui/skeleton";

const AllNetworkIcon = ({ className }: { className?: string }) => (
    <Globe className={cn("gw-size-6 gw-text-brand-gray-700", className)} />
);

const ChainSelector = memo(() => {
    const { setFetchForAllNetworks, fetchForAllNetworks } = useGlyph();
    const { iconMap: chainIcons } = getRelayChainsAndIcons();

    const chains = useChains();
    const chainId = useChainId();
    const { switchChainAsync } = useSwitchChain();
    const [sortedChains, setSortedChains] = useState<Chain[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const ChainIcon = useMemo(() => {
        if (!fetchForAllNetworks)
            return <img src={chainIcons.get(chainId)} className="gw-size-6 gw-rounded-full gw-object-cover" />;
        return <AllNetworkIcon />;
    }, [chainIcons, chainId, fetchForAllNetworks]);

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

    if (chains?.length === 1) {
        return ChainIcon ?? <Skeleton className="gw-size-6 gw-rounded-full" />;
    }

    return (
        <div className="gw-relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="gw-rounded-full gw-shadow-buttonMd gw-px-0.5 gw-py-0.5 gw-h-auto gw-w-auto gw-min-w-0 !gw-ring-0 gw-flex gw-items-center gw-space-x-1 gw-bg-white"
            >
                <div className="gw-mx-1 gw-my-1">
                    {ChainIcon ?? <Skeleton className="gw-size-6 gw-rounded-full" />}
                </div>
                <ChevronDown className="gw-size-4 gw-text-gray-500" />
            </button>

            {isOpen && (
                <div className="gw-absolute gw-top-full gw-right-0 gw-mt-1 gw-bg-white gw-rounded-xl gw-shadow-md gw-z-50 gw-min-w-[14rem] gw-overflow-hidden">
                    <button
                        key={"All"}
                        onClick={() => {
                            setFetchForAllNetworks(true);
                            setIsOpen(false);
                        }}
                        className={cn(
                            "gw-w-full gw-flex gw-items-center gw-space-x-2 gw-px-1 gw-py-1 gw-text-left",
                            fetchForAllNetworks ? "gw-bg-green-500/15" : "hover:gw-bg-gray-50"
                        )}
                    >
                        <div className="gw-mx-1 gw-my-1">
                            <AllNetworkIcon />
                        </div>
                        <span className={cn("gw-text-sm", fetchForAllNetworks && "!gw-font-bold")}>
                            All Supported Chains
                        </span>
                    </button>
                    {sortedChains.map((ch) => {
                        const isCurrentChain = !fetchForAllNetworks && ch.id === chainId;
                        const chainName = CHAIN_NAMES[ch.id] || ch.name;
                        const chainIconUrl = chainIcons.get(ch.id);
                        const OptionChainIcon = chainIconUrl ? (
                            <img
                                src={chainIconUrl}
                                alt={ch.name}
                                className="gw-size-6 gw-rounded-full gw-object-cover"
                            />
                        ) : (
                            <AllNetworkIcon />
                        );

                        return (
                            <button
                                key={ch.id}
                                onClick={async () => {
                                    setIsOpen(false);
                                    // Switch chain first and then set fetchForAllNetworks to false - otherwise useEffect would fetch balances twice
                                    await switchChainAsync({ chainId: ch.id });
                                    setFetchForAllNetworks(false);
                                }}
                                className={cn(
                                    "gw-w-full gw-flex gw-items-center gw-space-x-2 gw-px-1 gw-py-1 gw-text-left",
                                    isCurrentChain ? "gw-bg-green-500/15" : "hover:gw-bg-gray-50"
                                )}
                            >
                                <div className="gw-mx-1 gw-my-1">{OptionChainIcon}</div>
                                <span className={cn("gw-text-sm", isCurrentChain && "!gw-font-bold")}>
                                    {chainName}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
});

ChainSelector.displayName = "ChainSelector";

export default ChainSelector;
