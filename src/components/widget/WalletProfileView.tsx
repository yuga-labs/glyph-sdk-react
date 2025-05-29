import profileGradient from "../../assets/images/profile-gradient.png";
import EditIcon from "../../assets/svg/EditIcon";
import { useGlyph } from "../../hooks/useGlyph";
import { cn } from "../../lib/utils";
import UserAvatar from "../shared/UserAvatar";
import WalletViewHeader from "../shared/WalletViewHeader";
import { WalletViewTemplate } from "../shared/WalletViewTemplate";
import { Button } from "../ui/button";

export type WalletProfileProps = {
    onBack: () => void;
};

export function WalletProfileView({ onBack }: WalletProfileProps) {
    const { user, logout, glyphUrl } = useGlyph();
    const editUrl = new URL("/profile/edit", glyphUrl).toString();

    return (
        <WalletViewTemplate
            header={
                <WalletViewHeader
                    fullScreenHeader={{
                        title: "Profile",
                        onBackClick: onBack
                    }}
                />
            }
            content={
                <div className="gw-w-full gw-flex gw-flex-col gw-h-full">
                    <div className="gw-flex gw-flex-col gw-relative gw-justify-center gw-items-center gw-p-4 gw-overflow-hidden gw-h-32">
                        <Button
                            variant={"tertiary"}
                            shadow
                            onClick={() => {
                                window.open(editUrl, "_blank");
                            }}
                            className="gw-absolute gw-group gw-rounded-full !gw-ring-0 gw-h-8 gw-px-2.5 gw-gap-0 gw-top-2 gw-right-2 gw-z-10 gw-inline-flex gw-items-center"
                        >
                            <span
                                className={cn(
                                    `group-hover:gw-w-16 gw-w-0 gw-overflow-hidden gw-whitespace-nowrap gw-transition-all gw-duration-300 gw-text-xs`
                                )}
                            >
                                Edit Profile
                            </span>
                            <EditIcon className="!gw-size-3" />
                        </Button>
                        <img
                            src={profileGradient}
                            alt="profile-gradient"
                            className="gw-absolute gw-top-0 gw-left-0 gw-w-full gw-h-full gw-object-cover"
                        />
                    </div>

                    <div className="gw-relative gw-z-10 gw-flex gw-flex-col gw-items-center gw-justify-center -gw-translate-y-1/2 gw-top-4 gw-typography-h6-nr">
                        <UserAvatar className="gw-size-28 gw-border-popover gw-border-4" />
                        <div className="gw-mt-4 gw-font-bold">{user?.name}</div>
                    </div>

                    <div className="gw-p-4 gw-flex-1 gw-flex gw-flex-col gw-justify-end gw-items-center gw-w-full">
                        <div className="gw-flex gw-flex-col gw-space-y-3 gw-w-full">
                            <Button
                                variant="tertiary"
                                className="gw-w-full"
                                onClick={() => {
                                    window.open(editUrl, "_blank");
                                }}
                            >
                                Edit Profile on Glyph Dashboard
                            </Button>

                            <Button variant="outline" className="gw-w-full" onClick={logout}>
                                Log Out
                            </Button>
                        </div>
                    </div>
                </div>
            }
        />
    );
}
