import { FC, lazy, memo, Suspense, useEffect, useMemo, useState } from "react";
import { TooltipProvider } from "../components/ui/tooltip";
import { createLogger } from "../lib/utils";
import { DEFAULT_STRATEGY, GlyphProviderOptions, StrategyType } from "../types";
import { GlyphUserDataProvider } from "./GlyphUserDataProvider";
import { GlyphViewProvider } from "./GlyphViewProvider";
import LoadingStrategy from "./strategies/LoadingStrategy";

const logger = createLogger("GlyphProvider");
const PrivyStrategy = lazy(() => import("./strategies/PrivyStrategy"));
const EIP1193Strategy = lazy(() => import("./strategies/EIP1193Strategy"));

/**
 * A react provider that provides the GlyphContext to its children.
 *
 * See more at: {@link https://docs.useglyph.io/reference/components/GlyphProvider/}
 */
export const GlyphProvider: FC<GlyphProviderOptions> = memo(
    ({ children, strategy = DEFAULT_STRATEGY, glyphUrl, useStagingTenant, ...props }) => {
        const strategyComponents = useMemo(
            () => ({
                [StrategyType.EIP1193]: EIP1193Strategy,
                [StrategyType.PRIVY]: PrivyStrategy // default strategy
            }),
            []
        );

        const [currentStrategy, setCurrentStrategy] = useState<StrategyType>(strategy);

        logger.debug("strategy", currentStrategy);
        useEffect(() => {
            if (strategy && Object.values(StrategyType).includes(strategy)) {
                setCurrentStrategy(strategy);
            } else {
                setCurrentStrategy(DEFAULT_STRATEGY);
            }
        }, [strategy]);

        const ContextStrategy = useMemo(
            () => strategyComponents[currentStrategy],
            [currentStrategy, strategyComponents]
        );

        return (
            <Suspense fallback={<LoadingStrategy children />}>
                <ContextStrategy glyphUrl={glyphUrl?.trim?.()} {...props}>
                    <GlyphUserDataProvider>
                        <GlyphViewProvider>
                            <TooltipProvider>{children}</TooltipProvider>
                        </GlyphViewProvider>
                    </GlyphUserDataProvider>
                </ContextStrategy>
            </Suspense>
        );
    }
);
