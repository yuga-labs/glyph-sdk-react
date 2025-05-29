import { FC, memo } from "react";
import { useGlyph } from "../hooks/useGlyph";
import { Button } from "./ui/button";

const LogoutButton: FC = () => {
    const { logout } = useGlyph();

    return (
        <Button className="gw-w-full" variant={"outline"} onClick={logout}>
            Logout
        </Button>
    );
};

LogoutButton.displayName = "LogoutButton";
export default memo(LogoutButton);
