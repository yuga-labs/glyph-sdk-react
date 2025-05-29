import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
    return (
        <Sonner
            closeButton
            theme={props.theme}
            richColors
            position="bottom-center"
            className="gw-toaster group"
            offset={8}
            toastOptions={{
                classNames: {
                    toast: "gw-toast group-[.gw-toaster]:gw-bg-background group-[.gw-toaster]:gw-text-foreground group-[.gw-toaster]:gw-border-border !gw-rounded-2xl group-[.gw-toaster]:gw-shadow-lg",
                    description: "group-[.gw-toast]:gw-text-muted-foreground",
                    actionButton: "group-[.gw-toast]:gw-bg-primary group-[.gw-toast]:gw-text-primary-foreground",
                    cancelButton: "group-[.gw-toast]:gw-bg-muted group-[.gw-toast]:gw-text-muted-foreground"
                }
            }}
            {...props}
        />
    );
};

export { Toaster };
