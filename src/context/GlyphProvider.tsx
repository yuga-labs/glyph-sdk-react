import { lazy, useEffect, useMemo, useState } from "react";
import { useConfig } from "wagmi";
import { TooltipProvider } from "../components/ui/tooltip";
import { relayClient } from "../lib/relay";
import { DEFAULT_STRATEGY, GlyphProviderOptions, StrategyType } from "../types";
import { GlyphSwapProvider } from "./GlyphSwapProvider";
import { GlyphUserDataProvider } from "./GlyphUserDataProvider";
import { GlyphViewProvider } from "./GlyphViewProvider";

const PrivyStrategy = lazy(() => import("./strategies/PrivyStrategy"));
const EIP1193Strategy = lazy(() => import("./strategies/EIP1193Strategy"));

/**
 * A react provider that provides the GlyphContext to its children.
 *
 * See more at: {@link https://docs.useglyph.io/reference/components/GlyphProvider/}
 */
export const GlyphProvider = ({
    children,
    strategy = DEFAULT_STRATEGY,
    glyphUrl,
    useStagingTenant,
    ...props
}: GlyphProviderOptions) => {
    const wagmiConfig = useConfig();

    useEffect(() => {
        if (wagmiConfig.chains) {
            const relayChainIds = new Set(relayClient.chains.map((c: any) => c.id));
            const wagmiChainIds = new Set(wagmiConfig.chains.map((c) => c.id));

            // Relay networks must remain available for swaps. Only additional
            // explicitly configured testnets may bypass the equality check.
            const missingRelayChain = [...relayChainIds].some((id) => !wagmiChainIds.has(id));
            const extraChain = wagmiConfig.chains.some(
                (chain) => !relayChainIds.has(chain.id) && chain.testnet !== true
            );
            if (missingRelayChain || extraChain) {
                throw new Error(
                    "Chain mismatch detected. Please use `useGlyphConfigureDynamicChains` from `@use-glyph/sdk-react` to configure chains dynamically."
                );
            }
        }
    }, [wagmiConfig.chains, relayClient.chains]);

    const strategyComponents = useMemo(
        () => ({
            [StrategyType.EIP1193]: EIP1193Strategy,
            [StrategyType.PRIVY]: PrivyStrategy // default strategy
        }),
        []
    );

    const [currentStrategy, setCurrentStrategy] = useState<StrategyType>(strategy);

    useEffect(() => {
        if (strategy && Object.values(StrategyType).includes(strategy)) {
            setCurrentStrategy(strategy);
        } else {
            setCurrentStrategy(DEFAULT_STRATEGY);
        }
    }, [strategy]);

    const ContextStrategy = useMemo(() => strategyComponents[currentStrategy], [currentStrategy, strategyComponents]);

    return (
        <ContextStrategy glyphUrl={glyphUrl?.trim?.()} useStagingTenant={useStagingTenant} {...props}>
            <GlyphUserDataProvider>
                <GlyphSwapProvider>
                    <GlyphViewProvider>
                        <TooltipProvider>{children}</TooltipProvider>
                    </GlyphViewProvider>
                </GlyphSwapProvider>
            </GlyphUserDataProvider>
        </ContextStrategy>
    );
};
