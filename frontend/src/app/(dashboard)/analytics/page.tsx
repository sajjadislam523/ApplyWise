'use client';

import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie,
} from 'recharts';
import dayjs from 'dayjs';
import { useAnalytics } from '@/hooks/useJobs';

const STATUS_COLOURS: Record<string, string> = {
  applied: '#60A5FA', interviewing: '#FCD34D',
  offer: '#6EE7B7',  rejected: '#F87171', stale: '#374151',
};
const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const TOOLTIP_STYLE = {
  backgroundColor: '#161C24',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10,
  fontSize: 12,
  color: '#F1F5F9',
};

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#0F1419] border border-white/[0.07] rounded-xl p-6">
      <h2 className="text-sm font-display font-600 text-white mb-5">{title}</h2>
      {children}
    </div>
  );
}

function Stat({ label, value, sub, accent = false }: {
  label: string; value: string | number; sub?: string; accent?: boolean;
}) {
  return (
    <div className={`rounded-xl p-5 border ${
      accent ? 'bg-[#6EE7B7]/10 border-[#6EE7B7]/20' : 'bg-[#0F1419] border-white/[0.07]'
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

function EmptyChart({ message = 'No data yet' }: { message?: string }) {
  return (
    <div className="h-48 flex items-center justify-center">
      <p className="text-sm text-[#4A5568]">{message}</p>
    </div>
  );
}

export default function AnalyticsPage() {
  const { data, isLoading, isError } = useAnalytics();

  if (isLoading) return (
    <div className="max-w-5xl mx-auto space-y-8 animate-pulse">
      <div className="h-8 w-32 bg-white/5 rounded-sm" />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 bg-white/3 border border-white/6 rounded-xl" />
        ))}
      </div>
    </div>
  );

  if (isError || !data) return (
    <p className="text-sm text-red-400 p-6">Failed to load analytics.</p>
  );

  const weeklyData  = data.weekly.map((w) => ({ label: dayjs(w.firstDate).format('MMM D'), count: w.count }));
  const monthlyData = data.monthly.map((m) => ({ label: `${MONTH_LABELS[m._id.month - 1]}`, count: m.count }));
  const pieData     = Object.entries(data.byStatus).map(([s, c]) => ({
    name: s.charAt(0).toUpperCase() + s.slice(1), value: c ?? 0, color: STATUS_COLOURS[s] ?? '#374151',
  }));
  const tagData = data.topTags.map((t) => ({ name: t._id, count: t.count }));

  const axisProps = { tick: { fontSize: 11, fill: '#4A5568' }, axisLine: false, tickLine: false };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-xl font-700 text-white">Analytics</h1>
        <p className="text-sm text-[#8B98A8] mt-0.5">All-time stats for your job search.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Stat label="Total applied"  value={data.total}                         accent />
        <Stat label="Response rate"  value={`${data.rates.response}%`}          sub="Got a reply" />
        <Stat label="Interview rate" value={`${data.rates.interview}%`}         sub="Reached interview" />
        <Stat label="Offer rate"     value={`${data.rates.offer}%`}             sub="Received offer" />
        <Stat label="Avg response"   value={data.avgDaysToResponse !== null ? `${data.avgDaysToResponse}d` : '—'} sub="Days to first reply" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Applications per week">
          {weeklyData.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weeklyData} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="label" {...axisProps} />
                <YAxis allowDecimals={false} width={24} {...axisProps} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="count" name="Applications" fill="#6EE7B7" radius={[4, 4, 0, 0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card title="Applications per month">
          {monthlyData.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="label" {...axisProps} />
                <YAxis allowDecimals={false} width={24} {...axisProps} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="count" name="Applications" stroke="#6EE7B7"
                  strokeWidth={2} dot={{ r: 3, fill: '#6EE7B7' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Status distribution">
          {pieData.length === 0 ? <EmptyChart /> : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="55%" height={190}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={52} outerRadius={82}
                    paddingAngle={3} dataKey="value">
                    {pieData.map((e) => <Cell key={e.name} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2.5">
                {pieData.map((e) => (
                  <div key={e.name} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: e.color }} />
                      <span className="text-xs text-[#8B98A8]">{e.name}</span>
                    </div>
                    <span className="text-xs font-medium tabular-nums text-white">{e.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card title="Top tags">
          {tagData.length === 0 ? <EmptyChart message="No tags added yet" /> : (
            <div className="space-y-2.5">
              {tagData.map((tag) => {
                const pct = tagData[0].count > 0 ? Math.round((tag.count / tagData[0].count) * 100) : 0;
                return (
                  <div key={tag.name} className="flex items-center gap-3">
                    <span className="text-xs text-[#8B98A8] w-24 truncate">{tag.name}</span>
                    <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-[#6EE7B7] rounded-full transition-all duration-500"
                           style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs tabular-nums text-[#4A5568] w-5 text-right">{tag.count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
