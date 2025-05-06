import { FC, lazy, memo, Suspense, useEffect, useMemo, useState } from "react";
import { TooltipProvider } from "../components/ui/tooltip";
import { createLogger } from "../lib/utils";
import { DEFAULT_STRATEGY, GlyphProviderOptions, StrategyType } from "../types";
import LoadingStrategy from "./strategies/LoadingStrategy";
import { GlyphViewProvider } from "./GlyphViewProvider";
import { GlyphUserDataProvider } from "./GlyphUserDataProvider";

const logger = createLogger("GlyphProvider");
const PrivyStrategy = lazy(() => import("./strategies/PrivyStrategy"));
const EIP1193Strategy = lazy(() => import("./strategies/EIP1193Strategy"));

const GlyphProvider: FC<GlyphProviderOptions> = ({ children, strategy, glyphUrl, useStagingTenant, ...props }) => {
    const strategyComponents = useMemo(
        () => ({
            [StrategyType.EIP1193]: EIP1193Strategy,
            [StrategyType.PRIVY]: PrivyStrategy // default strategy
        }),
        []
    );

    const [currentStrategy, setCurrentStrategy] = useState<StrategyType>(strategy || DEFAULT_STRATEGY);

    logger.debug("strategy", currentStrategy);
    useEffect(() => {
        if (strategy && Object.values(StrategyType).includes(strategy)) {
            setCurrentStrategy(strategy);
        } else {
            setCurrentStrategy(DEFAULT_STRATEGY);
        }
    }, [strategy]);

    const ContextStrategy = useMemo(() => strategyComponents[currentStrategy], [currentStrategy, strategyComponents]);

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
};

GlyphProvider.displayName = "GlyphProvider";
export default memo(GlyphProvider);
