import { toPrivyWalletConnector } from "@privy-io/cross-app-connect/rainbow-kit";

import { type EIP1193EventMap, type EIP1193RequestFn, type EIP1474Methods } from "viem";

import { WalletDetailsParams } from "@rainbow-me/rainbowkit";
import { CreateConnectorFn } from "wagmi";
import { GLYPH_PRIVY_APP_ID, glyphConnectorDetails, STAGING_GLYPH_PRIVY_APP_ID } from "../constants";

interface GlyphWalletConnectorOptions {
    /** RainbowKit connector details */
    rkDetails: WalletDetailsParams;
    /** Optional custom paymaster handler */
    // customPaymasterHandler: CustomPaymasterHandler; // TODO: add this
    useStagingTenant?: boolean;
}

/**
 * Create a wagmi connector for the Glyph Global Wallet.
 *
 * Adapted from wagmi injected connector as a reference implementation:
 * https://github.com/wevm/wagmi/blob/main/packages/core/src/connectors/injected.ts#L94
 *
 * @example
 * import { createConfig, http } from "wagmi";
 * import { apeChain } from "wagmi/chains";
 * import { glyphWalletConnector } from "@use-glyph/sdk-react"
 *
 * export const wagmiConfig = createConfig({
 *   chains: [apeChain],
 *   transports: {
 *     [apeChain.id]: http(),
 *   },
 *   connectors: [glyphWalletConnector()],
 *   ssr: true,
 * });
 */
function glyphWalletConnector(options: Partial<GlyphWalletConnectorOptions> = {}): CreateConnectorFn<
    {
        on: <event extends keyof EIP1193EventMap>(event: event, listener: EIP1193EventMap[event]) => void;
        removeListener: <event extends keyof EIP1193EventMap>(event: event, listener: EIP1193EventMap[event]) => void;
        request: EIP1193RequestFn<EIP1474Methods>;
    },
    Record<string, unknown>,
    Record<string, unknown>
> {
    const { rkDetails, useStagingTenant } = options;
    return (params) => {
        const [defaultChain, ...chains] = [...params.chains];

        const connector = toPrivyWalletConnector({
            iconUrl: glyphConnectorDetails.iconUrl,
            id: useStagingTenant ? STAGING_GLYPH_PRIVY_APP_ID : GLYPH_PRIVY_APP_ID,
            name: glyphConnectorDetails.name
        })({
            ...params,
            chains: [defaultChain, ...chains]
        });

        const getGlyphProvider = async (parameters?: { chainId?: number | undefined } | undefined) => {
            const chainId = parameters?.chainId ?? defaultChain.id;

            // const chain = params.chains.find((c) => c.id === chainId);

            const provider = await connector.getProvider({
                chainId
            });

            // const transport = params.transports?.[chainId] ?? http();

            // return transformEIP1193Provider({
            //     provider,
            //     chain,
            //     transport,
            //     isPrivyCrossApp: true
            // });
            // TODO: add transformEIP1193Provider
            return provider;
        };

        const glyphConnector = {
            ...connector,
            ...rkDetails,
            getProvider: getGlyphProvider,
            type: glyphConnectorDetails.type,
            id: glyphConnectorDetails.id
        };
        return glyphConnector;
    };
}

export { glyphWalletConnector };
