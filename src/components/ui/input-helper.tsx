import type { FunctionComponent } from "react";
import { cn } from "../../lib/utils";

export interface InputHelperProps {
    type?: "error" | "helper";
    text?: string;
    className?: string;
}

const InputHelper: FunctionComponent<InputHelperProps> = ({ text, type, className }) => (
    <div className="gw-relative gw-w-full">
        {text ? (
            <p
                className={cn(
                    `gw-absolute gw-translate-y-1 gw-pr-2 gw-w-full gw-typography-caption`,
                    type === "error" ? "gw-text-destructive" : "gw-text-muted",
                    className
                )}
            >
                {text}
            </p>
        ) : null}
    </div>
);

export default InputHelper;
