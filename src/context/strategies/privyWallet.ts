import type { User } from "@privy-io/react-auth";
import { isEthereumAddress } from "../../lib/utils";

/** Select supported EVM signers, preserving Glyph > other cross-app > native precedence. */
export function selectPrivyWallet(user: User | null, glyphAppId?: string) {
    const accounts = user?.linkedAccounts ?? [];
    const crossAppWallets = accounts.flatMap((account) => {
        if (account.type !== "cross_app" || !account.providerApp?.id) return [];
        // Cross-app declarations are address-only; respect an explicit capability
        // when supplied without requiring it from legacy linked accounts.
        const wallet = account.embeddedWallets?.find(
            (wallet) => isEthereumAddress(wallet.address) && !("userCanSign" in wallet && wallet.userCanSign === false)
        );
        return wallet ? [{ address: wallet.address, usesCrossapp: true, providerAppId: account.providerApp.id }] : [];
    });
    const crossApp = crossAppWallets.find((wallet) => wallet.providerAppId === glyphAppId) ?? crossAppWallets[0];
    if (crossApp) return crossApp;

    const native = accounts.find(
        (account) =>
            account.type === "wallet" &&
            account.chainType === "ethereum" &&
            account.walletClientType === "privy" &&
            !("userCanSign" in account && account.userCanSign === false) &&
            isEthereumAddress(account.address)
    );
    return native?.type === "wallet" ? { address: native.address, usesCrossapp: false, providerAppId: null } : null;
}
