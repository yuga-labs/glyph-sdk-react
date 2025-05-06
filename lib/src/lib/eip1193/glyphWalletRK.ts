import { toPrivyWallet } from "@privy-io/cross-app-connect/rainbow-kit";
import { GLYPH_PRIVY_APP_ID, glyphConnectorDetails, STAGING_GLYPH_PRIVY_APP_ID } from "../constants";

/**
 * Create a RainbowKit wallet for Glyph Global Wallet
 *
 * @example
 * import { connectorsForWallets } from "@rainbow-me/rainbowkit";
 * import { glyphWalletRK } from "@use-glyph/sdk-react"
 *
 * const connectors = connectorsForWallets(
 *  [
 *    {
 *      groupName: "Glyph",
 *      wallets: [glyphWalletRK],
 *    },
 *  ]);
 */
// const glyphWalletRK = (): Wallet => {
//     return {
//         id: glyphConnectorDetails.id,
//         name: glyphConnectorDetails.name,
//         iconUrl: glyphConnectorDetails.iconUrl,
//         iconBackground: glyphConnectorDetails.iconBackground,
//         installed: true,
//         shortName: glyphConnectorDetails.shortName,
//         createConnector: (rkDetails) =>
//             glyphWalletConnector({
//                 rkDetails
//             })
//     };
// };

const glyphWalletRK = toPrivyWallet({
    id: GLYPH_PRIVY_APP_ID,
    name: glyphConnectorDetails.name,
    iconUrl: glyphConnectorDetails.iconUrl
});

const glyphWalletRKStaging = toPrivyWallet({
    id: STAGING_GLYPH_PRIVY_APP_ID,
    name: glyphConnectorDetails.name,
    iconUrl: glyphConnectorDetails.iconUrl
});

export { glyphWalletRK, glyphWalletRKStaging };
