import { UnsignedTransactionRequest } from "@privy-io/react-auth";
import { FC, useCallback, useEffect, useState } from "react";
import { apeChain } from "viem/chains";
import { useAccount, useAccountEffect, useDisconnect, useSendTransaction, useSignMessage } from "wagmi";
import { WIDGET_API_BASE_URL } from "../../lib/constants";
import { createLogger } from "../../lib/utils";
import { BaseGlyphProviderOptionsWithSignature } from "../../types";
import { GlyphApiFetch, GlyphContext, createApiFetch } from "../GlyphContext";

type GlyphSigningMsgResponse = { message: string; nonce: string };
type GlyphSignatureVerifyResponse = { token: string };

const TOKEN_KEY = "__glyph-widget-token__";
const NONCE_KEY = "__glyph-widget-nonce__";
const logger = createLogger("EIP1193Strategy");

const EIP1193Strategy: FC<BaseGlyphProviderOptionsWithSignature> = ({
    children,
    glyphUrl,
    onLogin,
    onLogout,
    askForSignature = true
}) => {
    const [loading, setLoading] = useState(false);
    const [apiFetch, setApiFetch] = useState<GlyphApiFetch | null>(null);
    const { address, isConnected, chainId } = useAccount(); // detect wallet connection
    const { disconnectAsync } = useDisconnect(); // disconnect the wallet
    const { signMessageAsync } = useSignMessage(); // signing messages with the wallet
    const { sendTransactionAsync } = useSendTransaction(); // sending transactions with the wallet

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

    const [message, setMessage] = useState<string | null>(null);

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
            if (!token || !sessNonce) {
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

    const fetchMessageToSign = useCallback(
        async (address: string): Promise<GlyphSigningMsgResponse> => {
            try {
                const payload = (await fetch(
                    `${glyphUrl || WIDGET_API_BASE_URL}/api/widget/auth/message/${address}`
                ).then((resp) => resp.json())) as GlyphSigningMsgResponse;

                return payload;
            } catch (error) {
                logger.error("Can't fetch message to sign", error);
                throw new Error("Failed to fetch the message to sign.");
            }
        },
        [glyphUrl]
    );

    const verifySignature = useCallback(
        async (address: string, signature: string, nonce: string): Promise<GlyphSignatureVerifyResponse> => {
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
        },
        [glyphUrl]
    );

    useEffect(() => {
        if (!address || !isConnected) return;
        if (sessNonce) return;

        setLoading(true);
        fetchMessageToSign(address)
            .then(({ message, nonce }) => {
                setMessage(message);
                setSessNonce(nonce);
                setLoading(false);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [address, isConnected, fetchMessageToSign, sessNonce]);

    useEffect(() => {
        if (!token || !sessNonce) return;

        const glyphApiFetch = createApiFetch(glyphUrl || WIDGET_API_BASE_URL, async () => token, {
            "x-evm-address": address!,
            "x-glyph-nonce": sessNonce!
        });
        setApiFetch(() => glyphApiFetch);
    }, [token, address, glyphUrl, sessNonce]);

    const disconnect = useCallback(async () => {
        await disconnectAsync();
    }, [disconnectAsync]);

    const authenticate = useCallback(async () => {
        logger.log("authenticate");
        if (!address) {
            logger.error("no wallet connected.");
            return;
        }

        try {
            if (!address || !isConnected || !message || !sessNonce) {
                setApiFetch(null);
                setLoading(false);
                return;
            }

            // Sign a message with the wallet to authenticate
            setLoading(true);

            const userSignature = await signMessageAsync({ account: address, message: message });
            console.log(sessNonce, message, userSignature);

            const token = (await verifySignature(address, userSignature, sessNonce))?.token;

            setToken(token);
        } catch (error) {
            logger.error("Authentication failed", error);
            if (!(error as Error)?.message?.toLowerCase?.().includes?.("user rejected")) {
                await alert(
                    "Authentication failed - your browser could be blocking the popups. Allow popups or try to manually click sign in."
                );
            }
            setApiFetch(null);
            setToken(null);
            setSessNonce(null);
        } finally {
            setLoading(false);
            onLogin?.();
        }
    }, [address, isConnected, message, sessNonce, signMessageAsync, verifySignature]);

    const logoutSideEffect = useCallback(async () => {
        setSessNonce(null);
        setToken(null);
        setLoading(false);
        setApiFetch(null);
        onLogout?.();
    }, []);

    const signMessage = useCallback(
        async ({ message }: { message: string }) => {
            if (!address || !isConnected) {
                throw new Error("Wallet not connected");
            }
            return signMessageAsync({ account: address, message });
        },
        [address, isConnected, signMessageAsync]
    );

    const sendTransaction = useCallback(
        async ({ transaction }: { transaction: Omit<UnsignedTransactionRequest, "chainId"> }) => {
            if (!address || !isConnected) throw new Error("Wallet not connected");

            return sendTransactionAsync({ ...transaction, chainId: chainId || apeChain.id } as any);
        },
        [address, isConnected, sendTransactionAsync, chainId]
    );

    const [tryAuthenticate, setTryAuthenticate] = useState<boolean>(false);
    // Perform graceful logout when the wallet is disconnected from anywhere within the app
    useAccountEffect({
        onConnect: () => {
            if (askForSignature) {
                // Perform initial authentication when the wallet is connected
                setTryAuthenticate(true);
            }
        },
        onDisconnect: () => {
            logoutSideEffect();
        }
    });
    useEffect(() => {
        if (askForSignature && isConnected && address && tryAuthenticate && sessNonce && message) {
            // Initial authentication
            authenticate();
            setTryAuthenticate(false);
        }
    }, [isConnected, address, authenticate, tryAuthenticate, sessNonce, message, askForSignature]);

    return (
        <GlyphContext.Provider
            value={{
                ready: !loading && !!sessNonce,
                authenticated: isConnected && !!address && token !== null,
                glyphUrl: glyphUrl as string, // Pass as string to avoid type error (we are passing fallback value in useGlyph hook at a common place)
                hideWidget: !isConnected || !address,
                login: authenticate,
                logout: disconnect, // on disconnect, logoutSideEffect is called and clears states
                signMessage,
                sendTransaction,
                apiFetch: apiFetch!
            }}
            children={children}
        />
    );
};

export default EIP1193Strategy;
