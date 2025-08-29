import { PrivyProvider, type LoginMethodOrderOption, type PrivyProviderProps } from "@privy-io/react-auth";
import { createConfig, WagmiProvider } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo } from "react";
import { fallback, http, webSocket, type Chain, type Transport } from "viem";
import { BaseGlyphProviderOptions, StrategyType } from "../../types/GlyphWidgetTypes.js";
import { GLYPH_PRIVY_APP_ID, STAGING_GLYPH_PRIVY_APP_ID } from "../constants.js";
import { InjectWagmiConnector } from "./InjectWagmiConnector.js";
import { GlyphProvider } from "../../context/GlyphProvider.js";

export const GLYPH_APP_LOGIN_METHOD: LoginMethodOrderOption = `privy:${GLYPH_PRIVY_APP_ID}`;
export const STAGING_GLYPH_APP_LOGIN_METHOD: LoginMethodOrderOption = `privy:${STAGING_GLYPH_PRIVY_APP_ID}`;

/**
 * Configuration options for the GlyphPrivyProvider.
 * @interface GlyphPrivyProviderProps
 * @extends PrivyProviderProps
 * @property {[Chain, ...Chain[]]} chains - The chains to use, defaults to apeChain.
 * @property {Record<number, Transport>} transports - Optional transports to use, defaults to standard http.
 * @property {QueryClient} queryClient - Optional query client to use, defaults to a standard query client.
 * @property {boolean} ssr - Optional ssr to use, defaults to true.
 * @property {Function} onLogin - Optional onLogin function to use, defaults to a noop.
 * @property {Function} onLogout - Optional onLogout function to use, defaults to a noop.
 */
interface GlyphPrivyProviderProps extends Omit<PrivyProviderProps, "children">, BaseGlyphProviderOptions {
    chains: [Chain, ...Chain[]];
    transports?: Record<number, Transport>;
    queryClient?: QueryClient;
    glyphUrl?: string;
    useStagingTenant?: boolean;
    ssr?: boolean;
    children: React.ReactNode;
}

export const GlyphPrivyProvider = ({
    chains,
    transports,
    queryClient = new QueryClient(),
    glyphUrl,
    useStagingTenant,
    ssr,
    onLogin,
    onLogout,
    ...props
}: GlyphPrivyProviderProps) => {
    const wagmiConfig = useMemo(
        () =>
            createConfig({
                chains,
                ssr,
                connectors: [],
                transports:
                    transports ??
                    chains.reduce(
                        (acc, chain) => {
                            // this transport selection must match the one in providers.ts
                            const ws = chain.rpcUrls?.default?.webSocket?.[0];
                            const ht = chain.rpcUrls?.default?.http?.[0];
                            const transports = [ws && webSocket(ws), ht && http(ht)].filter((x) => !!x);
                            acc[chain.id] = transports.length ? fallback(transports) : http();
                            return acc;
                        },
                        {} as Record<number, Transport>
                    ),
                multiInjectedProviderDiscovery: false
            }),
        [chains, transports, ssr]
    );

    // if no login methods and order are provided, set the default login method to the privy app login method
    if (!props.config) {
        props.config = {
            loginMethodsAndOrder: {
                primary: [useStagingTenant ? STAGING_GLYPH_APP_LOGIN_METHOD : GLYPH_APP_LOGIN_METHOD]
            }
        };
    } else if (!props.config.loginMethodsAndOrder) {
        props.config.loginMethodsAndOrder = {
            primary: [useStagingTenant ? STAGING_GLYPH_APP_LOGIN_METHOD : GLYPH_APP_LOGIN_METHOD]
        };
    }
    return (
        <PrivyProvider {...props}>
            <QueryClientProvider client={queryClient}>
                {/* If we import WagmiProvider from "@privy-io/wagmi", we need to wrap it in a QueryClientProvider */}
                <WagmiProvider config={wagmiConfig}>
                    <InjectWagmiConnector useStagingTenant={useStagingTenant}>
                        <GlyphProvider
                            strategy={StrategyType.PRIVY}
                            glyphUrl={glyphUrl}
                            useStagingTenant={useStagingTenant}
                            onLogin={onLogin}
                            onLogout={onLogout}
                        >
                            {props.children}
                        </GlyphProvider>
                    </InjectWagmiConnector>
                </WagmiProvider>
            </QueryClientProvider>
        </PrivyProvider>
    );
};
