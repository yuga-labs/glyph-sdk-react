import { TxSendIcon } from "../../assets/svg/TxSendIcon";
import { TxSwapIcon } from "../../assets/svg/TxSwapIcon";
import { CHAIN_NAMES } from "../../lib/constants";
import { formatCurrency } from "../../lib/intl";
import { chainIdToRelayChain, cn } from "../../lib/utils";

export interface ActivityRowProps {
    data: {
        type: string;
        type_text: string;
        status: string;
        value: string;
        amount: string;
        amount_currency: string;
        name_on_list: string | null;
        chain_id?: number; // Only pass chain_id if fetchForAllNetworks is true
    };
}

export function ActivityRow({ data }: ActivityRowProps) {
    const chain = data?.chain_id ? chainIdToRelayChain(data.chain_id) : undefined;

    return (
        <div className="gw-flex gw-items-center gw-typography-body1 gw-flex-1 gw-space-x-3">
            <span className="gw-relative gw-flex-shrink-0">
                <span
                    className={cn(
                        "gw-rounded-full gw-size-10 gw-flex-shrink-0 gw-flex gw-justify-center gw-items-center",
                        data.status === "Confirmed"
                            ? data.type === "swap"
                                ? "gw-bg-brand-swapsuccess"
                                : "gw-bg-brand-success"
                            : data.status === "Failed"
                              ? "gw-bg-destructive"
                              : "gw-bg-brand-warning"
                    )}
                >
                    {data.type === "swap" ? (
                        <TxSwapIcon />
                    ) : data.type === "receive" ? (
                        <TxSendIcon className="gw-size-3 gw-rotate-180" />
                    ) : (
                        <TxSendIcon />
                    )}
                </span>

                {chain?.iconUrl && (
                    <span
                        className={cn(
                            "gw-absolute gw-bottom-0 gw-right-0 gw-translate-x-[10%] gw-translate-y-[10%] gw-size-5 gw-rounded-full gw-bg-background"
                        )}
                    >
                        <img
                            src={chain?.iconUrl}
                            alt={CHAIN_NAMES[chain?.id] || chain?.name}
                            className="gw-rounded-full gw-size-full"
                        />
                    </span>
                )}
            </span>
            <div className="gw-w-full gw-flex gw-justify-between gw-items-center gw-flex-1">
                {/* Left side */}
                <div className="gw-max-w-[35%] gw-flex gw-flex-col gw-text-start">
                    <div className="gw-font-medium gw-capitalize">{data.type_text || data.type}</div>
                    <div
                        className={cn(
                            "gw-typography-caption",
                            data.status === "Confirmed"
                                ? "gw-text-brand-success"
                                : data.status === "Failed"
                                  ? "gw-text-destructive"
                                  : "gw-text-brand-warning"
                        )}
                    >
                        {data.status}
                    </div>
                </div>
                {/* Right side */}
                <div className="gw-max-w-[55%] gw-flex gw-flex-col gw-items-end">
                    <div className="gw-font-medium">{data.value}</div>
                    <div className="gw-typography-caption gw-text-brand-gray-500 gw-line-clamp-1">{`${data.name_on_list !== null ? data.name_on_list.toUpperCase() : formatCurrency(data.amount, data.amount_currency)}`}</div>
                </div>
            </div>
        </div>
    );
}
