import react, { useContext, useEffect, useState, PropsWithChildren } from "react";
import { WalletMainViewTab, WalletView } from "../lib/constants";
import { createLogger } from "../lib/utils";
import { GlyphViewType } from "../types";
import { GlyphUserDataContext } from "./GlyphUserDataContext";
import { GlyphViewContext } from "./GlyphViewContext";

const INITIAL_WALLET_VIEW = WalletView.MAIN;
const INITIAL_WALLET_MAIN_VIEW_TAB = WalletMainViewTab.HOME;

const logger = createLogger("GlyphViewProvider");

export const GlyphViewProvider: react.FC<PropsWithChildren> = ({ children }) => {
    const context = useContext(GlyphUserDataContext);
    if (!context) throw new Error("GlyphViewProvider must be used within GlyphProvider");

    const { user } = context;
    const [walletView, setWalletView] = useState<WalletView>(INITIAL_WALLET_VIEW);
    const [walletMainViewTab, setWalletMainViewTab] = useState<WalletMainViewTab>(INITIAL_WALLET_MAIN_VIEW_TAB);
    // initially closed (see `walletOpen` above)
    const [glyphView, setGlyphView] = useState<GlyphViewType>(GlyphViewType.CLOSED);

    // handle changes on `glyphView`
    useEffect(() => {
        switch (glyphView) {
            case GlyphViewType.CLOSED:
                break;
            // reset
            case GlyphViewType.OPEN:
                setWalletView(INITIAL_WALLET_VIEW);
                setWalletMainViewTab(INITIAL_WALLET_MAIN_VIEW_TAB);
                break;
            // non main views
            case GlyphViewType.FUND:
                setWalletView(WalletView.FUND);
                break;
            case GlyphViewType.SWAP:
                setWalletView(WalletView.SWAP);
                break;
            case GlyphViewType.SEND:
                setWalletView(WalletView.SEND);
                break;
            case GlyphViewType.RECEIVE:
                setWalletView(WalletView.RECEIVE);
                break;
            case GlyphViewType.PROFILE:
                if (user?.hasProfile) setWalletView(WalletView.PROFILE);
                else {
                    logger.warn("Cannot open Profile view for a non-Glyph user - directing to Home view");
                    setGlyphView(GlyphViewType.OPEN);
                }
                break;
            // MAIN by default uses HOME screen
            case GlyphViewType.MAIN:
                setWalletView(WalletView.MAIN);
                setWalletMainViewTab(GlyphViewType.HOME);
                break;
            // these others are subviews of MAIN
            case GlyphViewType.LINKED_ACCOUNTS:
                if (user?.hasProfile) {
                    setWalletView(WalletView.MAIN);
                    setWalletMainViewTab(GlyphViewType.LINKED_ACCOUNTS);
                } else {
                    logger.warn("Cannot open Linked Accounts view for a non-Glyph user - directing to Home view");
                    setGlyphView(GlyphViewType.OPEN);
                }
                break;
            case GlyphViewType.HOME:
            case GlyphViewType.ACTIVITY:
            case GlyphViewType.TOKENS:
            case GlyphViewType.NFTS:
                setWalletView(WalletView.MAIN);
                setWalletMainViewTab(glyphView);
                break;
            default:
                break;
        }
    }, [glyphView, user?.hasProfile]);

    return (
        <GlyphViewContext.Provider
            value={{
                glyphView,
                setGlyphView,
                walletView,
                setWalletView,
                walletMainViewTab,
                setWalletMainViewTab
            }}
        >
            {children}
        </GlyphViewContext.Provider>
    );
};
