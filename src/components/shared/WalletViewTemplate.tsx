export type SelectedView = "main" | "add-funds";

export type WalletScreenProps = {
    header?: React.ReactNode;
    content: React.ReactNode;
    footer?: React.ReactNode;
    footerCols?: boolean;
    mainFooter?: boolean;
    setView?: (view: SelectedView) => void;
};

export function WalletViewTemplate({ mainFooter = true, ...props }: WalletScreenProps) {
    return (
        <div className="gw-wallet-view">
            {/* Header */}
            {props.header && <div className="gw-wallet-header">{props.header}</div>}

            {/* Content */}
            <div className="gw-wallet-content">{props.content}</div>

            {/* Footer */}
            {props.footer && (
                <div
                    className={`${mainFooter ? "gw-wallet-footer-nav" : "gw-wallet-footer"} ${props.footerCols ? "gw-flex-col gw-flex-nowrap gw-items-center" : "gw-flex-row gw-flex-nowrap"}`}
                >
                    {props.footer}
                </div>
            )}
        </div>
    );
}
