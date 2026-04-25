'use client';

import Link from 'next/link';
import { useAnalytics } from '@/hooks/useJobs';
import { useAppSelector } from '@/store';

function StatCard({ label, value, sub, accent = false }: {
  label: string; value: string | number; sub?: string; accent?: boolean;
}) {
  return (
    <div className={`rounded-xl p-5 border ${
      accent
        ? 'bg-[#6EE7B7]/10 border-[#6EE7B7]/20'
        : 'bg-[#0F1419] border-white/[0.07]'
    }`}>
      <p className={`text-xs uppercase tracking-wide font-medium mb-1 ${
        accent ? 'text-[#6EE7B7]/70' : 'text-[#8B98A8]'
      }`}>{label}</p>
      <p className={`text-3xl font-display font-700 tabular-nums ${
        accent ? 'text-[#6EE7B7]' : 'text-white'
      }`}>{value}</p>
      {sub && <p className={`text-xs mt-1 ${accent ? 'text-[#6EE7B7]/50' : 'text-[#4A5568]'}`}>{sub}</p>}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const user = useAppSelector((s) => s.auth.user);
  const { data, isLoading } = useAnalytics();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-xl font-700 text-white">
          {getGreeting()}, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-sm text-[#8B98A8] mt-0.5">Here's where your job search stands.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />
          ))}
        </div>
      ) : data ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total applied"    value={data.total}                     accent />
          <StatCard label="Response rate"    value={`${data.rates.response}%`}      sub="Got a reply" />
          <StatCard label="Interview rate"   value={`${data.rates.interview}%`}     sub="Reached interview" />
          <StatCard label="Offer rate"       value={`${data.rates.offer}%`}         sub="Received offer" />
        </div>
      ) : null}

      {data && (
        <div className="bg-[#0F1419] border border-white/[0.07] rounded-xl p-5">
          <h2 className="text-sm font-display font-600 text-white mb-4">Status breakdown</h2>
          <div className="space-y-2.5">
            {Object.entries(data.byStatus).map(([status, count]) => {
              const pct = data.total ? Math.round(((count ?? 0) / data.total) * 100) : 0;
              return (
                <div key={status} className="flex items-center gap-3">
                  <span className="text-xs text-[#8B98A8] w-24 capitalize">{status}</span>
                  <div className="flex-1 h-1 bg-white/[0.05] rounded-full overflow-hidden">
                    <div className="h-full bg-[#6EE7B7] rounded-full transition-all duration-700"
                         style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs tabular-nums text-[#4A5568] w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Link href="/jobs"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#6EE7B7] text-[#080C10]
                   font-display font-700 text-sm rounded-xl hover:bg-[#5BCFAA] transition-colors
                   shadow-[0_0_20px_rgba(110,231,183,0.2)]">
        View all applications →
      </Link>
    </div>
  );
}
