'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLogin } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const { mutate: login, isPending, error } = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ email, password });
  };

  const apiError = (error as { response?: { data?: { message?: string } } })
    ?.response?.data?.message;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080C10] px-4">
      {/* background orb */}
      <div className="pointer-events-none fixed top-0 right-0 h-[500px] w-[500px] rounded-full
                      bg-[#6EE7B7] opacity-[0.05] blur-[120px]" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="font-display text-2xl font-700 tracking-tight text-white">
            Apply<span className="text-[#6EE7B7]">wise</span>
          </Link>
          <p className="mt-2 text-sm text-[#8B98A8]">Sign in to your account</p>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Email" type="email" placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
            <Input label="Password" type="password" placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)} required />

            {apiError && (
              <p className="text-sm text-red-400 bg-red-950/50 border border-red-900/50 rounded-lg px-3 py-2">
                {apiError}
              </p>
            )}
            <Button type="submit" className="w-full" loading={isPending} size="lg">Sign in</Button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-[#8B98A8]">
          No account?{' '}
          <Link href="/auth/register" className="text-[#6EE7B7] hover:text-white transition-colors font-medium">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
