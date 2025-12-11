import {
    PrivyClientConfig,
    PrivyProvider,
    type LoginMethodOrderOption,
    type PrivyProviderProps
} from "@privy-io/react-auth";
import { createConfig, WagmiProvider } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo } from "react";
import { fallback, http, webSocket, type Transport } from "viem";
import { GlyphProvider } from "../../context/GlyphProvider.js";
import { useGlyphConfigureDynamicChains } from "../../hooks/useGlyphConfigureDynamicChains.js";
import { BaseGlyphProviderOptions, StrategyType } from "../../types/GlyphWidgetTypes.js";
import { GLYPH_PRIVY_APP_ID, STAGING_GLYPH_PRIVY_APP_ID } from "../constants.js";
import { InjectWagmiConnector } from "./InjectWagmiConnector.js";

export const GLYPH_APP_LOGIN_METHOD: LoginMethodOrderOption = `privy:${GLYPH_PRIVY_APP_ID}`;
export const STAGING_GLYPH_APP_LOGIN_METHOD: LoginMethodOrderOption = `privy:${STAGING_GLYPH_PRIVY_APP_ID}`;

// Since it is defined inside the provider, we need to omit it
export type GlyphPrivyConfig = Omit<PrivyClientConfig, "supportedChains">;

/**
 * Configuration options for the GlyphPrivyProvider.
 * @interface GlyphPrivyProviderProps
 * @extends PrivyProviderProps
 * @property {GlyphPrivyConfig} config - Optional Privy config to use.
 * @property {QueryClient} queryClient - Optional query client to use, defaults to a standard query client.
 * @property {string} glyphUrl - Optional URL for the Glyph API.
 * @property {boolean} useStagingTenant - Optional flag to use the staging tenant.
 * @property {boolean} ssr - Optional ssr to use, defaults to true.
 * @property {Function} onLogin - Optional onLogin function to use, defaults to a noop.
 * @property {Function} onLogout - Optional onLogout function to use, defaults to a noop.
 */
interface GlyphPrivyProviderProps extends Omit<PrivyProviderProps, "children" | "config">, BaseGlyphProviderOptions {
    config?: GlyphPrivyConfig;
    queryClient?: QueryClient;
    glyphUrl?: string;
    useStagingTenant?: boolean;
    ssr?: boolean;
}

export const GlyphPrivyProvider = ({
    queryClient = new QueryClient(),
    glyphUrl,
    useStagingTenant,
    ssr,
    onLogin,
    onLogout,
    ...props
}: GlyphPrivyProviderProps) => {
    const { chains } = useGlyphConfigureDynamicChains();

    const wagmiConfig = useMemo(() => {
        if (!chains || chains.length === 0) {
            return undefined;
        }
        return createConfig({
            chains,
            ssr,
            connectors: [],
            transports: chains.reduce(
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
        });
    }, [chains, ssr]);

    const privyProps = useMemo(() => {
        if (!chains || chains.length === 0) {
            return props;
        }

        // if no login methods and order are provided, set the default login method to the privy app login method and set the default chain
        if (!props.config) {
            props.config = {
                loginMethodsAndOrder: {
                    primary: [useStagingTenant ? STAGING_GLYPH_APP_LOGIN_METHOD : GLYPH_APP_LOGIN_METHOD]
                },
                defaultChain: chains[0]
            };
        } else if (!props.config.loginMethodsAndOrder) {
            props.config.loginMethodsAndOrder = {
                primary: [useStagingTenant ? STAGING_GLYPH_APP_LOGIN_METHOD : GLYPH_APP_LOGIN_METHOD]
            };
        } else if (!props.config.defaultChain) {
            props.config.defaultChain = chains[0];
        }

        return {
            ...props,
            config: {
                ...props.config,
                supportedChains: chains
            }
        };
    }, [props, chains, useStagingTenant]);

    if (!wagmiConfig || !privyProps.config) {
        return null;
    }

    return (
        <PrivyProvider {...privyProps}>
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
