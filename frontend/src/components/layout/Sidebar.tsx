"use client";

import HamburgerIcon from "@/components/ui/HamburgerIcon";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IoMdBriefcase } from "react-icons/io";
import { IoAnalyticsOutline } from "react-icons/io5";
import { MdOutlineDashboard } from "react-icons/md";

const nav = [
    { href: "/dashboard", label: "Dashboard", icon: <MdOutlineDashboard /> },
    { href: "/jobs", label: "Applications", icon: <IoMdBriefcase /> },
    { href: "/analytics", label: "Analytics", icon: <IoAnalyticsOutline /> },
];

export function Sidebar({
    className,
    onClose,
    isOpen,
}: {
    className?: string;
    onClose?: () => void;
    isOpen: boolean;
}) {
    const pathname = usePathname();

    return (
        <aside
            className={`w-56 shrink-0 border-r border-white/6 bg-[#0F1419] flex flex-col ${className}`}
        >
            <div className="h-14 flex items-center px-5 border-b border-white/5 justify-between">
                <Link href="/" className="inline-block">
                    <span className="font-display text-base font-700 tracking-tight text-white">
                        Apply<span className="text-[#6EE7B7]">wise</span>
                    </span>
                </Link>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close navigation menu"
                    aria-controls="sidebar-nav"
                    className="md:hidden p-2 -mr-2 rounded-lg text-white touch-manipulation
                               hover:bg-white/5 transition-colors
                               focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white/30"
                >
                    <HamburgerIcon isOpen={isOpen} />
                </button>
            </div>

            <nav id="sidebar-nav" className="flex-1 px-3 py-4 space-y-0.5">
                {nav.map(({ href, label, icon }) => {
                    const active =
                        pathname === href || pathname.startsWith(href + "/");
                    return (
                        <Link
                            key={href}
                            href={href}
                            onClick={() => {
                                if (window.innerWidth < 768) {
                                    onClose?.();
                                }
                            }}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm touch-manipulation",
                                "transition-[color,background-color,border-color] duration-150",
                                "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#6EE7B7]/50",
                                active
                                    ? "bg-[#6EE7B7]/10 text-[#6EE7B7] border border-[#6EE7B7]/20"
                                    : "text-[#8B98A8] hover:bg-white/4 hover:text-white border border-transparent",
                            )}
                        >
                            <span aria-hidden="true" className="text-base leading-none">
                                {icon}
                            </span>
                            {label}
                        </Link>
                    );
                })}
            </nav>

            <div className="px-5 py-4 border-t border-white/5">
                <p className="text-xs text-[#4A5568]">
                    Auto-expires inactive leads
                </p>
            </div>
        </aside>
    );
}
