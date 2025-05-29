import { useCallback } from "react";
import { useConnect, useDisconnect } from "wagmi";
import { glyphConnectorDetails } from "../lib/constants";

interface GlyphLogin {
    connect: () => void;
    disconnect: () => void;
}

/**
 * Use the `useNativeGlyphConnection` hook to login with Glyph.
 * @returns The connect and disconnect functions. Used to connect and disconnect from Glyph.
 */
export const useNativeGlyphConnection = (): GlyphLogin => {
    const { connectAsync, connectors } = useConnect();
    const { disconnect } = useDisconnect();

    const login = useCallback(async () => {
        const connector = connectors.find((c) => c.id === glyphConnectorDetails.id);
        if (!connector) {
            throw new Error("Glyph Wallet Connector not found");
        }
        await connectAsync({ connector });
    }, [connectAsync, connectors]);

    return {
        connect: login,
        disconnect
    };
};
