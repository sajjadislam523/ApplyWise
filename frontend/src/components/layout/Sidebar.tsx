"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
    { href: "/dashboard", label: "Dashboard", icon: "▦" },
    { href: "/jobs", label: "Applications", icon: "⊞" },
    { href: "/analytics", label: "Analytics", icon: "↗" },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-56 shrink-0 border-r border-white/[0.06] bg-[#0F1419] flex flex-col">
            <div className="h-14 flex items-center px-5 border-b border-white/[0.05]">
                <Link href="/">
                    <span className="font-display text-base font-700 tracking-tight text-white">
                        Apply<span className="text-[#6EE7B7]">wise</span>
                    </span>
                </Link>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-0.5">
                {nav.map(({ href, label, icon }) => {
                    const active =
                        pathname === href || pathname.startsWith(href + "/");
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150",
                                active
                                    ? "bg-[#6EE7B7]/10 text-[#6EE7B7] border border-[#6EE7B7]/20"
                                    : "text-[#8B98A8] hover:bg-white/[0.04] hover:text-white border border-transparent",
                            )}
                        >
                            <span className="text-base leading-none">
                                {icon}
                            </span>
                            {label}
                        </Link>
                    );
                })}
            </nav>

            <div className="px-5 py-4 border-t border-white/[0.05]">
                <p className="text-xs text-[#4A5568]">
                    Auto-expires inactive leads
                </p>
            </div>
        </aside>
    );
}
