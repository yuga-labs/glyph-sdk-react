import React, { useCallback, useEffect, useState } from "react";
import type { EIP1193Provider } from "viem";
import { useConfig, useReconnect } from "wagmi";
import { glyphConnectorDetails } from "../constants";
import { createLogger, wagmiCrossAppConnector } from "../utils";
import { usePrivyCrossAppProvider } from "./usePrivyCrossAppProvider";

export const InjectWagmiConnector = ({
    children,
    useStagingTenant
}: {
    children: React.ReactNode;
    useStagingTenant?: boolean;
}) => {
    const wagmiConfig = useConfig();
    const { reconnect } = useReconnect();

    const { ready, provider } = usePrivyCrossAppProvider({
        chains: wagmiConfig.chains,
        useStagingTenant
    });

    const [isSetup, setIsSetup] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const logger = createLogger("InjectWagmiConnector");

    const setup = useCallback(
        async (provider: EIP1193Provider) => {
            try {
                // Remove disconnected state
                await wagmiConfig.storage?.removeItem(`${glyphConnectorDetails.id}.disconnected`);

                // Create and setup new connector
                const wagmiConnector = wagmiCrossAppConnector(provider, useStagingTenant);

                const connector = wagmiConfig._internal.connectors.setup(wagmiConnector);

                // Store connector ID
                await wagmiConfig.storage?.setItem("recentConnectorId", glyphConnectorDetails.id);

                // Set connector state
                wagmiConfig._internal.connectors.setState([connector]);

                return connector;
            } catch (err) {
                logger.error("Failed to setup connector:", err);
                setError(err instanceof Error ? err : new Error("Failed to setup connector"));
                return null;
            }
        },
        [wagmiConfig._internal.connectors, wagmiConfig.storage, logger]
    );

    useEffect(() => {
        const initializeConnector = async () => {
            if (!ready || !provider) return;

            // Check if we need to setup
            if (!isSetup || wagmiConfig.connectors.length === 0) {
                const connector = await setup(provider);
                if (connector) {
                    try {
                        await reconnect({ connectors: [connector] });
                        setIsSetup(true);
                    } catch (err) {
                        logger.error("Failed to reconnect:", err);
                        setError(err instanceof Error ? err : new Error("Failed to reconnect"));
                    }
                }
            }
        };

        initializeConnector();
    }, [ready, provider, isSetup, setup, reconnect, wagmiConfig, logger]);

    // Log errors if they occur
    useEffect(() => {
        if (error) logger.error("Connector error:", error);
    }, [error, logger]);

    return <>{children}</>;
};
