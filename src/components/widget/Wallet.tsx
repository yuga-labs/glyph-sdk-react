import { memo } from "react";
import { RecoverableLazy } from "../RecoverableLazy";
import { INTERNAL_GRADIENT_TYPE } from "../../lib/constants";

const loadWallet = () => import("./WalletRuntime").then(({ Wallet }) => ({ default: Wallet }));

export const Wallet = memo(
    ({
        setGradientType
    }: {
        setGradientType: React.Dispatch<React.SetStateAction<INTERNAL_GRADIENT_TYPE | undefined>>;
    }) => <RecoverableLazy loader={loadWallet} componentProps={{ setGradientType }} />
);
