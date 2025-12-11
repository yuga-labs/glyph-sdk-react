import { AlertTriangle, ChevronDown, FuelIcon } from "lucide-react";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { debounce } from "throttle-debounce";
import truncateEthAddress from "truncate-eth-address";
import { isAddress, zeroAddress } from "viem";
import { RelayAPIToken } from "../../../context/GlyphSwapContext";
import useRelayTokenList from "../../../hooks/useRelayTokenList";
import { CHAIN_NAMES } from "../../../lib/constants";
import { relayClient } from "../../../lib/relay";
import { cn } from "../../../lib/utils";
import { Button } from "../../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Skeleton } from "../../ui/skeleton";
import TooltipElement from "../../ui/tooltip-element";
import { TokenAndChainIcon } from "./TokenAndChainIcon";

const SwapChainAndTokenSelector = ({
    onTokenSelect,
    selectedToken,
    defaultChainId
}: {
    onTokenSelect: (token: RelayAPIToken) => void;
    selectedToken: RelayAPIToken | undefined;
    defaultChainId?: number;
}) => {
    const chains = relayClient.chains || [];
    const chainIds = useMemo(() => chains.map((chain) => chain.id), []);

    const [open, setOpen] = useState<boolean>(false);

    // Chain ID of the current network selected (network selector)
    const [currentChainId, setCurrentChainId] = useState<number | undefined>(defaultChainId);

    const selectedTokenChain = useMemo(() => {
        if (!selectedToken?.chainId) return null;
        return chains.find((chain) => chain.id === selectedToken.chainId);
    }, [selectedToken?.chainId]);

    const [searchTerm, setSearchTerm] = useState<string>("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("");
    const debouncedFunc = useMemo(
        () =>
            debounce(500, (value: string) => {
                setDebouncedSearchTerm(value);
            }),
        []
    );
    const isTermAnAddress = isAddress(debouncedSearchTerm);

    const [currentChain, featuredTokens] = useMemo(() => {
        if (!currentChainId) return [null, []];
        const chain = chains.find((chain) => chain.id === currentChainId);
        const featuredTokens = chain?.featuredTokens || [];
        return [chain, featuredTokens];
    }, [currentChainId]);

    const collisionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        collisionRef.current = document.querySelector(".gw-wallet-container");
    }, []);

    const handleTokenSelect = (token: RelayAPIToken) => {
        onTokenSelect(token);
        setOpen(false);
    };

    const {
        data: tokenList,
        isLoading,
        isError
    } = useRelayTokenList(
        {
            limit: 12, // Same as Relay demo
            depositAddressOnly: false, // for swap
            chainIds: currentChainId ? [currentChainId] : chainIds,
            defaultList: debouncedSearchTerm === "",
            term: !isTermAnAddress ? debouncedSearchTerm : undefined,
            address: isTermAnAddress ? debouncedSearchTerm : undefined
        },
        {}
    );

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen} modal>
                <DialogTrigger asChild>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setOpen(true);
                            // TODO: Logic to open token selector
                        }}
                        className="gw-rounded-full gw-shadow-buttonMd gw-p-1 gw-pr-2 gw-h-12 gw-w-auto gw-min-w-0 !gw-ring-0 gw-flex gw-items-center gw-space-x-1"
                    >
                        {selectedTokenChain && selectedToken ? (
                            <div className="gw-flex gw-items-center gw-gap-1.5">
                                <TokenAndChainIcon
                                    token={{
                                        name: selectedToken.name,
                                        logoUrl: selectedToken.metadata?.logoURI
                                    }}
                                    chain={{
                                        id: selectedTokenChain.id,
                                        name: selectedTokenChain.name,
                                        logoUrl: selectedTokenChain.iconUrl
                                    }}
                                />

                                <span className="gw-flex gw-flex-col gw-items-start gw-justify-between gw-gap-1">
                                    <span className="gw-typography-body1 !gw-leading-none !gw-font-bold gw-inline-block gw-pr-1">
                                        {selectedToken.symbol}
                                    </span>
                                    <span className="gw-typography-caption !gw-leading-none gw-text-brand-gray-500">
                                        {CHAIN_NAMES[selectedTokenChain.id] || selectedTokenChain.displayName}
                                    </span>
                                </span>
                            </div>
                        ) : (
                            <div className="gw-h-8 gw-rounded-full gw-typography-caption gw-flex gw-items-center gw-justify-center gw-text-brand-gray-500 gw-pl-3">
                                Select Token
                            </div>
                        )}
                        <ChevronDown className="gw-size-4 gw-flex-shrink-0 gw-text-gray-500" />
                    </button>
                </DialogTrigger>
                <DialogContent container={collisionRef.current} className="gw-max-h-[calc(100%-1rem)]">
                    <DialogHeader>
                        <DialogTitle>Select Token</DialogTitle>
                        <DialogDescription className="gw-sr-only">Select a token to swap</DialogDescription>
                    </DialogHeader>

                    <div className="gw-flex gw-flex-col gw-gap-4">
                        <Input
                            type="text"
                            placeholder="Search token name or paste address"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                debouncedFunc(e.target.value);
                            }}
                        />

                        {/* Networks */}
                        <div className="gw-flex gw-flex-col gw-gap-2">
                            <div className="gw-typography-body2 gw-text-brand-gray-500">Select Network</div>
                            <div className="gw-flex gw-gap-2 gw-items-center gw-flex-wrap">
                                <Button
                                    size={"icon"}
                                    variant={"outline"}
                                    className={cn("gw-h-10 gw-p-0.5", !currentChainId && "gw-border-primary")}
                                    shadow
                                    onClick={() => setCurrentChainId(undefined)}
                                >
                                    <span className="gw-typography-caption">All</span>
                                </Button>
                                {chains.map((chain) => (
                                    <Button
                                        key={`${chain.id}_networks`}
                                        size={"icon"}
                                        variant={"outline"}
                                        className={cn(
                                            "gw-h-10 gw-p-0.5",
                                            currentChainId === chain.id && "gw-border-primary"
                                        )}
                                        shadow
                                        onClick={() => setCurrentChainId(chain.id)}
                                    >
                                        {chain.iconUrl ? (
                                            <img
                                                src={chain.iconUrl || ""}
                                                alt={CHAIN_NAMES[chain.id] || chain.name}
                                                className="gw-rounded-full gw-size-8"
                                            />
                                        ) : (
                                            <span className="gw-typography-caption">
                                                {CHAIN_NAMES[chain.id] || chain.name}
                                            </span>
                                        )}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Popular Tokens */}
                        {currentChain && featuredTokens && !debouncedSearchTerm && (
                            <div className="gw-flex gw-flex-col gw-gap-1.5">
                                <div className="gw-typography-body2 gw-text-brand-gray-500">Popular Tokens</div>
                                <div className="gw-flex gw-gap-2 gw-items-center gw-flex-wrap">
                                    {featuredTokens?.map((token) => {
                                        const isTokenSelected =
                                            selectedToken?.address === token.address &&
                                            selectedToken?.chainId === currentChainId;
                                        return (
                                            <Button
                                                key={`${token.address}_popular_tokens`}
                                                variant={"outline"}
                                                size="sm"
                                                className={cn(
                                                    "gw-px-1 gw-gap-1",
                                                    isTokenSelected && "gw-border-primary"
                                                )}
                                                shadow
                                                // Since chainId is not available in featuredTokens list, we are using currentChainId of the network selector
                                                onClick={() => handleTokenSelect({ ...token, chainId: currentChainId })}
                                            >
                                                <TokenAndChainIcon
                                                    token={{
                                                        name: token.name,
                                                        logoUrl: token.metadata?.logoURI
                                                    }}
                                                    chain={{
                                                        id: currentChain.id,
                                                        name: currentChain.name,
                                                        logoUrl: currentChain.iconUrl
                                                    }}
                                                    tokenClassName="gw-size-8"
                                                    chainClassName="gw-size-4"
                                                />

                                                <span className="gw-typography-body2 !gw-font-medium gw-inline-block gw-pr-1">
                                                    {token.symbol}
                                                </span>
                                            </Button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Token List */}
                        <div className="gw-flex gw-flex-col gw-gap-2">
                            <div className="gw-typography-body2 gw-text-brand-gray-500">
                                {debouncedSearchTerm ? "Search Results" : "Global 24H Volume"}
                            </div>
                            <div className="gw-grid gw-grid-cols-1 gw-mt-2 gw-min-h-0 gw-overflow-auto">
                                {isLoading ? (
                                    new Array(12).fill(0).map((_, index) => (
                                        <div key={index} className="gw-w-full">
                                            <Skeleton className="gw-flex gw-items-center gw-justify-center gw-h-14" />
                                            {index < 11 && <hr className="gw-my-2 gw-border-muted gw-mx-2" />}
                                        </div>
                                    ))
                                ) : isError ? (
                                    <div className="gw-flex gw-items-center gw-justify-center gw-h-full gw-text-destructive">
                                        <AlertTriangle className="gw-size-5" /> Couldn't fetch the token list
                                    </div>
                                ) : tokenList?.length === 0 ? (
                                    <div className="gw-flex gw-justify-center gw-items-center gw-flex-1 gw-text-brand-gray-500 gw-typography-body2 gw-pr-4">
                                        No tokens found
                                    </div>
                                ) : (
                                    tokenList?.map((token, index) => {
                                        const tokenChain =
                                            currentChain ?? chains.find((chain) => chain.id === token.chainId)!;

                                        const isTokenSelected =
                                            selectedToken?.address === token.address &&
                                            selectedToken?.chainId === tokenChain.id;
                                        return (
                                            <div
                                                tabIndex={0}
                                                role="button"
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        handleTokenSelect(token);
                                                    }
                                                }}
                                                onClick={() => handleTokenSelect(token)}
                                                key={`${tokenChain.id}:${token.address}_token_list`}
                                                className="gw-w-full"
                                            >
                                                <div
                                                    className={cn(
                                                        "gw-flex gw-justify-between gw-items-center gw-w-full gw-p-2 gw-rounded-xl",
                                                        {
                                                            "gw-bg-muted": isTokenSelected
                                                        }
                                                    )}
                                                >
                                                    <div className="gw-flex gw-items-center gw-space-x-3">
                                                        <TokenAndChainIcon
                                                            token={{
                                                                name: token.name,
                                                                logoUrl: token.metadata?.logoURI
                                                            }}
                                                            chain={{
                                                                id: tokenChain.id,
                                                                name: tokenChain.name,
                                                                logoUrl: tokenChain.iconUrl
                                                            }}
                                                        />
                                                        <div className="gw-flex gw-flex-col gw-items-between gw-justify-end">
                                                            <span className="gw-font-medium gw-flex gw-gap-1 gw-items-center">
                                                                <span className="gw-font-medium">{token.symbol}</span>
                                                                {token.metadata?.verified === false && (
                                                                    <TooltipElement
                                                                        side="bottom"
                                                                        align="center"
                                                                        stopPropagation
                                                                        description="Not verified"
                                                                    >
                                                                        <span className="gw-size-[18px] gw-bg-brand-warning gw-rounded-full gw-flex gw-items-center gw-justify-center gw-p-1 gw-text-background">
                                                                            <AlertTriangle />
                                                                        </span>
                                                                    </TooltipElement>
                                                                )}
                                                                {currentChainId && token.address === zeroAddress && (
                                                                    <TooltipElement
                                                                        side="bottom"
                                                                        align="center"
                                                                        stopPropagation
                                                                        description="Gas Token"
                                                                    >
                                                                        <span className="gw-size-[18px] gw-bg-brand-success gw-rounded-full gw-flex gw-items-center gw-justify-center gw-p-1 gw-text-background">
                                                                            <FuelIcon />
                                                                        </span>
                                                                    </TooltipElement>
                                                                )}
                                                            </span>

                                                            <span
                                                                className={`gw-typography-caption gw-text-brand-gray-500    `}
                                                            >
                                                                {CHAIN_NAMES[tokenChain.id] || tokenChain.displayName}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="gw-flex gw-flex-col gw-items-between gw-justify-end gw-h-full">
                                                        <span className="gw-h-5"></span>
                                                        <span className="gw-typography-caption gw-text-brand-gray-500">
                                                            {truncateEthAddress(token.address!)}
                                                        </span>
                                                    </div>
                                                </div>
                                                {index < tokenList.length - 1 && (
                                                    <hr className="gw-my-2 gw-border-muted gw-mx-2" />
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default memo(SwapChainAndTokenSelector);
