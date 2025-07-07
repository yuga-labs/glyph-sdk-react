import { useEffect } from "react";
import { INTERNAL_GRADIENT_TYPE, WalletMainViewTab } from "../../lib/constants";
import WalletViewFooterNav from "../shared/WalletViewFooterNav";
import WalletViewHeader from "../shared/WalletViewHeader";
import { WalletViewTemplate } from "../shared/WalletViewTemplate";
import { WalletActivityTab } from "./WalletActivityTab";
import { WalletHomeTab } from "./WalletHomeTab";
import { WalletLinkedAccountsTab } from "./WalletLinkedAccountsTab";
import { WalletTokensTab } from "./WalletTokensTab";
import { WalletNFTsTab } from "./WalletNFTsTab";

export type WalletMainProps = {
    onProfileClick: () => void;
    onAddFunds: () => void;
    onSendFunds: () => void;
    onReceive: () => void;
    activeMainViewScreen: WalletMainViewTab;
    setActiveMainViewScreen: (screen: WalletMainViewTab) => void;
    expandFirstActivityRow?: boolean;
    setGradientType: React.Dispatch<React.SetStateAction<INTERNAL_GRADIENT_TYPE | undefined>>;
};

export function WalletMainView({
    onAddFunds,
    onSendFunds,
    onReceive,
    onProfileClick,
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
            header={<WalletViewHeader onProfileClick={onProfileClick} />}
            content={
                <>
                    {/* Home Tab */}
                    {activeMainViewScreen === WalletMainViewTab.HOME && (
                        <WalletHomeTab onAddFunds={onAddFunds} onReceive={onReceive} onSend={onSendFunds} />
                    )}
                    {/* Activity Tab */}
                    {activeMainViewScreen === WalletMainViewTab.ACTIVITY && (<WalletActivityTab expandFirst={expandFirstActivityRow} />)}
                    {/* Linked Accounts Tab */}
                    {activeMainViewScreen === WalletMainViewTab.LINKED_ACCOUNTS && <WalletLinkedAccountsTab />}
                    {/* Tokens Tab */}
                    {activeMainViewScreen === WalletMainViewTab.TOKENS && <WalletTokensTab />}
                    {/* NFTs Tab */}
                    {activeMainViewScreen === WalletMainViewTab.NFTS && <WalletNFTsTab />}
                </>
            }
            footer={<WalletViewFooterNav tab={activeMainViewScreen} setTab={setActiveMainViewScreen} />}
        />
    );
}
