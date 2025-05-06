import { useCallback, useEffect, useState } from "react";
import { useAccount, useConnect } from "wagmi";
import { glyphConnectorDetails } from "../lib/constants";
import { useGlyph } from "./useGlyph";

interface GlyphLogin {
    login: () => void;
    logout: () => void;
}

/**
 * Use the `useNativeGlyphConnection` hook to login with Glyph.
 * @param askForSignature - Whether to ask for a signature from the user. Pass true if you want to use the Glyph Widget or want the useGlyph hook to be ready for use. Defaults to true.
 * @returns The login and logout functions.
 */
export const useNativeGlyphConnection = (askForSignature: boolean = true): GlyphLogin => {
    const { address, isConnected } = useAccount(); // detect wallet connection
    const { connectAsync, connectors } = useConnect();
    const { logout, login: widgetAuthentication } = useGlyph();

    const [tryAuthenticate, setTryAuthenticate] = useState<boolean>(false);

    useEffect(() => {
        if (isConnected && address && tryAuthenticate && askForSignature) {
            widgetAuthentication();
            setTryAuthenticate(false);
        }
    }, [isConnected, address, widgetAuthentication, tryAuthenticate, askForSignature]);

    const login = useCallback(async () => {
        const connector = connectors.find((c) => c.id === glyphConnectorDetails.id);
        if (!connector) {
            throw new Error("Glyph Wallet Connector not found");
        }
        const connect = await connectAsync({ connector });
        if (connect?.accounts.length > 0) {
            setTryAuthenticate(true);
        }
    }, [connectAsync, connectors]);

    return {
        login,
        logout
    };
};
