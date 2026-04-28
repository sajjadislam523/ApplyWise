"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAppSelector } from "@/store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { user, isInitialised } = useAppSelector((s) => s.auth);
    // sidebar state
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        if (isInitialised && !user) router.replace("/auth/login");
    }, [user, isInitialised, router]);

    if (!isInitialised) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#080C10]">
                <div className="w-5 h-5 border-2 border-[#6EE7B7] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="flex min-h-screen bg-[#080C10]">
            {/* Mobile overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div
                className={`fixed z-50 inset-y-0 left-0 transform transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static `}
            >
                <Sidebar
                    onClose={() => setIsSidebarOpen(false)}
                    isOpen={isSidebarOpen}
                    className="h-full"
                />
            </div>
            <div className="flex-1 flex flex-col min-w-0">
                <Navbar
                    onMenuClick={() => setIsSidebarOpen((prev) => !prev)}
                    isOpen={isSidebarOpen}
                />
                <main className="flex-1 p-6 overflow-auto">{children}</main>
            </div>
        </div>
    );
}
