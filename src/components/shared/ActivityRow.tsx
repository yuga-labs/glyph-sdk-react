import { TxSendIcon } from "../../assets/svg/TxSendIcon";
import { formatCurrency } from "../../lib/intl";
import { cn } from "../../lib/utils";

export interface ActivityRowProps {
    data: {
        type: string;
        type_text: string;
        status: string;
        value: string;
        amount: string;
        amount_currency: string;
    };
}

export function ActivityRow({ data }: ActivityRowProps) {
    return (
        <div className="gw-flex gw-items-center gw-typography-body1 gw-flex-1 gw-space-x-3">
            <div
                className={cn(
                    "gw-rounded-full gw-size-10 gw-flex-shrink-0 gw-flex gw-justify-center gw-items-center",
                    data.status === "Confirmed"
                        ? "gw-bg-brand-success"
                        : data.status === "Failed"
                          ? "gw-bg-destructive"
                          : "gw-bg-brand-warning"
                )}
            >
                {data.type === "receive" ? <TxSendIcon className="gw-size-3 gw-rotate-180" /> : <TxSendIcon />}
            </div>
            <div className="gw-flex gw-justify-between gw-items-center gw-flex-1">
                <div className="gw-flex gw-flex-col gw-text-start">
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
                <div className="gw-flex gw-flex-col gw-text-end">
                    <div className="gw-font-medium">{data.value}</div>
                    <div className="gw-typography-caption gw-text-brand-gray-500">{`${formatCurrency(data.amount, data.amount_currency)}`}</div>
                </div>
            </div>
        </div>
    );
}
