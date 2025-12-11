import GlyphIcon from "../assets/svg/GlyphIcon";
import { WalletIcon } from "../assets/svg/WalletIcon";
import { useGlyph } from "../hooks/useGlyph";
import { formatCurrency } from "../lib/intl";
import { cn, formatTokenCount } from "../lib/utils";
import { GlyphWidgetButtonProps } from "../types";
import UserAvatar from "./shared/UserAvatar";
import { Skeleton } from "./ui/skeleton";

export const GlyphWidgetButton = ({
    showAvatar = true,
    showBalance = true,
    showUsername = true
}: GlyphWidgetButtonProps) => {
    const { user, balances, hasBalances, fetchForAllNetworks } = useGlyph();

    // We can safely fetch the native balance here without chainId check because we only show this when a single chain is selected
    const nativeBalance = balances?.tokens?.find?.((balance) => balance.native);
    const allBalances = balances?.wallet_value;
    const tokens = balances?.tokens;

    const allValuesVisible = showAvatar && showBalance && showUsername;

    return (
        <div
            className={`gw-inline-flex gw-items-center gw-bg-background gw-rounded-full gw-h-[3.25rem] gw-text-foreground gw-font-display gw-font-medium gw-shadow-buttonMd ${showAvatar && !(showBalance || showUsername) ? "gw-px-2" : "gw-px-3"}`}
        >
            {showBalance && (
                <>
                    <div className={cn(allValuesVisible && "max-sm:gw-hidden", "gw-pl-1")}>
                        <WalletIcon className="gw-size-6" />
                    </div>
                    {!fetchForAllNetworks &&
                        (!hasBalances || nativeBalance?.value === undefined ? (
                            <div
                                className={cn(
                                    allValuesVisible && "max-sm:gw-hidden",
                                    "gw-pl-1 gw-pr-2.5 gw-inline-flex gw-items-center"
                                )}
                            >
                                <Skeleton className="gw-w-16 gw-h-5 gw-inline-block" />
                            </div>
                        ) : (
                            <div className={cn(allValuesVisible && "max-sm:gw-hidden", "gw-pl-1 gw-pr-2.5")}>
                                {formatTokenCount(
                                    nativeBalance?.valueInWei,
                                    nativeBalance?.decimals,
                                    nativeBalance?.displayDecimals
                                )}{" "}
                                {nativeBalance?.symbol}
                            </div>
                        ))}
                    {fetchForAllNetworks &&
                        (!hasBalances || allBalances?.total === undefined ? (
                            <div
                                className={cn(
                                    allValuesVisible && "max-sm:gw-hidden",
                                    "gw-pl-1 gw-pr-2.5 gw-inline-flex gw-items-center"
                                )}
                            >
                                <Skeleton className="gw-w-16 gw-h-5 gw-inline-block" />
                            </div>
                        ) : (
                            <div className={cn(allValuesVisible && "max-sm:gw-hidden", "gw-pl-1 gw-pr-2.5")}>
                                {formatCurrency(
                                    allBalances?.tokens,
                                    allBalances?.currency,
                                    tokens?.some((t) => BigInt(t.valueInWei) !== 0n)
                                )}
                            </div>
                        ))}
                </>
            )}
            {showAvatar && (
                <div className="gw-flex-shrink-0">
                    <UserAvatar className="gw-size-9" />
                </div>
            )}
            {showUsername && <div className="gw-px-2">{user?.name || ""}</div>}

            {!showBalance && !showAvatar && !showUsername && <GlyphIcon className="gw-size-7" />}
        </div>
    );
};
