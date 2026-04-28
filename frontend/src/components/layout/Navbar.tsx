"use client";

import { Button } from "@/components/ui/Button";
import HamburgerIcon from "@/components/ui/HamburgerIcon";
import { useLogout } from "@/hooks/useAuth";
import { useAppSelector } from "@/store";

export function Navbar({
    onMenuClick,
    isOpen,
}: {
    onMenuClick: () => void;
    isOpen: boolean;
}) {
    const user = useAppSelector((s) => s.auth.user);
    const { mutate: logout, isPending } = useLogout();

    return (
        <header
            className="h-14 border-b border-white/6 bg-[#0F1419] flex items-center
                        justify-between px-6 shrink-0"
        >
            <div className="flex items-center">
                <Button
                    variant="ghost"
                    onClick={onMenuClick}
                    className="md:hidden mr-4"
                >
                    <HamburgerIcon isOpen={isOpen} />
                </Button>
            </div>
            <div className="flex items-center gap-4">
                <span className="text-sm text-[#8B98A8]">{user?.name}</span>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => logout()}
                    loading={isPending}
                >
                    Sign out
                </Button>
            </div>
        </header>
    );
}
