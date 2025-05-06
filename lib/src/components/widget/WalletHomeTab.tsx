import { SendIcon } from "lucide-react";
import ApecoinIcon from "../../assets/svg/ApecoinIcon";
import { PlusSign } from "../../assets/svg/PlusSign";
import { QRIcon } from "../../assets/svg/QRIcon";
import { useGlyph } from "../../hooks/useGlyph";
import { formatCurrency } from "../../lib/intl";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
export type WalletHomeTabProps = {
    onAddFunds: () => void;
    onReceive: () => void;
    onSend: () => void;
};

export function WalletHomeTab({ onAddFunds, onReceive, onSend }: WalletHomeTabProps) {
    const { user, balances } = useGlyph();
    const nativeBalance = balances?.tokens?.find?.((balance) => balance.native);

    return (
        <div className="gw-w-full gw-h-full gw-p-4 gw-flex gw-flex-col gw-justify-between gw-gap-10 gw-items-center">
            {/* Balance */}
            <div className="gw-flex gw-justify-between gw-items-center gw-w-full">
                <h6>My Balance</h6>
                <div className="gw-typography-body2 gw-text-brand-gray-600">
                    <span className="amount">
                        {formatCurrency(nativeBalance?.amount, nativeBalance?.currency)} (
                        {nativeBalance?.currency || "USD"})
                    </span>
                </div>
            </div>

            <div className="gw-flex gw-justify-center gw-items-center gw-flex-col">
                <span className="gw-typography-h1-nr">
                    {nativeBalance?.value === undefined ? (
                        <Skeleton className="gw-w-20 gw-h-10" />
                    ) : (
                        `${nativeBalance?.value}`
                    )}
                </span>
                <div className="gw-inline-flex gw-items-center gw-space-x-2 gw-mt-2">
                    <ApecoinIcon className="gw-size-6" />
                    <span className="gw-typography-subtitle1 gw-text-brand-gray-600">
                        {nativeBalance?.symbol || ""}
                    </span>
                </div>
            </div>

            {/* Actions */}
            <div className="gw-flex gw-space-x-3 gw-w-fit gw-pb-2">
                {/* Fund button */}
                <Button shadow variant="cube" size="cube" onClick={onAddFunds}>
                    <span className="gw-flex gw-flex-col gw-items-center gw-justify-center gw-space-y-2 gw-mt-2">
                        <PlusSign />
                        <span>Fund</span>
                    </span>
                </Button>

                <Button shadow variant="cube" size="cube" onClick={onReceive} disabled={!user?.evmWallet}>
                    <span className="gw-flex gw-flex-col gw-items-center gw-justify-center gw-space-y-2 gw-mt-2">
                        <QRIcon />
                        <span>Receive</span>
                    </span>
                </Button>
                <Button shadow variant="cube" size="cube" onClick={onSend} disabled={!user?.evmWallet}>
                    <span className="gw-flex gw-flex-col gw-items-center gw-justify-center gw-space-y-2 gw-mt-2">
                        <SendIcon />
                        <span>Send</span>
                    </span>
                </Button>
            </div>
        </div>
    );
}
