import { QRCodeSVG } from "qrcode.react";
import { useEffect } from "react";
import { toast } from "sonner";
import truncateEthAddress from "truncate-eth-address";
import Icon from "../../assets/images/icon.png";
import { useBalances } from "../../hooks/useBalances";
import { useGlyph } from "../../hooks/useGlyph";
import CopyButton from "../shared/CopyButton";
import WalletViewHeader from "../shared/WalletViewHeader";
import { WalletViewTemplate } from "../shared/WalletViewTemplate";
import { buttonVariants } from "../ui/button";

const BALANCE_REFRESH_INTERVAL_MS = 5 * 1000;

export type WalletReceiveProps = {
    onBack: () => void;
};

export function WalletReceiveView({ onBack }: WalletReceiveProps) {
    const { ready, user } = useGlyph();
    const { refreshBalances, balances } = useBalances();

    useEffect(() => {
        if (!ready) return;

        const interval = setInterval(
            () =>
                refreshBalances(
                    true,
                    balances?.tokens.reduce(
                        (acc, token) => ({
                            ...acc,
                            [token.symbol]: (amount: number) => toast.success(`Received ${amount} ${token.symbol}`)
                        }),
                        {}
                    )
                ),
            BALANCE_REFRESH_INTERVAL_MS
        );
        return () => clearInterval(interval);
    }, [ready, refreshBalances, balances]);

    return (
        <WalletViewTemplate
            header={
                <WalletViewHeader
                    fullScreenHeader={{
                        title: "Receive",
                        onBackClick: onBack
                    }}
                />
            }
            content={
                <div className="gw-w-full gw-p-4 gw-flex gw-flex-col gw-items-center gw-justify-evenly gw-space-y-6 gw-h-full">
                    <div className="gw-bg-primary gw-rounded-3xl gw-p-2 gw-shadow-lg">
                        <QRCodeSVG
                            value={user!.evmWallet!}
                            width={180}
                            height={180}
                            className="gw-rounded-2xl gw-p-3 gw-bg-background"
                            imageSettings={{
                                src: Icon,
                                height: 24,
                                width: 24,
                                excavate: true
                            }}
                        />
                    </div>

                    <div className="gw-flex gw-flex-col gw-items-center gw-space-y-2 gw-justify-center">
                        <h6>{user?.name}</h6>
                        <span className="gw-text-brand-gray-500">{truncateEthAddress(user!.evmWallet!)}</span>
                    </div>

                    <div className="gw-flex gw-items-center gw-w-full">
                        <div className="gw-h-0 gw-border-b gw-w-full gw-flex-1 gw-border-brand-gray-500 gw-mr-4" />
                        <span className="gw-text-brand-gray-500 gw-typography-body2">or</span>
                        <div className="gw-h-0 gw-border-b gw-w-full gw-flex-1 gw-border-brand-gray-500 gw-ml-4" />
                    </div>

                    <CopyButton
                        text="Copy Wallet Address"
                        textToCopy={user?.evmWallet}
                        className={buttonVariants({
                            variant: "default",
                            size: "default",
                            className: "gw-w-full"
                        })}
                        iconClassName="gw-text-secondary-foreground"
                    />
                </div>
            }
        />
    );
}
