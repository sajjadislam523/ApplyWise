'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRegister } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function RegisterPage() {
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const { mutate: register, isPending, error } = useRegister();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register({ name, email, password });
  };

  const apiError = (error as { response?: { data?: { message?: string } } })
    ?.response?.data?.message;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080C10] px-4">
      <div className="pointer-events-none fixed bottom-0 left-0 h-[500px] w-[500px] rounded-full
                      bg-indigo-500 opacity-[0.05] blur-[120px]" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="font-display text-2xl font-700 tracking-tight text-white">
            Apply<span className="text-[#6EE7B7]">wise</span>
          </Link>
          <p className="mt-2 text-sm text-[#8B98A8]">Create your free account</p>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/3 p-8 backdrop-blur-xs">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Name" type="text" placeholder="Your name"
              value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
            <Input label="Email" type="email" placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input label="Password" type="password" placeholder="Min 8 characters"
              value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />

            {apiError && (
              <p className="text-sm text-red-400 bg-red-950/50 border border-red-900/50 rounded-lg px-3 py-2">
                {apiError}
              </p>
            )}
            <Button type="submit" className="w-full" loading={isPending} size="lg">Create account</Button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-[#8B98A8]">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-[#6EE7B7] hover:text-white transition-colors font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
