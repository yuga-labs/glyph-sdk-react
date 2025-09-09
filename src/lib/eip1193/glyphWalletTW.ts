import { ConnectorEventMap } from "@wagmi/core";
import { createEmitter, Emitter } from "@wagmi/core/internal";
import { EIP1193, Wallet } from "thirdweb/wallets";
import { Chain, EIP1193Provider } from "viem";
import { apeChain, curtis } from "viem/chains";
import { glyphWalletConnector } from "./glyphWalletConnector";

/**
 * Create a thirdweb wallet for Glyph Global Wallet
 *
 * @returns A wallet instance wrapping Glyph Global Wallet to be used with the thirdweb Connect SDK
 *
 * @example
 * ```tsx
 * import { createThirdwebClient } from "thirdweb";
 * import { glyphWalletTW } from "@use-glyph/sdk-react"
 *
 * const client = createThirdwebClient({ clientId });
 *
 * <ConnectButton client={client} wallets=[glyphWalletTW()]>
 * ```
 */
const glyphWalletTW = (chains?: [Chain, ...Chain[]]): Wallet => {
    const connector = glyphWalletConnector()({
        chains: chains ?? [apeChain, curtis],
        emitter: createEmitter("io.useglyph") as Emitter<ConnectorEventMap>
    });
    return EIP1193.fromProvider({
        provider: connector.getProvider as (
            parameters?: { chainId?: number | undefined } | undefined
        ) => Promise<EIP1193Provider>,
        walletId: "io.useglyph"
    });
};

export { glyphWalletTW };
