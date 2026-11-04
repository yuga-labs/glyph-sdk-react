import { memo } from "react";
import { RecoverableLazy } from "../RecoverableLazy";
import { INTERNAL_GRADIENT_TYPE } from "../../lib/constants";
import { WidgetLoadingShell } from "../WidgetDataState";

const loadWallet = () => import("./WalletRuntime").then(({ Wallet }) => ({ default: Wallet }));

export function preloadWallet() {
    // Speculative imports must not report errors before the user opens the wallet.
    // RecoverableLazy owns the visible error and reload action on actual use.
    void loadWallet().catch(() => {});
}

export const Wallet = memo(
    ({
        setGradientType
    }: {
        setGradientType: React.Dispatch<React.SetStateAction<INTERNAL_GRADIENT_TYPE | undefined>>;
    }) => <RecoverableLazy loader={loadWallet} componentProps={{ setGradientType }} fallback={<WidgetLoadingShell />} />
);
