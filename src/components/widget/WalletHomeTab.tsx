import { ArrowUpDown, SendIcon } from "lucide-react";
import { PlusSign } from "../../assets/svg/PlusSign";
import { QRIcon } from "../../assets/svg/QRIcon";
import { useGlyph } from "../../hooks/useGlyph";
import { WalletView } from "../../lib/constants";
import { formatCurrency } from "../../lib/intl";
import { cn, formatTokenCount } from "../../lib/utils";
import NativeTokenIcon from "../shared/NativeTokenIcon";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import TooltipElement from "../ui/tooltip-element";

export type WalletHomeTabProps = {
    setWalletView: (view: WalletView) => void;
};

export function WalletHomeTab({ setWalletView }: WalletHomeTabProps) {
    const { user, balances, hasBalances, fetchForAllNetworks } = useGlyph();

    // We can safely fetch the native balance here without chainId check because we only show this when a single chain is selected
    const nativeBalance = balances?.tokens?.find?.((balance) => balance.native);

    const allBalances = balances?.wallet_value;
    const tokens = balances?.tokens;

    return (
        <div className="gw-w-full gw-h-full gw-p-4 gw-flex gw-flex-col gw-justify-between gw-gap-10 gw-items-center">
            {/* Balance */}
            <div
                className={cn(
                    "gw-flex gw-items-center gw-w-full gw-min-h-6",
                    fetchForAllNetworks ? "gw-justify-end" : "gw-justify-between"
                )}
            >
                {!fetchForAllNetworks ? (
                    <>
                        <h6>My Balance</h6>
                        <div className="gw-flex gw-font-medium gw-items-center gw-gap-1">
                            {!hasBalances || nativeBalance?.value === undefined ? (
                                <Skeleton className="gw-w-20 gw-h-6" />
                            ) : (
                                <>
                                    <NativeTokenIcon className="gw-size-5" />
                                    <span>
                                        {formatTokenCount(
                                            nativeBalance?.valueInWei,
                                            nativeBalance?.decimals,
                                            nativeBalance?.displayDecimals
                                        )}{" "}
                                        <span className="gw-text-brand-gray-600 gw-typography-body2">
                                            {nativeBalance?.symbol}
                                        </span>
                                    </span>
                                </>
                            )}
                        </div>
                    </>
                ) : (
                    <TooltipElement
                        description={`Portfolio value reflects fungible tokens held on supported networks only.`}
                        stopPropagation={true}
                        align="end"
                        side="left"
                    />
                )}
            </div>

            <div className="gw-flex gw-justify-center gw-items-center gw-flex-col">
                <span className="gw-typography-h2-nr">
                    {!hasBalances || allBalances?.tokens === undefined ? (
                        <Skeleton className="gw-w-20 gw-h-[3.75rem]" />
                    ) : (
                        <>
                            {formatCurrency(
                                allBalances?.tokens,
                                undefined,
                                tokens?.some((t) => BigInt(t.valueInWei) !== 0n),
                                "decimal"
                            )}
                            <span className="gw-text-foreground gw-typography-h6-nr gw-pl-0.5">
                                {allBalances?.currency || "USD"}
                            </span>
                        </>
                    )}
                </span>
                <span className="gw-typography-subtitle1 !gw-font-normal gw-text-brand-gray-600 gw-mt-2">
                    Portfolio Value
                </span>
            </div>

            {/* Actions */}
            <div className="gw-flex gw-space-x-2 gw-w-fit gw-pb-2">
                {/* Fund button */}
                <Button shadow variant="cube" size="cube" onClick={() => setWalletView(WalletView.FUND)}>
                    <span className="gw-flex gw-flex-col gw-items-center gw-justify-center gw-space-y-1 gw-mt-2">
                        <PlusSign />
                        <span>Fund</span>
                    </span>
                </Button>

                {/* Trade/Swap button */}
                <Button shadow variant="cube" size="cube" onClick={() => setWalletView(WalletView.SWAP)}>
                    <span className="gw-flex gw-flex-col gw-items-center gw-justify-center gw-space-y-1 gw-mt-2">
                        <ArrowUpDown />
                        <span>Swap</span>
                    </span>
                </Button>

                {/* Receive button */}
                <Button
                    shadow
                    variant="cube"
                    size="cube"
                    onClick={() => setWalletView(WalletView.RECEIVE)}
                    disabled={!user?.evmWallet}
                >
                    <span className="gw-flex gw-flex-col gw-items-center gw-justify-center gw-space-y-1 gw-mt-2">
                        <QRIcon />
                        <span>Receive</span>
                    </span>
                </Button>

                {/* Send button */}
                <Button
                    shadow
                    variant="cube"
                    size="cube"
                    onClick={() => setWalletView(WalletView.SEND)}
                    disabled={!user?.evmWallet}
                >
                    <span className="gw-flex gw-flex-col gw-items-center gw-justify-center gw-space-y-1 gw-mt-2">
                        <SendIcon />
                        <span>Send</span>
                    </span>
                </Button>
            </div>
        </div>
    );
}
