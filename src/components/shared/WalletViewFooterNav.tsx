import { memo } from "react";
import ActivityIcon from "../../assets/svg/ActivityIcon";
import HomeIcon from "../../assets/svg/HomeIcon";
import TokensIcon from "../../assets/svg/TokensIcon";
import WalletsTabFilledIcon from "../../assets/svg/WalletsTabFilledIcon";
import WalletsTabOutlinedIcon from "../../assets/svg/WalletsTabOutlinedIcon";
import { useGlyph } from "../../hooks/useGlyph";
import { WalletMainViewTab } from "../../lib/constants";
import { cn } from "../../lib/utils";

interface WalletViewFooterNavProps {
    tab: WalletMainViewTab;
    setTab: (tab: WalletMainViewTab) => void;
}

const WalletViewFooterNav: React.FC<WalletViewFooterNavProps> = ({ tab, setTab }) => {
    const { user } = useGlyph();

    return (
        <>
            <button className="tab" onClick={() => setTab(WalletMainViewTab.HOME)}>
                <HomeIcon
                    className={cn(
                        tab === WalletMainViewTab.HOME
                            ? "gw-fill-secondary gw-text-secondary"
                            : "gw-text-brand-gray-600",
                        "gw-size-5"
                    )}
                />
                <span className="gw-sr-only">Home</span>
            </button>

            <button className="tab" onClick={() => setTab(WalletMainViewTab.TOKENS)}>
                <TokensIcon
                    className={cn(
                        tab === WalletMainViewTab.TOKENS
                            ? "gw-fill-secondary gw-text-secondary"
                            : "gw-text-brand-gray-600",
                        "gw-size-5"
                    )}
                />
                <span className="gw-sr-only">Tokens & NFTs</span>
            </button>

            {/* Replace the button below with discover once we reach that point */}
            {/* <button className="tab" onClick={() => setTab(WalletMainViewTab.NFTS)}>
                <NFTsIcon selected={tab === WalletMainViewTab.NFTS} />
                <span className="gw-sr-only">NFTs</span>
            </button> */}

            {/* Only show Wallets tab button for Glyph users */}
            {user?.hasProfile && (
                <button className="tab" onClick={() => setTab(WalletMainViewTab.LINKED_ACCOUNTS)}>
                    {tab === WalletMainViewTab.LINKED_ACCOUNTS ? (
                        <WalletsTabFilledIcon className={"gw-text-secondary gw-h-5 gw-pb-px"} />
                    ) : (
                        <WalletsTabOutlinedIcon className={"gw-text-brand-gray-600 gw-h-5"} />
                    )}
                    <span className="gw-sr-only">Linked Accounts</span>
                </button>
            )}

            <button className="tab" onClick={() => setTab(WalletMainViewTab.ACTIVITY)}>
                <ActivityIcon
                    isActive={tab === WalletMainViewTab.ACTIVITY}
                    className={cn(
                        tab === WalletMainViewTab.ACTIVITY
                            ? "gw-fill-secondary gw-text-secondary"
                            : "gw-text-brand-gray-600",
                        "gw-size-6"
                    )}
                />
                <span className="gw-sr-only">Activity</span>
            </button>
        </>
    );
};

export default memo(WalletViewFooterNav);
