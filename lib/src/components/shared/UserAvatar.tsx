import React from "react";
import { useGlyph } from "../../hooks/useGlyph";
import { cn, ethereumAvatar } from "../../lib/utils";
import { Skeleton } from "../ui/skeleton";

interface UserAvatarProps {
    className?: string;
    overrideUrl?: string;
    overrideAlt?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ className, overrideUrl, overrideAlt }) => {
    const { user, ready, authenticated } = useGlyph();

    if (!ready || !authenticated) {
        return <Skeleton className={cn("gw-size-10 gw-rounded-full", className)} />;
    }

    return (
        <>
            <img
                alt={overrideAlt || user?.name || ""}
                src={overrideUrl || user?.picture || ethereumAvatar(user?.evmWallet)}
                className={cn("gw-size-10 gw-rounded-full gw-object-cover", className)}
                onError={
                    overrideUrl
                        ? undefined
                        : (e) => {
                              e.currentTarget.src = ethereumAvatar(user?.evmWallet);
                              e.currentTarget.onerror = null;
                          }
                }
            />
        </>
    );
};

export default React.memo(UserAvatar);
