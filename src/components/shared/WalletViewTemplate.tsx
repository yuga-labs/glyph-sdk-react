import { cn } from "../../lib/utils";

export type SelectedView = "main" | "add-funds";

export type WalletScreenProps = {
    header?: React.ReactNode;
    content: React.ReactNode;
    footer?: React.ReactNode;
    footerCols?: boolean;
    mainFooter?: boolean;
    setView?: (view: SelectedView) => void;
    headerClassName?: string;
    footerClassName?: string;
};

export function WalletViewTemplate({ mainFooter = true, ...props }: WalletScreenProps) {
    return (
        <div className="gw-wallet-view">
            {/* Header */}
            {props.header && <div className={cn("gw-wallet-header", props.headerClassName)}>{props.header}</div>}

            {/* Content */}
            <div className="gw-wallet-content">{props.content}</div>

            {/* Footer */}
            {props.footer && (
                <div
                    className={cn(
                        `${mainFooter ? "gw-wallet-footer-nav" : "gw-wallet-footer"} ${props.footerCols ? "gw-flex-col gw-flex-nowrap gw-items-center" : "gw-flex-row gw-flex-nowrap"}`,
                        props.footerClassName
                    )}
                >
                    {props.footer}
                </div>
            )}
        </div>
    );
}
