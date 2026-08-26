"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useForgotPassword } from "@/hooks/useAuth";
import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const { mutate: requestReset, isPending, isSuccess, data, error } = useForgotPassword();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        requestReset(email);
    };

    const apiError = (error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#080C10] px-4">
            <div
                className="pointer-events-none fixed top-0 right-0 h-125 w-125 rounded-full
                      bg-[#6EE7B7] opacity-[0.05] blur-[120px]"
            />

            <div className="relative z-10 w-full max-w-sm">
                <div className="mb-8 text-center">
                    <Link
                        href="/"
                        className="font-display text-2xl font-700 tracking-tight text-white"
                    >
                        Apply<span className="text-[#6EE7B7]">wise</span>
                    </Link>
                    <p className="mt-2 text-sm text-[#8B98A8]">
                        Reset your password
                    </p>
                </div>

                <div className="rounded-2xl border border-white/8 bg-white/3 p-8 backdrop-blur-xs">
                    {isSuccess ? (
                        <div className="space-y-4 text-center">
                            <div
                                aria-hidden="true"
                                className="mx-auto flex h-10 w-10 items-center justify-center rounded-full
                                           bg-[#6EE7B7]/10 text-lg text-[#6EE7B7]"
                            >
                                ✓
                            </div>
                            <p role="status" className="text-sm text-[#8B98A8]">
                                {data}
                            </p>
                            <p className="text-xs text-[#4A5568]">
                                The link expires in 60 minutes. Check your spam
                                folder if it doesn&rsquo;t arrive.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <p className="text-sm text-[#8B98A8]">
                                Enter your email and we&rsquo;ll send you a link
                                to choose a new password.
                            </p>

                            <Input
                                label="Email"
                                type="email"
                                name="email"
                                autoComplete="email"
                                inputMode="email"
                                spellCheck={false}
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoFocus
                            />

                            {apiError && (
                                <p
                                    role="alert"
                                    className="text-sm text-red-400 bg-red-950/50 border border-red-900/50 rounded-lg px-3 py-2"
                                >
                                    {apiError}
                                </p>
                            )}

                            <Button
                                type="submit"
                                className="w-full"
                                loading={isPending}
                                size="lg"
                            >
                                Send reset link
                            </Button>
                        </form>
                    )}
                </div>

                <p className="mt-5 text-center text-sm text-[#8B98A8]">
                    Remembered it?{" "}
                    <Link
                        href="/auth/login"
                        className="text-[#6EE7B7] hover:text-white transition-colors font-medium"
                    >
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
