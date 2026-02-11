import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo } from "react";
import { type Chain, http, type Transport } from "viem";
import { createConfig, WagmiProvider } from "wagmi";
import { GlyphProvider } from "../../context/GlyphProvider";
import { BaseGlyphProviderOptionsWithSignature, StrategyType, WalletClientType } from "../../types";
import { glyphWalletConnector } from "./glyphWalletConnector";

const defaultQueryClient = new QueryClient();

/**
 * Configuration options for the GlyphWalletProvider.
 * @interface GlyphWalletProviderProps
 * @property {[Chain, ...Chain[]]} chains - The chains to use, defaults to apeChain.
 * @property {Record<number, Transport>} transports - Optional transports to use, defaults to standard http.
 * @property {QueryClient} queryClient - Optional query client to use, defaults to a standard query client.
 * @property {React.ReactNode} children - The children to render.
 */
interface GlyphWalletProviderProps extends BaseGlyphProviderOptionsWithSignature {
    chains: [Chain, ...Chain[]];
    transports?: Record<number, Transport>;
    queryClient?: QueryClient;
    children: React.ReactNode;
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
 *     <GlyphWalletProvider chains={[apeChain]} queryClient={queryClient}>
 *       <Component {...pageProps} />
 *     </GlyphWalletProvider>
 *   );
 * };
 * ```
 *
 * See more at: {@link https://docs.useglyph.io/reference/components/GlyphWalletProvider/}
 */
export const GlyphWalletProvider = ({
    chains,
    transports,
    queryClient = defaultQueryClient,
    children,
    ssr,
    ...glyphProviderOptions
}: GlyphWalletProviderProps) => {
    const defaultTransports = useMemo(
        () =>
            chains.reduce(
                (acc, chain) => {
                    acc[chain.id] = http();
                    return acc;
                },
                {} as Record<number, Transport>
            ),
        [chains]
    );

    const wagmiConfig = useMemo(
        () =>
            createConfig({
                chains,
                ssr,
                connectors: [glyphWalletConnector({ useStagingTenant: glyphProviderOptions.useStagingTenant })],
                transports: transports ?? defaultTransports,
                multiInjectedProviderDiscovery: false
            }),
        [chains, transports, defaultTransports, glyphProviderOptions.useStagingTenant, ssr]
    );

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
