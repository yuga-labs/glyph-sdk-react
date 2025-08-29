import { useGlyph } from "../hooks/useGlyph";
import { Button } from "./ui/button";

export const LogoutButton = () => {
    const { logout } = useGlyph();

    return (
        <Button className="gw-w-full" variant={"outline"} onClick={logout}>
            Logout
        </Button>
    );
};
