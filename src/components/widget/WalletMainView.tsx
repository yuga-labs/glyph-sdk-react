import { useEffect } from "react";
import { INTERNAL_GRADIENT_TYPE, WalletMainViewTab, WalletView } from "../../lib/constants";
import WalletViewFooterNav from "../shared/WalletViewFooterNav";
import WalletViewHeader from "../shared/WalletViewHeader";
import { WalletViewTemplate } from "../shared/WalletViewTemplate";
import { WalletActivityTab } from "./WalletActivityTab";
import { WalletHomeTab } from "./WalletHomeTab";
import { WalletLinkedAccountsTab } from "./WalletLinkedAccountsTab";
import { WalletNFTsTab } from "./WalletNFTsTab";
import { WalletTokensTab } from "./WalletTokensTab";
import { WalletTokenVSNftSwitcher } from "./internal/WalletTokenVsNftSwitcher";

export type WalletMainProps = {
    setWalletView: (view: WalletView) => void;
    activeMainViewScreen: WalletMainViewTab;
    setActiveMainViewScreen: (screen: WalletMainViewTab) => void;
    expandFirstActivityRow?: boolean;
    setGradientType: React.Dispatch<React.SetStateAction<INTERNAL_GRADIENT_TYPE | undefined>>;
};

export function WalletMainView({
    setWalletView,
    activeMainViewScreen,
    setActiveMainViewScreen,
    expandFirstActivityRow = false,
    setGradientType
}: WalletMainProps) {
    // Set the gradient type to primary when the main view is opened
    useEffect(() => {
        setGradientType(INTERNAL_GRADIENT_TYPE.PRIMARY);

        // Reset the gradient type when the main view is closed
        return () => {
            setGradientType(undefined);
        };
    }, [setGradientType]);

    return (
        <WalletViewTemplate
            header={<WalletViewHeader onProfileClick={() => setWalletView(WalletView.PROFILE)} />}
            content={
                <>
                    {/* Home Tab */}
                    {activeMainViewScreen === WalletMainViewTab.HOME && <WalletHomeTab setWalletView={setWalletView} />}

                    {[WalletMainViewTab.TOKENS, WalletMainViewTab.NFTS].includes(activeMainViewScreen) && (
                        <div className="gw-flex gw-flex-col gw-h-full">
                            {/* Token vs NFT Switcher */}
                            <WalletTokenVSNftSwitcher
                                activeTab={activeMainViewScreen}
                                setActiveTab={setActiveMainViewScreen}
                            />
                            {/* Tokens Tab */}
                            {activeMainViewScreen === WalletMainViewTab.TOKENS && <WalletTokensTab />}
                            {/* NFTs Tab */}
                            {activeMainViewScreen === WalletMainViewTab.NFTS && <WalletNFTsTab />}
                        </div>
                    )}

                    {/* Linked Accounts Tab */}
                    {activeMainViewScreen === WalletMainViewTab.LINKED_ACCOUNTS && <WalletLinkedAccountsTab />}
                    {/* Activity Tab */}
                    {activeMainViewScreen === WalletMainViewTab.ACTIVITY && (
                        <WalletActivityTab expandFirst={expandFirstActivityRow} />
                    )}
                </>
            }
            footer={<WalletViewFooterNav tab={activeMainViewScreen} setTab={setActiveMainViewScreen} />}
        />
    );
}
