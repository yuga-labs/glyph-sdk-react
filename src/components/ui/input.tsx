import * as React from "react";
import { cn } from "../../lib/utils";
import InputHelper from "./input-helper";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: {
        value: string;
        htmlFor: string;
        className?: string;
        floatingLabel?: boolean;
    };
    leadingIcon?: {
        element: React.ReactNode;
        className?: string;
    };
    trailingIcon?: {
        element: React.ReactNode;
        className?: string;
    };
    parentClassName?: string;
    bodyClassName?: string;
    supportingText?: {
        value: string;
        isError?: boolean;
        className?: string;
    };
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    (
        {
            label,
            supportingText,
            parentClassName,
            bodyClassName,
            leadingIcon,
            trailingIcon,

            // Input tag related
            className,
            type,
            placeholder,
            ...props
        },
        ref
    ) => {
        return (
            <div className={cn("gw-typography-body2 gw-pb-3 gw-w-full", parentClassName)}>
                {label && !label.floatingLabel ? (
                    <label
                        className={cn(
                            "gw-text-brand-gray-500",
                            supportingText?.isError && "gw-text-destructive",
                            label.className
                        )}
                        htmlFor={label.htmlFor}
                    >
                        {label.value}
                    </label>
                ) : null}

                <div
                    className={cn(
                        `gw-relative gw-w-full gw-text-foreground gw-typography-body1 `,
                        supportingText?.isError && "gw-text-destructive",
                        !label?.floatingLabel && "gw-mt-1",
                        bodyClassName
                    )}
                >
                    {leadingIcon ? (
                        <div
                            className={cn(
                                `gw-absolute gw-inset-y-0 gw-left-0 gw-rounded-l-xl gw-flex gw-items-center gw-w-11 gw-pointer-events-none`,
                                props.disabled && "gw-opacity-50",
                                leadingIcon.className
                            )}
                        >
                            {leadingIcon.element}
                        </div>
                    ) : null}

                    <input
                        className={cn(
                            "gw-peer gw-flex gw-w-full gw-rounded-full gw-border-none gw-bg-background gw-outline-none gw-py-3 gw-px-5 gw-h-12 gw-shadow-sm gw-transition-all file:gw-border-0 file:gw-bg-transparent gw-placeholder-brand-gray-500 focus-visible:gw-outline-none gw-ring-1 hover:gw-ring-2 focus:gw-ring-1 focus:gw-shadow-inputFocus active:gw-shadow-inputFocus gw-ring-input focus-visible:gw-ring-secondary disabled:gw-cursor-not-allowed disabled:gw-opacity-50",
                            supportingText?.isError &&
                                "gw-ring-destructive/50 dark:gw-ring-destructive/50 hover:gw-ring-destructive focus-visible:gw-ring-destructive",
                            Boolean(leadingIcon) && "gw-pl-11",
                            Boolean(trailingIcon) && "gw-pr-11",
                            label?.floatingLabel &&
                                (supportingText?.isError
                                    ? "gw-placeholder-transparent focus:gw-placeholder-error/50"
                                    : "gw-placeholder-transparent focus:gw-placeholder-brand-gray-500"),
                            className
                        )}
                        // If passed separately will be overridden in props
                        id={label?.htmlFor}
                        // Don't allow "e" in field type number
                        onKeyDown={(evt) => {
                            if (type === "number" && evt.key === "e") {
                                evt.preventDefault();
                            }
                        }}
                        onWheelCapture={(e) => {
                            e.currentTarget.blur();
                        }}
                        // Blur when scroll happens [To not allow increment/decrement in number field on scroll inside field]
                        placeholder={!label?.floatingLabel ? placeholder : placeholder || " "}
                        ref={ref}
                        type={type}
                        {...props}
                    />
                    {label && label.floatingLabel ? (
                        <label
                            className={cn(
                                `gw-absolute gw-cursor-text gw-duration-300 gw-text-brand-gray-500 peer-placeholder-shown:gw-text-input peer-focus:gw-text-foreground gw-transform gw-typography-caption gw--translate-y-1/2 gw-scale-90 gw-top-0 gw-z-10 gw-bg-background peer-focus:gw-px-1.5 peer-placeholder-shown:gw-px-0 gw-px-1.5 gw-left-1.5 peer-focus:gw-left-1.5 peer-focus:gw-top-0 peer-focus:gw-scale-90 peer-focus:gw--translate-y-1/2 peer-placeholder-shown:gw-scale-100 peer-placeholder-shown:gw--translate-y-1/2 peer-placeholder-shown:gw-top-1/2 gw-pointer-events-none autofill:gw-bg-transparent`,
                                leadingIcon && "peer-placeholder-shown:gw-left-11",
                                trailingIcon && "peer-placeholder-shown:gw-right-11",
                                props.disabled && "gw-text-foreground/50 peer-placeholder-shown:gw-text-input/50",
                                supportingText?.isError && "gw-text-destructive",
                                label.className
                            )}
                            htmlFor={label.htmlFor}
                        >
                            {label.value}
                        </label>
                    ) : null}

                    {trailingIcon ? (
                        <div
                            className={cn(
                                `gw-absolute gw-inset-y-0 gw-flex gw-items-center gw-w-11 gw-right-0 gw-rounded-r-xl gw-pointer-events-none`,
                                props.disabled && "gw-opacity-50",
                                trailingIcon.className
                            )}
                        >
                            {trailingIcon.element}
                        </div>
                    ) : null}
                </div>

                {supportingText ? (
                    <InputHelper
                        className={supportingText?.className}
                        text={supportingText?.value}
                        type={supportingText?.isError ? "error" : "helper"}
                    />
                ) : null}
            </div>
        );
    }
);
Input.displayName = "Input";

export { Input };
