import { Providers } from "@/providers/Providers";
import type { Metadata } from "next";
import { DM_Sans, Syne } from "next/font/google";
import "./globals.css";

const syne = Syne({
    variable: "--font-syne",
    subsets: ["latin"],
    weight: ["400", "500", "600", "700", "800"],
});

const dmSans = DM_Sans({
    variable: "--font-dm-sans",
    subsets: ["latin"],
    weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
    title: "Applywise — Job Application Tracker",
    description:
        "Track every application, auto-detect stale leads, and analyse your job search.",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark">
            <body className={`${syne.variable} ${dmSans.variable} antialiased`}>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
