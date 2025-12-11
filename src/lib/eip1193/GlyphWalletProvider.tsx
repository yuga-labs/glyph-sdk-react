import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo } from "react";
import { http, type Transport } from "viem";
import { createConfig, WagmiProvider } from "wagmi";
import { GlyphProvider } from "../../context/GlyphProvider";
import { useGlyphConfigureDynamicChains } from "../../hooks/useGlyphConfigureDynamicChains";
import { BaseGlyphProviderOptionsWithSignature, StrategyType, WalletClientType } from "../../types";
import { glyphWalletConnector } from "./glyphWalletConnector";

const defaultQueryClient = new QueryClient();

/**
 * Configuration options for the GlyphWalletProvider.
 * @interface GlyphWalletProviderProps
 * @property {QueryClient} queryClient - Optional query client to use, defaults to a standard query client.
 * @property {React.ReactNode} children - The children to render.
 */
interface GlyphWalletProviderProps extends BaseGlyphProviderOptionsWithSignature {
    queryClient?: QueryClient;
    ssr?: boolean;
}

/**
 * GlyphWalletProvider is a React provider that wraps the WagmiProvider and QueryClientProvider.
 * It provides the GlyphWalletContext to its children.
 *
 * ```tsx
 * import { GlyphWalletProvider } from '@use-glyph/sdk-react';
 *
 * const App = () => {
 *   const queryClient = new QueryClient()
 *   return (
 *     <GlyphWalletProvider queryClient={queryClient}>
 *       <Component {...pageProps} />
 *     </GlyphWalletProvider>
 *   );
 * };
 * ```
 *
 * See more at: {@link https://docs.useglyph.io/reference/components/GlyphWalletProvider/}
 */
export const GlyphWalletProvider = ({
    queryClient = defaultQueryClient,
    children,
    ssr,
    ...glyphProviderOptions
}: GlyphWalletProviderProps) => {
    const { chains } = useGlyphConfigureDynamicChains();

    const wagmiConfig = useMemo(
        () => {
            if (chains && chains.length > 0) {
                return createConfig({
                    chains,
                    ssr,
                    connectors: [glyphWalletConnector({ useStagingTenant: glyphProviderOptions.useStagingTenant })],
                    transports: chains.reduce(
                        (acc, chain) => {
                            acc[chain.id] = http();
                            return acc;
                        },
                        {} as Record<number, Transport>
                    ),
                    multiInjectedProviderDiscovery: false
                })
            }
            return null;
        },
        [chains, glyphProviderOptions.useStagingTenant, ssr]
    );

    if (!wagmiConfig) {
        return null;
    }

    return (
        <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
                <GlyphProvider
                    strategy={StrategyType.EIP1193}
                    walletClientType={WalletClientType.WAGMI}
                    {...glyphProviderOptions}
                >
                    {children}
                </GlyphProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
};
