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
                <button
                    type="button"
                    onClick={onMenuClick}
                    aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
                    aria-expanded={isOpen}
                    aria-controls="sidebar-nav"
                    className="md:hidden mr-4 p-2 -ml-2 rounded-lg text-white touch-manipulation
                               hover:bg-white/5 transition-colors
                               focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white/30"
                >
                    <HamburgerIcon isOpen={isOpen} />
                </button>
            </div>
            <div className="flex items-center gap-4 min-w-0">
                <span className="text-sm text-[#8B98A8] truncate max-w-48">{user?.name}</span>
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
