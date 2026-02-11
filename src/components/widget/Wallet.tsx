import { memo, useContext, useEffect, useState } from "react";
import { GlyphViewContext } from "../../context/GlyphViewContext";
import { INTERNAL_GRADIENT_TYPE, WalletMainViewTab, WalletView } from "../../lib/constants";
import { WalletFundView } from "./WalletFundView";
import { WalletMainView } from "./WalletMainView";
import { WalletProfileView } from "./WalletProfileView";
import { WalletReceiveView } from "./WalletReceiveView";
import { WalletSendFundView } from "./WalletSendFundView";
import { WalletTradeView } from "./WalletTradeView";

export const Wallet = memo(
    ({
        setGradientType
    }: {
        setGradientType: React.Dispatch<React.SetStateAction<INTERNAL_GRADIENT_TYPE | undefined>>;
    }) => {
        const viewCtx = useContext(GlyphViewContext);
        if (!viewCtx) throw new Error("GlyphWidgetWallet must be used within a GlyphViewProvider");

        const { walletMainViewTab, setWalletMainViewTab, walletView, setWalletView } = viewCtx;

        const [expandFirstActivityRow, setExpandFirstActivityRow] = useState<boolean>(false);

        // reset `expandFirstActivityRow` only when Activity tab is closed
        useEffect(() => {
            if (walletView === WalletView.MAIN && walletMainViewTab === WalletMainViewTab.ACTIVITY) return;

            setExpandFirstActivityRow(false);
        }, [walletView, walletMainViewTab, setExpandFirstActivityRow]);

        return (
            <>
                {walletView === WalletView.MAIN && (
                    <WalletMainView
                        setGradientType={setGradientType}
                        activeMainViewScreen={walletMainViewTab}
                        setActiveMainViewScreen={setWalletMainViewTab}
                        setWalletView={setWalletView}
                        expandFirstActivityRow={expandFirstActivityRow}
                    />
                )}

                {walletView === WalletView.RECEIVE && (
                    <WalletReceiveView onBack={() => setWalletView(WalletView.MAIN)} />
                )}

                {walletView === WalletView.FUND && (
                    <WalletFundView
                        onBack={() => setWalletView(WalletView.MAIN)}
                        onEnd={() => setWalletView(WalletView.MAIN)}
                        onShowActivity={() => {
                            setWalletView(WalletView.MAIN);
                            setWalletMainViewTab(WalletMainViewTab.ACTIVITY);
                            setExpandFirstActivityRow(true);
                        }}
                        setGradientType={setGradientType}
                    />
                )}
                {walletView === WalletView.SEND && (
                    <WalletSendFundView
                        onBack={() => setWalletView(WalletView.MAIN)}
                        onEnd={() => setWalletView(WalletView.MAIN)}
                        onShowActivity={() => {
                            setWalletView(WalletView.MAIN);
                            setWalletMainViewTab(WalletMainViewTab.ACTIVITY);
                            setExpandFirstActivityRow(true);
                        }}
                        setGradientType={setGradientType}
                    />
                )}

                {walletView === WalletView.PROFILE && (
                    <WalletProfileView onBack={() => setWalletView(WalletView.MAIN)} />
                )}

                {walletView === WalletView.SWAP && (
                    <WalletTradeView
                        onBack={() => setWalletView(WalletView.MAIN)}
                        onEnd={() => setWalletView(WalletView.MAIN)}
                        onShowActivity={() => {
                            setWalletView(WalletView.MAIN);
                            setWalletMainViewTab(WalletMainViewTab.ACTIVITY);
                            setExpandFirstActivityRow(true);
                        }}
                        setGradientType={setGradientType}
                    />
                )}
            </>
        );
    }
);
