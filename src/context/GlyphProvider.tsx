import { useEffect, useMemo, useState } from "react";
import { TooltipProvider } from "../components/ui/tooltip";
import { DEFAULT_STRATEGY, GlyphProviderOptions, StrategyType } from "../types";
import { GlyphUserDataProvider } from "./GlyphUserDataProvider";
import { GlyphViewProvider } from "./GlyphViewProvider";
import EIP1193Strategy from "./strategies/EIP1193Strategy";
import PrivyStrategy from "./strategies/PrivyStrategy";

// const logger = createLogger("GlyphProvider");
// const PrivyStrategy = lazy(() => import("./strategies/PrivyStrategy"));
// const EIP1193Strategy = lazy(() => import("./strategies/EIP1193Strategy"));

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
    const strategyComponents = useMemo(
        () => ({
            [StrategyType.EIP1193]: EIP1193Strategy,
            [StrategyType.PRIVY]: PrivyStrategy // default strategy
        }),
        []
    );

    const [currentStrategy, setCurrentStrategy] = useState<StrategyType>(strategy);

    // logger.debug("strategy", currentStrategy);
    useEffect(() => {
        if (strategy && Object.values(StrategyType).includes(strategy)) {
            setCurrentStrategy(strategy);
        } else {
            setCurrentStrategy(DEFAULT_STRATEGY);
        }
    }, [strategy]);

    const ContextStrategy = useMemo(() => strategyComponents[currentStrategy], [currentStrategy, strategyComponents]);

    return (
        <ContextStrategy glyphUrl={glyphUrl?.trim?.()} {...props}>
            <GlyphUserDataProvider>
                <GlyphViewProvider>
                    <TooltipProvider>{children}</TooltipProvider>
                </GlyphViewProvider>
            </GlyphUserDataProvider>
        </ContextStrategy>
    );
};
