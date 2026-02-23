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
    isStickyHeader: boolean;
};

export function WalletViewTemplate({ mainFooter = true, isStickyHeader, ...props }: WalletScreenProps) {
    return (
        <div
            className={cn("gw-wallet-view", "gw-overflow-y-auto")}
            style={{
                scrollbarGutter: "stable"
            }}
        >
            {/* Header */}
            {props.header && (
                <div
                    className={cn(
                        "gw-wallet-header",
                        isStickyHeader ? "gw-sticky gw-top-0 gw-z-10" : "",
                        props.headerClassName
                    )}
                >
                    {props.header}
                </div>
            )}

            {/* Content */}
            <div className="gw-wallet-content">{props.content}</div>

            {/* Footer */}
            {props.footer && (
                <div
                    className={cn(
                        `${mainFooter ? "gw-wallet-footer-nav gw-sticky gw-z-10 gw-rounded-full gw-m-4 gw-bottom-4 gw-right-4 gw-mt-0" + " " + "gw-bg-brand-white/40 gw-backdrop-blur-sm gw-border gw-border-brand-white/20 gw-shadow-liquid" : "gw-wallet-footer"} ${props.footerCols ? "gw-flex-col gw-flex-nowrap gw-items-center" : "gw-flex-row gw-flex-nowrap"}`,
                        props.footerClassName
                    )}
                >
                    {props.footer}
                </div>
            )}
        </div>
    );
}
