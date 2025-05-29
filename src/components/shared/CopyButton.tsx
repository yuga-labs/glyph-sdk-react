import React, { useState } from "react";
import CopyIcon from "../../assets/svg/CopyIcon";
import { cn, copyToClipboard } from "../../lib/utils";

interface CopyButtonProps {
    text: string;
    textToCopy?: string; // If different than the button text
    className?: string;
    textClassName?: string;
    iconClassName?: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({ text, textToCopy, className, textClassName, iconClassName }) => {
    const [copied, setCopied] = useState<boolean>(false);

    return (
        <button
            onClick={() => {
                const copied = copyToClipboard(textToCopy || text);
                setCopied(copied);

                setTimeout(() => {
                    setCopied(false);
                }, 2000);
            }}
            className={cn("gw-inline-flex gw-items-center gw-justify-end gw-text-brand-gray-500 gw-gap-1", className)}
        >
            <span className={textClassName}>{text}</span>
            <span>
                <CopyIcon isCopied={copied} className={cn("gw-text-secondary gw-size-4", iconClassName)} />
            </span>
        </button>
    );
};

export default React.memo(CopyButton);
