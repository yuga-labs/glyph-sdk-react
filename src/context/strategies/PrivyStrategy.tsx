import {
    UnsignedTransactionRequest,
    useCrossAppAccounts,
    usePrivy,
    useWallets,
    WalletWithMetadata
} from "@privy-io/react-auth";
import { FC, memo, useCallback, useEffect, useState } from "react";
import { GLYPH_PRIVY_APP_ID, STAGING_GLYPH_PRIVY_APP_ID, WIDGET_API_BASE_URL } from "../../lib/constants";
import { createLogger, isEthereumAddress } from "../../lib/utils";
import { BaseGlyphProviderOptions } from "../../types";
import { createApiFetch, GlyphApiFetch, GlyphContext } from "../GlyphContext";
import { useChainId } from "wagmi";

const logger = createLogger("PrivyStrategy");

const PrivyStrategy: FC<BaseGlyphProviderOptions> = ({ children, glyphUrl, onLogin, onLogout, useStagingTenant }) => {
    const [loading, setLoading] = useState<boolean>(true);
    const [apiFetch, setApiFetch] = useState<GlyphApiFetch | null>(null);
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [usesCrossapp, setUsesCrossapp] = useState<boolean>(false);
    const chainId = useChainId();

    const {
        ready: privyReady,
        authenticated: privyAuthenticated,
        user: privyUser,
        getAccessToken: getPrivyAccessToken,
        login: privyLogin,
        logout: privyLogout,
        signMessage: privySignMessage,
        sendTransaction: privySendTransaction
    } = usePrivy();
    const { signMessage: crossAppSignMessage, sendTransaction: crossAppSendTransaction } = useCrossAppAccounts();

    logger.debug(privyReady, privyAuthenticated, !!privyUser);
    const { wallets } = useWallets();

    useEffect(() => {
        // If Privy is not ready, reset widget state (loading: true)
        if (!privyReady) {
            setApiFetch(null);
            setLoading(true);
            return;
        }

        // If user is not authenticated, reset widget state (loading: false)
        if (!privyAuthenticated || !privyUser) {
            setApiFetch(null);
            setLoading(false);
            return;
        }

        let address: string | undefined;

        const privyEvmWallet = privyUser!.linkedAccounts?.find(
            (w) => w.type === "wallet" && w.chainType === "ethereum" && w.walletClientType === "privy"
        ) as WalletWithMetadata | undefined;

        const hasPrivyEvmWallet = privyEvmWallet && isEthereumAddress(privyEvmWallet.address);
        if (hasPrivyEvmWallet) logger.debug("Privy (main) EVM embedded wallet", privyEvmWallet.address);

        logger.debug("finding cross-app accounts...");
        // Cross-app accounts are always EVM addresses
        const crossAppAccounts = privyUser!.linkedAccounts?.filter?.((account) => account.type === "cross_app") || [];

        const otherAccounts = crossAppAccounts.filter(
            (account) =>
                account.providerApp?.id !== (useStagingTenant ? STAGING_GLYPH_PRIVY_APP_ID : GLYPH_PRIVY_APP_ID)
        );
        logger.debug("linked accounts - non-Glyph", { accounts: otherAccounts });
        const otherAddresses = otherAccounts.map((account) => account.embeddedWallets[0].address);
        if (otherAddresses.length > 0) {
            address = otherAddresses[0];
            logger.log("using cross_app (non-Glyph) account");
            if (otherAddresses.length > 1) {
                logger.warn("too many cross_app accounts");
            }
        }

        const glyphAccounts = crossAppAccounts.filter(
            (account) =>
                account.providerApp?.id === (useStagingTenant ? STAGING_GLYPH_PRIVY_APP_ID : GLYPH_PRIVY_APP_ID)
        );
        logger.debug("linked accounts - Glyph", { accounts: glyphAccounts });
        const glyphAddresses = glyphAccounts.map((account) => account.embeddedWallets[0].address);
        if (glyphAddresses.length > 0) {
            address = glyphAddresses[0];
            logger.log("using cross_app (Glyph) account");
            if (glyphAddresses.length > 1) {
                logger.warn("too many cross_app accounts");
            }
        }

        if (address) {
            setUsesCrossapp(true);
            logger.log("using cross_app account", address);
        } else if (hasPrivyEvmWallet) {
            address = privyEvmWallet.address;
            logger.log("using Privy (main) EVM embedded wallet", address);
        }

        setWalletAddress(address ?? null);

        // Fetch user data from Glyph API
        const fetchUserData = async () => {
            // If no address is found, stop here
            if (!address) {
                logger.error("user has no wallet");
                return;
            }

            const glyphApiFetch = createApiFetch(
                glyphUrl || WIDGET_API_BASE_URL,
                async () => (await getPrivyAccessToken())!,
                { "x-evm-address": address }
            );
            setApiFetch(() => glyphApiFetch);
            setLoading(false);
        };

        fetchUserData();
    }, [
        glyphUrl,
        privyAuthenticated,
        privyReady,
        privyUser,
        useStagingTenant,
        usesCrossapp,
        wallets,
        walletAddress,
        getPrivyAccessToken,
        privyLogout
    ]);

    const authenticate = useCallback(async () => {
        await privyLogin();
        onLogin?.();
    }, [onLogin, privyLogin]);

    const logout = useCallback(async () => {
        privyLogout();
        onLogout?.();
    }, [onLogout, privyLogout]);

    const signMessage = useCallback(
        async ({ message }: { message: string }) => {
            if (!walletAddress) throw new Error("No wallet address found");

            return usesCrossapp
                ? crossAppSignMessage(message, { address: walletAddress })
                : privySignMessage({ message });
        },
        [walletAddress, usesCrossapp, crossAppSignMessage, privySignMessage]
    );

    const sendTransaction = useCallback(
        async ({ transaction }: { transaction: Omit<UnsignedTransactionRequest, "chainId"> }) => {
            if (!walletAddress) throw new Error("No wallet address found");
            const tx = { ...transaction, chainId };

            return usesCrossapp
                ? crossAppSendTransaction(tx, { address: walletAddress })
                : privySendTransaction(tx, { address: walletAddress });
        },
        [chainId, usesCrossapp, walletAddress, crossAppSendTransaction, privySendTransaction]
    );

    return (
        <GlyphContext.Provider
            value={{
                ready: privyReady && !loading,
                authenticated: privyReady && privyAuthenticated,
                symbol: "APE",
                glyphUrl: glyphUrl as string, // Pass as string to avoid type error (we are passing fallback value in useGlyph hook at a common place)
                login: authenticate,
                logout,
                signMessage,
                sendTransaction,
                apiFetch: apiFetch!
            }}
        >
            {children}
        </GlyphContext.Provider>
    );
};

export default memo(PrivyStrategy);
