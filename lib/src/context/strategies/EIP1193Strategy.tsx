import { FC, useCallback, useEffect, useState } from "react";
import { useAccount, useAccountEffect, useDisconnect, useSendTransaction, useSignMessage } from "wagmi";
import { WIDGET_API_BASE_URL } from "../../lib/constants";
import { createLogger } from "../../lib/utils";
import { GlyphProviderOptions } from "../../types";
import { GlyphApiFetch, GlyphContext, createApiFetch } from "../GlyphContext";
import { apeChain } from "viem/chains";

type GlyphSigningMsgResponse = { message: string; nonce: string };
type GlyphSignatureVerifyResponse = { token: string };

const TOKEN_KEY = "__glyph-widget-token__";
const NONCE_KEY = "__glyph-widget-nonce__";
const logger = createLogger("EIP1193Strategy");

const EIP1193Strategy: FC<GlyphProviderOptions> = ({ children, glyphUrl, onLogin, onLogout }) => {
    const [loading, setLoading] = useState(false);
    const [apiFetch, setApiFetch] = useState<GlyphApiFetch | null>(null);
    const { address, isConnected, chainId } = useAccount(); // detect wallet connection
    const { disconnectAsync } = useDisconnect(); // disconnect the wallet
    const { signMessageAsync } = useSignMessage(); // signing messages with the wallet
    const { sendTransactionAsync } = useSendTransaction(); // sending transactions with the wallet

    // Perform graceful logout when the wallet is disconnected from anywhere within the app
    useAccountEffect({
        onDisconnect: () => {
            logoutSideEffect();
        }
    });

    logger.log({ address, isConnected });

    // Fetch authentication token from session storage
    const [token, setToken] = useState<string | null>(() => {
        if (typeof window === "undefined") {
            return null;
        }
        try {
            return localStorage.getItem(TOKEN_KEY);
        } catch (error) {
            logger.warn("Error reading session token", error);
            return null;
        }
    });

    // fetch nonce from session storage
    const [sessNonce, setSessNonce] = useState<string | null>(() => {
        if (typeof window === "undefined") {
            return null;
        }
        try {
            return localStorage.getItem(NONCE_KEY);
        } catch (error) {
            logger.warn("Error reading session nonce", error);
            return null;
        }
    });

    // Keep token and nonce updated in session storage
    useEffect(() => {
        try {
            if (!token) {
                localStorage.removeItem(TOKEN_KEY);
                localStorage.removeItem(NONCE_KEY);
            } else {
                localStorage.setItem(TOKEN_KEY, token!);
                localStorage.setItem(NONCE_KEY, sessNonce!);
            }
        } catch (error) {
            logger.error("Error saving session token", error);
        }
    }, [sessNonce, token]);

    const fetchMessageToSign = useCallback(async (address: string): Promise<GlyphSigningMsgResponse> => {
        try {
            const payload = (await fetch(`${glyphUrl || WIDGET_API_BASE_URL}/api/widget/auth/message/${address}`).then(
                (resp) => resp.json()
            )) as GlyphSigningMsgResponse;

            return payload;
        } catch (error) {
            logger.error("Can't fetch message to sign", error);
            throw new Error("Failed to fetch the message to sign.");
        }
    }, [glyphUrl]);

    const verifySignature = useCallback(async (
        address: string,
        signature: string,
        nonce: string
    ): Promise<GlyphSignatureVerifyResponse> => {
        try {
            const payload = await fetch(`${glyphUrl || WIDGET_API_BASE_URL}/api/widget/auth/verify/${address}`, {
                method: "POST",
                body: JSON.stringify({ signature, nonce })
            }).then((resp) => resp.json());
            return payload as unknown as GlyphSignatureVerifyResponse;
        } catch (error) {
            logger.error("Can't verify signature", error);
            throw new Error("Signature verification failed.");
        }
    }, [glyphUrl]);

    useEffect(() => {
        if (!token || !sessNonce) return;

        const glyphApiFetch = createApiFetch(glyphUrl || WIDGET_API_BASE_URL, async () => token, {
            "x-evm-address": address!,
            'x-glyph-nonce': sessNonce!
        });
        setApiFetch(() => glyphApiFetch);
    }, [token, address, glyphUrl, sessNonce]);

    const authenticate = useCallback(async () => {
        logger.log("authenticate");
        if (!address) {
            logger.error("no wallet connected.");
            return;
        }

        try {
            if (!address || !isConnected) {
                setApiFetch(null);
                setLoading(false);
                return;
            }

            // Sign a message with the wallet to authenticate
            setLoading(true);
            const { message, nonce } = await fetchMessageToSign(address);
            const userSignature = await signMessageAsync({ account: address, message });
            const token = (await verifySignature(address, userSignature, nonce))?.token;
            setToken(token);
            setSessNonce(nonce);
        } catch (error) {
            logger.error("Authentication failed", error);
            setApiFetch(null);
            setToken(null);
            setSessNonce(null);
        } finally {
            setLoading(false);
        }
    }, [address, isConnected, fetchMessageToSign, signMessageAsync, verifySignature]);

    const logoutSideEffect = useCallback(async (disconnect = false) => {
        logger.log(`logout: disconnect=${disconnect}`);
        setToken(null);
        setLoading(false);
        setApiFetch(null);
        if (disconnect) await disconnectAsync();
    }, [disconnectAsync]);

    return (
        <GlyphContext.Provider
            value={{
                ready: !loading,
                authenticated: isConnected && !!address && token !== null,
                symbol: "APE",
                glyphUrl,
                hideWidget: !isConnected || !address,
                login: async () => {
                    await authenticate();
                    onLogin?.();
                },
                logout: async () => {
                    await logoutSideEffect(true);
                    onLogout?.();
                },
                signMessage: async ({ message }) => {
                    if (!address || !isConnected) {
                        throw new Error("Wallet not connected");
                    }
                    return signMessageAsync({ account: address, message });
                },
                sendTransaction: async ({ transaction }) => {
                    if (!address || !isConnected) throw new Error("Wallet not connected");

                    return sendTransactionAsync({ ...transaction, chainId: chainId || apeChain.id } as any);
                },
                apiFetch: apiFetch!
            }}
            children={children}
        />
    );
};

EIP1193Strategy.displayName = "EIP1193Strategy";
export default EIP1193Strategy;
