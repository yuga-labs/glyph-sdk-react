import { TxSendIcon } from "../../assets/svg/TxSendIcon";
import { buttonVariants } from "../ui/button";

export function LinkWithIcon({ text, url }: { text: string; url: string }) {
    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({
                variant: "link",
                size: "sm",
                className: "gw-py-0 gw-h-auto",
                scale: false
            })}
        >
            <div className="gw-inline-flex gw-items-center gw-space-x-1 gw-text-foreground gw-typography-body2">
                <span>{text}&nbsp;</span>
                <TxSendIcon className="!gw-size-2.5 gw-text-primary" />
            </div>
        </a>
    );
}
