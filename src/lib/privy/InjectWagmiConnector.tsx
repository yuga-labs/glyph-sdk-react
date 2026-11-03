import { useEffect } from "react";
import { useConfig } from "wagmi";
import { glyphConnectorDetails } from "../constants";
import { createLogger, wagmiCrossAppConnector } from "../utils";
import { usePrivyCrossAppProvider } from "./usePrivyCrossAppProvider";

const logger = createLogger("InjectWagmiConnector");

export const InjectWagmiConnector = ({ children, useStagingTenant }: {
    children: React.ReactNode;
    useStagingTenant?: boolean;
}) => {
    const wagmiConfig = useConfig();
    const { ready, provider } = usePrivyCrossAppProvider({ chains: wagmiConfig.chains, useStagingTenant });

    useEffect(() => {
        if (!ready || !provider) return;
        let retired = false;
        const listeners: Array<{ event: Parameters<typeof provider.on>[0]; listener: (...args: any[]) => void }> = [];
        const wrappedProvider = new Proxy(provider, {
            get(target, property) {
                if (property === "on") return (event: Parameters<typeof provider.on>[0], listener: (...args: any[]) => void) => {
                    if (!retired) { listeners.push({ event, listener }); target.on(event, listener); }
                };
                if (property === "removeListener") return (event: Parameters<typeof provider.on>[0], listener: (...args: any[]) => void) => {
                    target.removeListener(event, listener);
                    const index = listeners.findIndex((entry) => entry.event === event && entry.listener === listener);
                    if (index !== -1) listeners.splice(index, 1);
                };
                const value = Reflect.get(target, property);
                return typeof value === "function" ? value.bind(target) : value;
            }
        });
        const connector = wagmiConfig._internal.connectors.setup(wagmiCrossAppConnector(wrappedProvider, useStagingTenant));
        const connect = connector.connect.bind(connector);
        connector.connect = async (...args) => {
            if (retired) throw new Error("Connector is retired");
            const result = await connect(...args);
            if (retired) throw new Error("Connector is retired");
            return result;
        };
        wagmiConfig._internal.connectors.setState([...wagmiConfig.connectors, connector]);
        const dispose = () => {
            retired = true;
            for (const { event, listener } of listeners.splice(0)) provider.removeListener(event, listener);
            const events = wagmiConfig._internal.events;
            connector.emitter.off("connect", events.connect);
            connector.emitter.off("change", events.change);
            connector.emitter.off("disconnect", events.disconnect);
            wagmiConfig._internal.connectors.setState(wagmiConfig.connectors.filter((item) => item !== connector));
            wagmiConfig.setState((state) => {
                if (!state.connections.has(connector.uid)) return state;
                const connections = new Map(state.connections);
                connections.delete(connector.uid);
                const current = state.current === connector.uid ? (connections.keys().next().value ?? null) : state.current;
                return { ...state, connections, current, status: connections.size ? state.status : "disconnected" };
            });
        };
        void (async () => {
            try {
                await wagmiConfig.storage?.removeItem(`${glyphConnectorDetails.id}.disconnected`);
                if (retired || !await connector.isAuthorized() || retired) return;
                const data = await connector.connect({ isReconnecting: true });
                if (retired || !data.accounts.length) return;
                const events = wagmiConfig._internal.events;
                connector.emitter.off("connect", events.connect);
                connector.emitter.on("change", events.change);
                connector.emitter.on("disconnect", events.disconnect);
                wagmiConfig.setState((state) => ({
                    ...state,
                    connections: new Map(state.connections).set(connector.uid, { ...data, accounts: data.accounts as readonly [`0x${string}`, ...`0x${string}`[]], connector }),
                    current: state.current ?? connector.uid,
                    status: "connected"
                }));
            } catch {
                if (!retired) logger.error("Failed to setup or reconnect connector");
            }
        })();
        return dispose;
    }, [ready, provider, useStagingTenant, wagmiConfig]);

    return <>{children}</>;
};
