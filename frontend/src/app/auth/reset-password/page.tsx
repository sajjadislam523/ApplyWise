"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useResetPassword } from "@/hooks/useAuth";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function Shell({ children }: { children: React.ReactNode }) {
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
                        Choose a new password
                    </p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-white/3 p-8 backdrop-blur-xs">
                    {children}
                </div>
                <p className="mt-5 text-center text-sm text-[#8B98A8]">
                    <Link
                        href="/auth/login"
                        className="text-[#6EE7B7] hover:text-white transition-colors font-medium"
                    >
                        Back to sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}

function ResetPasswordForm() {
    const token = useSearchParams().get("token") ?? "";
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [touched, setTouched] = useState(false);
    const { mutate: reset, isPending, isSuccess, error } = useResetPassword();

    const tooShort = password.length > 0 && password.length < 8;
    const mismatch = confirm.length > 0 && confirm !== password;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setTouched(true);
        if (password.length < 8 || password !== confirm) return;
        reset({ token, password });
    };

    const apiError = (error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;

    if (!token) {
        return (
            <div className="space-y-3 text-center">
                <p role="alert" className="text-sm text-red-400">
                    This link is missing its reset token.
                </p>
                <p className="text-sm text-[#8B98A8]">
                    Open the link from your email directly, or request a new one.
                </p>
                <Link href="/auth/forgot-password">
                    <Button variant="secondary" className="w-full mt-1">
                        Request a new link
                    </Button>
                </Link>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="space-y-4 text-center">
                <div
                    aria-hidden="true"
                    className="mx-auto flex h-10 w-10 items-center justify-center rounded-full
                               bg-[#6EE7B7]/10 text-lg text-[#6EE7B7]"
                >
                    ✓
                </div>
                <p role="status" className="text-sm text-[#8B98A8]">
                    Your password has been updated. Any other devices you were
                    signed in on have been signed out.
                </p>
                <Link href="/auth/login">
                    <Button className="w-full">Sign in</Button>
                </Link>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
                label="New password"
                type="password"
                name="new-password"
                autoComplete="new-password"
                spellCheck={false}
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={touched && tooShort ? "Must be at least 8 characters" : undefined}
                required
                autoFocus
            />
            <Input
                label="Confirm password"
                type="password"
                name="confirm-password"
                autoComplete="new-password"
                spellCheck={false}
                placeholder="Type it again"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                error={touched && mismatch ? "Passwords do not match" : undefined}
                required
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
                Update password
            </Button>
        </form>
    );
}

export default function ResetPasswordPage() {
    return (
        <Shell>
            {/* useSearchParams needs a Suspense boundary on a prerendered route */}
            <Suspense
                fallback={
                    <div className="flex justify-center py-6">
                        <div
                            aria-label="Loading"
                            role="status"
                            className="w-5 h-5 border-2 border-[#6EE7B7] border-t-transparent rounded-full animate-spin"
                        />
                    </div>
                }
            >
                <ResetPasswordForm />
            </Suspense>
        </Shell>
    );
}
