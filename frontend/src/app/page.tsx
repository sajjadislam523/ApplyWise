"use client";

import { useAppSelector } from "@/store";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/* ── animation helpers ─────────────────────────────────────────────────── */
const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 28 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] },
});

const fadeIn = (delay = 0) => ({
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.8, delay },
});

/* ── tiny counter hook ─────────────────────────────────────────────────── */
function useCounter(target: number, duration = 1800) {
    const [value, setValue] = useState(0);
    useEffect(() => {
        let start: number;
        const step = (ts: number) => {
            if (!start) start = ts;
            const progress = Math.min((ts - start) / duration, 1);
            setValue(Math.floor(progress * target));
            if (progress < 1) requestAnimationFrame(step);
        };
        const raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
    }, [target, duration]);
    return value;
}

/* ── stat counter card ─────────────────────────────────────────────────── */
function StatCounter({
    value,
    suffix,
    label,
}: {
    value: number;
    suffix: string;
    label: string;
}) {
    const count = useCounter(value);
    return (
        <div className="text-center">
            <div className="font-display text-4xl font-bold text-white tabular-nums">
                {count}
                {suffix}
            </div>
            <div className="mt-1 text-sm text-[#8B98A8]">{label}</div>
        </div>
    );
}

/* ── feature card ──────────────────────────────────────────────────────── */
function FeatureCard({
    icon,
    title,
    desc,
    delay,
}: {
    icon: string;
    title: string;
    desc: string;
    delay: number;
}) {
    return (
        <motion.div
            {...fadeUp(delay)}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="group relative rounded-2xl border border-white/[0.07] bg-white/3 p-6 backdrop-blur-xs
                 hover:border-[#6EE7B7]/30 hover:bg-white/6 transition-colors duration-300"
        >
            {/* glow on hover */}
            <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500
                      bg-linear-to-br from-[#6EE7B7]/5 to-transparent pointer-events-none"
            />
            <div
                className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl
                      bg-[#6EE7B7]/10 text-2xl"
            >
                {icon}
            </div>
            <h3 className="font-display text-base font-600 text-white mb-2">
                {title}
            </h3>
            <p className="text-sm text-[#8B98A8] leading-relaxed">{desc}</p>
        </motion.div>
    );
}

/* ── step card ─────────────────────────────────────────────────────────── */
function Step({ n, title, desc }: { n: string; title: string; desc: string }) {
    return (
        <div className="flex gap-5">
            <div
                className="shrink-0 w-9 h-9 rounded-full border border-[#6EE7B7]/40
                      flex items-center justify-center font-display text-sm font-700 text-[#6EE7B7]"
            >
                {n}
            </div>
            <div>
                <h4 className="font-display text-sm font-600 text-white mb-1">
                    {title}
                </h4>
                <p className="text-sm text-[#8B98A8] leading-relaxed">{desc}</p>
            </div>
        </div>
    );
}

/* ══ MAIN PAGE ══════════════════════════════════════════════════════════ */
export default function LandingPage() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll();
    const heroY = useTransform(scrollY, [0, 400], [0, 80]);
    const user = useAppSelector((s) => s.auth.user);

    return (
        <div
            ref={containerRef}
            className="relative min-h-screen overflow-x-hidden bg-[#080C10]"
        >
            {/* ── Animated orb background ───────────────────────────────────── */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                {/* orb 1 — emerald top-right */}
                <div
                    className="orb-1 absolute -top-32 -right-32 h-150 w-150 rounded-full
                        bg-[#6EE7B7] opacity-[0.07] blur-[120px]"
                />
                {/* orb 2 — indigo bottom-left */}
                <div
                    className="orb-2 absolute -bottom-48 -left-48 h-175 w-175 rounded-full
                        bg-indigo-500 opacity-[0.06] blur-[140px]"
                />
                {/* orb 3 — teal center */}
                <div
                    className="orb-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                        h-125 w-125 rounded-full bg-teal-600 opacity-[0.04] blur-[100px]"
                />

                {/* dot grid */}
                <svg
                    className="absolute inset-0 h-full w-full opacity-[0.06]"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        <pattern
                            id="dots"
                            x="0"
                            y="0"
                            width="32"
                            height="32"
                            patternUnits="userSpaceOnUse"
                        >
                            <circle cx="1" cy="1" r="1" fill="#6EE7B7" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#dots)" />
                </svg>
            </div>

            {/* ── Navbar ────────────────────────────────────────────────────── */}
            <motion.nav
                {...fadeIn(0)}
                className="relative z-50 flex items-center justify-between px-6 py-5 md:px-12"
            >
                <div className="font-display text-xl font-700 tracking-tight text-white">
                    Apply<span className="text-[#6EE7B7]">wise</span>
                </div>
                {user?.name ? (
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-[#8B98A8]">
                            {user?.name}
                        </span>
                        <Link
                            href="/dashboard"
                            className="px-4 py-2 rounded-lg bg-[#6EE7B7] text-[#080C10] text-sm font-600
                       hover:bg-[#5BCFAA] transition-colors font-display font-semibold"
                        >
                            Dashboard
                        </Link>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <Link
                            href="/auth/login"
                            className="px-4 py-2 text-sm font-medium text-[#8B98A8] hover:text-white transition-colors"
                        >
                            Sign in
                        </Link>
                        <Link
                            href="/auth/register"
                            className="px-4 py-2 rounded-lg bg-[#6EE7B7] text-[#080C10] text-sm font-600
                       hover:bg-[#5BCFAA] transition-colors font-display font-semibold"
                        >
                            Get started
                        </Link>
                    </div>
                )}
            </motion.nav>

            {/* ── Hero ──────────────────────────────────────────────────────── */}
            <motion.section
                style={{ y: heroY }}
                className="relative z-10 mx-auto max-w-5xl px-6 pt-20 pb-32 text-center md:pt-28 md:px-12"
            >
                {/* eyebrow */}
                <motion.div
                    {...fadeIn(0.1)}
                    className="mb-6 inline-flex items-center gap-2 rounded-full
          border border-[#6EE7B7]/20 bg-[#6EE7B7]/5 px-4 py-1.5 text-xs text-[#6EE7B7] font-medium"
                >
                    <span className="h-1.5 w-1.5 rounded-full bg-[#6EE7B7] animate-pulse" />
                    Smart job search tracking
                </motion.div>

                {/* headline */}
                <motion.h1
                    {...fadeUp(0.15)}
                    className="font-display text-5xl font-800 leading-[1.08] tracking-tight text-white md:text-7xl"
                >
                    Never lose track of
                    <br />
                    <span className="relative inline-block">
                        <span
                            className="relative z-10 bg-linear-to-r from-[#6EE7B7] via-teal-300 to-[#6EE7B7]
                             bg-size-[200%] animate-shimmer bg-clip-text text-transparent"
                        >
                            an opportunity
                        </span>
                    </span>
                </motion.h1>

                {/* subtext */}
                <motion.p
                    {...fadeUp(0.25)}
                    className="mx-auto mt-6 max-w-xl text-lg text-[#8B98A8] leading-relaxed"
                >
                    Applywise tracks every application, auto-detects ghosted
                    leads before you forget them, and turns your job search into
                    a dashboard you actually want to open.
                </motion.p>

                {/* CTAs */}
                <motion.div
                    {...fadeUp(0.35)}
                    className="mt-10 flex flex-col sm:flex-row gap-3 justify-center"
                >
                    <Link
                        href="/auth/register"
                        className="group px-7 py-3.5 rounded-xl bg-[#6EE7B7] text-[#080C10] font-display
                       font-700 text-sm hover:bg-[#5BCFAA] transition-all duration-200
                       shadow-[0_0_40px_rgba(110,231,183,0.25)] hover:shadow-[0_0_60px_rgba(110,231,183,0.4)]"
                    >
                        Start for free
                        <span className="ml-2 inline-block transition-transform group-hover:translate-x-0.5">
                            →
                        </span>
                    </Link>
                    <Link
                        href="/auth/login"
                        className="px-7 py-3.5 rounded-xl border border-white/10 bg-white/4
                       text-sm font-medium text-[#8B98A8] hover:text-white hover:border-white/20
                       hover:bg-white/[0.07] transition-all duration-200 backdrop-blur-xs"
                    >
                        Sign in to dashboard
                    </Link>
                </motion.div>

                {/* stat counters */}
                <motion.div
                    {...fadeUp(0.45)}
                    className="mt-20 grid grid-cols-3 gap-8 border-t border-white/6 pt-12"
                >
                    <StatCounter
                        value={500}
                        suffix="+"
                        label="Applications tracked"
                    />
                    <StatCounter
                        value={14}
                        suffix=" d"
                        label="Default stale timeout"
                    />
                    <StatCounter
                        value={3}
                        suffix="×"
                        label="More organised searches"
                    />
                </motion.div>
            </motion.section>

            {/* ── Features grid ─────────────────────────────────────────────── */}
            <section className="relative z-10 mx-auto max-w-5xl px-6 py-20 md:px-12">
                <motion.div {...fadeUp(0)} className="mb-12 text-center">
                    <h2 className="font-display text-3xl font-700 text-white md:text-4xl">
                        Everything your job search needs
                    </h2>
                    <p className="mt-3 text-[#8B98A8]">
                        Built for the chaos of an active job search, not a
                        simple to-do list.
                    </p>
                </motion.div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <FeatureCard
                        delay={0.05}
                        icon="⏱"
                        title="Auto stale detection"
                        desc="Jobs you haven't touched in 14 days automatically flag as stale. No more ghosting blind spots."
                    />
                    <FeatureCard
                        delay={0.1}
                        icon="📊"
                        title="Search analytics"
                        desc="Response rate, interview rate, offer rate — know exactly how your search is performing."
                    />
                    <FeatureCard
                        delay={0.15}
                        icon="🔍"
                        title="Powerful filtering"
                        desc="Filter by status, tags, date range, or search by title and company in real time."
                    />
                    <FeatureCard
                        delay={0.2}
                        icon="📬"
                        title="Follow-up reminders"
                        desc="Email reminders when you haven't followed up on an application after 7 days."
                    />
                    <FeatureCard
                        delay={0.25}
                        icon="🏷"
                        title="Tag anything"
                        desc="Tag by role type, company size, tech stack — any dimension that matters to you."
                    />
                    <FeatureCard
                        delay={0.3}
                        icon="🔐"
                        title="Private & secure"
                        desc="Your data is yours. JWT auth with rotating tokens. No selling, no tracking."
                    />
                </div>
            </section>

            {/* ── How it works ──────────────────────────────────────────────── */}
            <section className="relative z-10 mx-auto max-w-5xl px-6 py-20 md:px-12">
                <div className="grid gap-16 md:grid-cols-2 md:gap-12 items-center">
                    <motion.div {...fadeUp(0)}>
                        <h2 className="font-display text-3xl font-700 text-white md:text-4xl mb-6">
                            Simple loop,
                            <br />
                            powerful results
                        </h2>
                        <div className="space-y-6">
                            <Step
                                n="1"
                                title="Add an application"
                                desc="Log the role, company, location, salary, and any tags. Takes under 30 seconds."
                            />
                            <Step
                                n="2"
                                title="Applywise monitors it"
                                desc="The stale checker runs every night. If you go quiet for too long, it flags it."
                            />
                            <Step
                                n="3"
                                title="Act on insights"
                                desc="Use the analytics dashboard to spot patterns and double down on what's working."
                            />
                        </div>
                    </motion.div>

                    {/* mock dashboard card */}
                    <motion.div
                        {...fadeUp(0.15)}
                        className="rounded-2xl border border-white/8 bg-white/3 p-6 backdrop-blur-xs"
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <span className="font-display text-sm font-600 text-white">
                                Applications
                            </span>
                            <span
                                className="text-xs text-[#6EE7B7] border border-[#6EE7B7]/30 bg-[#6EE7B7]/10
                               px-2 py-0.5 rounded-full"
                            >
                                Live
                            </span>
                        </div>
                        {[
                            {
                                title: "Senior Engineer",
                                company: "Vercel",
                                status: "Interviewing",
                                dot: "bg-amber-400",
                            },
                            {
                                title: "Product Designer",
                                company: "Linear",
                                status: "Applied",
                                dot: "bg-blue-400",
                            },
                            {
                                title: "Fullstack Dev",
                                company: "Supabase",
                                status: "Offer",
                                dot: "bg-emerald-400",
                            },
                            {
                                title: "Frontend Dev",
                                company: "Figma",
                                status: "Stale",
                                dot: "bg-neutral-600",
                                stale: true,
                            },
                        ].map((j, i) => (
                            <div
                                key={i}
                                className={`flex items-center justify-between py-3 border-b
                border-white/5 last:border-0 ${j.stale ? "opacity-40" : ""}`}
                            >
                                <div>
                                    <p
                                        className={`text-sm font-medium text-white ${j.stale ? "line-through" : ""}`}
                                    >
                                        {j.title}
                                    </p>
                                    <p className="text-xs text-[#8B98A8]">
                                        {j.company}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span
                                        className={`h-1.5 w-1.5 rounded-full ${j.dot}`}
                                    />
                                    <span className="text-xs text-[#8B98A8]">
                                        {j.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ── CTA banner ────────────────────────────────────────────────── */}
            <section className="relative z-10 mx-auto max-w-5xl px-6 pb-24 md:px-12">
                <motion.div
                    {...fadeUp(0)}
                    className="relative overflow-hidden rounded-3xl border border-[#6EE7B7]/20
                     bg-linear-to-br from-[#6EE7B7]/10 via-teal-900/10 to-indigo-900/20 p-12 text-center"
                >
                    {/* inner glow */}
                    <div
                        className="absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-96
                          bg-[#6EE7B7] opacity-10 blur-[80px] rounded-full"
                    />
                    <h2 className="relative font-display text-3xl font-700 text-white md:text-4xl">
                        Your job search, finally organised
                    </h2>
                    <p className="relative mt-3 text-[#8B98A8] max-w-sm mx-auto">
                        Free to use. No credit card. Set up in two minutes.
                    </p>
                    <div className="relative mt-8">
                        <Link
                            href="/auth/register"
                            className="inline-block px-8 py-3.5 rounded-xl bg-[#6EE7B7] text-[#080C10]
                         font-display font-700 text-sm hover:bg-[#5BCFAA] transition-colors
                         shadow-[0_0_50px_rgba(110,231,183,0.3)]"
                        >
                            Create your account →
                        </Link>
                    </div>
                </motion.div>
            </section>

            {/* ── Footer ────────────────────────────────────────────────────── */}
            <footer className="relative z-10 border-t border-white/6 px-6 py-8 md:px-12">
                <div className="mx-auto max-w-5xl flex items-center justify-between">
                    <span className="font-display text-sm font-600 text-white">
                        Apply<span className="text-[#6EE7B7]">wise</span>
                    </span>
                    <span className="text-xs text-[#4A5568]">
                        Track smarter. Apply better.
                    </span>
                </div>
            </footer>
        </div>
    );
}
