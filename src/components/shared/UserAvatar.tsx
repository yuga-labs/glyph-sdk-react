import { memo } from "react";
import { useGlyph } from "../../hooks/useGlyph";
import { cn, ethereumAvatar, TWITTER_IMAGE_URL_REGEX } from "../../lib/utils";
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

    let src = overrideUrl || user?.picture || ethereumAvatar(user?.evmWallet);
    // To get the full size image, we need to replace "_normal." with "."
    if (src.match(TWITTER_IMAGE_URL_REGEX)) {
        src = src.replace("_normal.", ".");
    }

    return (
        <>
            <img
                alt={overrideAlt || user?.name || ""}
                src={src}
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

export default memo(UserAvatar);
