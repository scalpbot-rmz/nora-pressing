'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useNoraStore } from '@/lib/store';
import { formatFCFA, formatDateFR } from '@/lib/utils';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  TrendingUp, AlertCircle, Users,
  Clock, ShoppingBag, Download, PlusCircle, Package, Wallet,
  Receipt, CalendarDays, ArrowUpRight, ArrowDownRight, Minus,
  CheckCircle2, UserPlus, Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { generateInvoicePDF, downloadPDF } from '@/lib/pdf-generator';

function getPeriods() {
  const now   = new Date();
  const y     = now.getFullYear();
  const m     = now.getMonth();
  const d     = now.getDate();

  const dow         = now.getDay();
  const daysToMon   = dow === 0 ? 6 : dow - 1;

  const todayStart  = new Date(y, m, d).getTime();
  const weekStart   = new Date(y, m, d - daysToMon).getTime();
  const weekEnd     = weekStart + 7 * 86400000 - 1;
  const monthStart  = new Date(y, m, 1).getTime();
  const yearStart   = new Date(y, 0, 1).getTime();

  const prevDayStart   = todayStart - 86400000;
  const prevDayEnd     = todayStart - 1;
  const prevWeekStart  = weekStart  - 7 * 86400000;
  const prevWeekEnd    = weekStart  - 1;
  const prevMonthStart = new Date(y, m - 1, 1).getTime();
  const prevMonthEnd   = monthStart - 1;
  const prevYearStart  = new Date(y - 1, 0, 1).getTime();
  const prevYearEnd    = yearStart - 1;

  return {
    todayStart, weekStart, weekEnd, monthStart, yearStart,
    prevDayStart, prevDayEnd, prevWeekStart, prevWeekEnd,
    prevMonthStart, prevMonthEnd, prevYearStart, prevYearEnd,
  };
}

const ts = (s: string) => new Date(s).getTime();

function sumField<T extends { created_at: string }>(
  arr: T[], field: keyof T, from: number, to?: number
): number {
  return arr
    .filter((x) => { const t = ts(x.created_at); return t >= from && (to === undefined || t <= to); })
    .reduce((acc, x) => acc + (Number(x[field]) || 0), 0);
}

function variation(cur: number, prev: number): { pct: number; dir: 'up' | 'down' | 'flat' } {
  if (prev === 0 && cur === 0) return { pct: 0, dir: 'flat' };
  if (prev === 0) return { pct: 100, dir: 'up' };
  const p = Math.round(((cur - prev) / prev) * 100);
  return { pct: Math.abs(p), dir: p > 0 ? 'up' : p < 0 ? 'down' : 'flat' };
}

function KpiCard({
  label, value, prev, icon: Icon, theme, sub,
}: {
  label: string; value: number; prev?: number;
  icon: React.ElementType; theme: 'blue' | 'green' | 'red' | 'navy' | 'purple' | 'amber';
  sub?: string;
}) {
  const v   = prev !== undefined ? variation(value, prev) : null;
  const themes = {
    blue:   { bg: 'bg-white', icon: 'bg-blue-100   text-blue-600',   text: 'text-slate-900', badge: 'bg-blue-50   text-blue-700' },
    green:  { bg: 'bg-white', icon: 'bg-emerald-100 text-emerald-600', text: 'text-emerald-700', badge: 'bg-emerald-50 text-emerald-700' },
    red:    { bg: 'bg-white', icon: 'bg-rose-100   text-rose-600',   text: 'text-rose-700',  badge: 'bg-rose-50   text-rose-700' },
    navy:   { bg: 'bg-[#0F172A]', icon: 'bg-blue-900 text-blue-400', text: 'text-white',     badge: 'bg-blue-900  text-blue-300' },
    purple: { bg: 'bg-white', icon: 'bg-purple-100 text-purple-600', text: 'text-slate-900', badge: 'bg-purple-50 text-purple-700' },
    amber:  { bg: 'bg-white', icon: 'bg-amber-100  text-amber-600',  text: 'text-slate-900', badge: 'bg-amber-50  text-amber-700' },
  };
  const t = themes[theme];

  return (
    <div className={`${t.bg} rounded-2xl p-4 border border-slate-100 shadow-sm card-lift flex flex-col gap-3`}>
      <div className="flex items-center justify-between">
        <p className={`text-[11px] font-bold uppercase tracking-wider ${theme === 'navy' ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${t.icon}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className={`text-xl font-black tracking-tight leading-none ${t.text}`}>{formatFCFA(value)}</p>
      <div className="flex items-center gap-2 mt-auto">
        {v && v.dir !== 'flat' && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
            v.dir === 'up'
              ? (theme === 'red' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700')
              : 'bg-rose-100 text-rose-700'
          }`}>
            {v.dir === 'up' ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
            {v.pct}%
          </span>
        )}
        {v?.dir === 'flat' && <span className="text-[10px] text-slate-400 flex items-center gap-0.5"><Minus className="w-2.5 h-2.5" />stable</span>}
        {sub && <p className={`text-[10px] ${theme === 'navy' ? 'text-slate-500' : 'text-slate-400'}`}>{sub}</p>}
      </div>
    </div>
  );
}

function KpiGroup({ label, icon: Icon, color, rows }: {
  label: string; icon: React.ElementType; color: string;
  rows: { period: string; value: number; prev?: number; sub?: string }[];
}) {
  const themes: Record<string, 'blue' | 'green' | 'red' | 'navy' | 'purple' | 'amber'> = {
    blue: 'blue', green: 'green', red: 'red',
  };
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${color}`} />
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {rows.map((r, i) => (
          <KpiCard
            key={r.period}
            label={r.period}
            value={r.value}
            prev={r.prev}
            sub={r.sub}
            icon={Icon}
            theme={i === 0 ? 'navy' : (themes[color.replace('text-', '').split('-')[0]] ?? 'blue')}
          />
        ))}
      </div>
    </div>
  );
}

function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="font-bold text-slate-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-bold">{formatFCFA(Number(p.value))}</span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { orders, customers, expenses, pressing, isLoaded } = useNoraStore();

  const P = useMemo(() => getPeriods(), []);

  const oSum = (from: number, to?: number) =>
    sumField(orders, 'total_amount', from, to);
  const eSum = (from: number, to?: number) =>
    sumField(expenses, 'amount', from, to) +
    sumField(orders,   'total_expenses', from, to);

  if (!isLoaded) return null;

  const ca = {
    today: oSum(P.todayStart),
    week:  oSum(P.weekStart,  P.weekEnd),
    month: oSum(P.monthStart),
    year:  oSum(P.yearStart),
    all:   orders.reduce((s, o) => s + o.total_amount, 0),
    prevDay:   oSum(P.prevDayStart,   P.prevDayEnd),
    prevWeek:  oSum(P.prevWeekStart,  P.prevWeekEnd),
    prevMonth: oSum(P.prevMonthStart, P.prevMonthEnd),
    prevYear:  oSum(P.prevYearStart,  P.prevYearEnd),
  };

  const dep = {
    today: eSum(P.todayStart),
    week:  eSum(P.weekStart,  P.weekEnd),
    month: eSum(P.monthStart),
    year:  eSum(P.yearStart),
    all:   expenses.reduce((s, e) => s + e.amount, 0) + orders.reduce((s, o) => s + o.total_expenses, 0),
    prevDay:   eSum(P.prevDayStart,   P.prevDayEnd),
    prevWeek:  eSum(P.prevWeekStart,  P.prevWeekEnd),
    prevMonth: eSum(P.prevMonthStart, P.prevMonthEnd),
    prevYear:  eSum(P.prevYearStart,  P.prevYearEnd),
  };

  const ben = {
    today: ca.today - dep.today,
    week:  ca.week  - dep.week,
    month: ca.month - dep.month,
    year:  ca.year  - dep.year,
    all:   ca.all   - dep.all,
    prevDay:   ca.prevDay   - dep.prevDay,
    prevWeek:  ca.prevWeek  - dep.prevWeek,
    prevMonth: ca.prevMonth - dep.prevMonth,
    prevYear:  ca.prevYear  - dep.prevYear,
  };

  const now = new Date();
  const y = now.getFullYear(); const m = now.getMonth(); const d = now.getDate();
  const todayTs = new Date(y, m, d).getTime();

  const commandesDuJour  = orders.filter((o) => ts(o.created_at) >= todayTs).length;
  const commandesEnCours = orders.filter((o) => ['received','washing','ironing','ready'].includes(o.treatment_status)).length;
  const commandesLivrees = orders.filter((o) => o.treatment_status === 'delivered').length;
  const clientsActifs    = customers.filter((c) => c.orders_count > 0).length;
  const montantsImpayes  = orders.reduce((s, o) => s + o.remaining_amount, 0);

  const last7 = Array.from({ length: 7 }).map((_, i) => {
    const dayTs   = new Date(y, m, d - (6 - i)).getTime();
    const dayEnd  = dayTs + 86400000 - 1;
    const label   = new Date(dayTs).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
    return {
      date: label,
      'CA':       oSum(dayTs, dayEnd),
      'Bénéfice': oSum(dayTs, dayEnd) - eSum(dayTs, dayEnd),
    };
  });

  const svcMap: Record<string, number> = {};
  orders.forEach((o) => { const n = o.offer_name || 'Autre'; svcMap[n] = (svcMap[n] || 0) + o.total_amount; });
  const topSvc = Object.entries(svcMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const topCusts = [...customers].sort((a, b) => b.total_spent - a.total_spent).slice(0, 5);
  const recentOrds = [...orders].sort((a, b) => ts(b.created_at) - ts(a.created_at)).slice(0, 6);

  const handleDownload = async (order: any) => {
    try {
      const bytes = await generateInvoicePDF(order, pressing);
      downloadPDF(bytes, `Facture_${order.invoice_number}.pdf`);
    } catch (err) {
      console.error('Erreur PDF:', err);
      alert('Impossible de générer le PDF. Réessayez dans quelques instants.');
    }
  };

  const fmtY = (v: number) => v >= 1000 ? `${Math.round(v / 1000)}k` : String(v);

  return (
    <div className="space-y-8">

      {/* ─── En-tête ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Tableau de Bord</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {pressing.name || 'Nora Pressing'} · {now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Link href="/dashboard/orders/new">
          <Button variant="secondary" className="gap-2 shadow-sm">
            <PlusCircle className="w-4 h-4" />Nouvelle commande
          </Button>
        </Link>
      </div>

      {/* ─── Alerte Espace Neuf si 0 donnée ───────────────────────── */}
      {orders.length === 0 && customers.length === 0 && (
        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#2563EB]" />
              Bienvenue sur votre espace Nora Pressing !
            </h3>
            <p className="text-xs text-slate-600">
              Votre espace est actuellement vide. Commencez par enregistrer vos prestations et ajouter votre première commande client.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/dashboard/orders/new">
              <Button variant="secondary" size="sm" className="gap-1.5 text-xs font-bold">
                <PlusCircle className="w-4 h-4" />Créer une commande
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* ─── Cartes CA ────────────────────────────────────────────── */}
      <KpiGroup
        label="Chiffre d'affaires" icon={TrendingUp} color="text-blue-600"
        rows={[
          { period: "Aujourd'hui", value: ca.today, prev: ca.prevDay,   sub: 'vs hier' },
          { period: 'Cette semaine', value: ca.week,  prev: ca.prevWeek,  sub: 'Lun – Dim' },
          { period: 'Ce mois',      value: ca.month, prev: ca.prevMonth, sub: now.toLocaleDateString('fr-FR', { month: 'long' }) },
          { period: 'Cette année',  value: ca.year,  prev: ca.prevYear,  sub: String(y) },
          { period: 'Depuis début', value: ca.all,   sub: 'Cumulé total' },
        ]}
      />

      {/* ─── Cartes Dépenses ─────────────────────────────────────── */}
      <KpiGroup
        label="Dépenses totales" icon={AlertCircle} color="text-rose-600"
        rows={[
          { period: "Aujourd'hui", value: dep.today, prev: dep.prevDay,   sub: 'vs hier' },
          { period: 'Cette semaine', value: dep.week,  prev: dep.prevWeek,  sub: 'Lun – Dim' },
          { period: 'Ce mois',      value: dep.month, prev: dep.prevMonth, sub: now.toLocaleDateString('fr-FR', { month: 'long' }) },
          { period: 'Cette année',  value: dep.year,  prev: dep.prevYear,  sub: String(y) },
          { period: 'Depuis début', value: dep.all,   sub: 'Cumulé total' },
        ]}
      />

      {/* ─── Cartes Bénéfice ─────────────────────────────────────── */}
      <KpiGroup
        label="Bénéfice net (CA − Dépenses)" icon={CheckCircle2} color="text-emerald-600"
        rows={[
          { period: "Aujourd'hui", value: ben.today, prev: ben.prevDay,   sub: 'vs hier' },
          { period: 'Cette semaine', value: ben.week,  prev: ben.prevWeek,  sub: 'Lun – Dim' },
          { period: 'Ce mois',      value: ben.month, prev: ben.prevMonth, sub: now.toLocaleDateString('fr-FR', { month: 'long' }) },
          { period: 'Cette année',  value: ben.year,  prev: ben.prevYear,  sub: String(y) },
          { period: 'Depuis début', value: ben.all,   sub: 'Cumulé total' },
        ]}
      />

      {/* ─── Indicateurs opérationnels ─────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-amber-600" />
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Opérationnel · Temps réel</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: 'Cmdes aujourd\'hui', v: commandesDuJour, icon: CalendarDays, c: 'bg-blue-100 text-blue-600' },
            { label: 'En cours / atelier', v: commandesEnCours, icon: Clock,      c: 'bg-amber-100 text-amber-600' },
            { label: 'Livrées',            v: commandesLivrees, icon: Package,    c: 'bg-emerald-100 text-emerald-600' },
            { label: 'Clients actifs',     v: clientsActifs,    icon: Users,      c: 'bg-purple-100 text-purple-600' },
            { label: 'Impayés',            v: null,             icon: Wallet,     c: 'bg-rose-100 text-rose-600', fcfa: montantsImpayes },
          ].map(({ label, v, icon: Icon, c, fcfa }) => (
            <div key={label} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm card-lift flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${c}`}><Icon className="w-4 h-4" /></div>
              </div>
              <p className="text-2xl font-black text-slate-900">{fcfa !== undefined ? formatFCFA(fcfa) : v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Graphiques ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-sm font-bold text-slate-900">CA & Bénéfice — 7 jours</h3>
          </CardHeader>
          <CardBody className="p-4">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={last7} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gCA" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={fmtY} />
                  <Tooltip content={<ChartTip />} />
                  <Area type="monotone" dataKey="CA" stroke="#2563EB" strokeWidth={2} fill="url(#gCA)" dot={{ fill: '#2563EB', r: 2.5 }} />
                  <Area type="monotone" dataKey="Bénéfice" stroke="#16A34A" strokeWidth={1.5} fill="none" strokeDasharray="4 3" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900">Top prestations (cumul)</h3>
          </CardHeader>
          <CardBody className="p-4 space-y-3">
            {topSvc.length === 0 && <p className="text-xs text-slate-400 text-center py-6">Aucune prestation enregistrée</p>}
            {topSvc.map(([name, val]) => (
              <div key={name} className="flex items-center gap-3">
                <p className="text-xs font-semibold text-slate-700 w-32 truncate shrink-0">{name}</p>
                <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className="h-1.5 rounded-full bg-gradient-to-r from-[#2563EB] to-[#16A34A]"
                    style={{ width: `${Math.round((val / (topSvc[0]?.[1] || 1)) * 100)}%` }} />
                </div>
                <p className="text-xs font-bold text-slate-800 w-24 text-right shrink-0">{formatFCFA(val)}</p>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      {/* ─── Commandes récentes + Top clients ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#2563EB]" />
              <h3 className="text-sm font-bold text-slate-900">Commandes récentes</h3>
            </div>
            <Link href="/dashboard/orders" className="text-xs font-semibold text-[#2563EB] hover:underline">Voir tout →</Link>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Facture</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3 text-right">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrds.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      Aucune commande enregistrée. Commencez par créer votre première commande.
                    </td>
                  </tr>
                )}
                {recentOrds.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/orders/${o.id}`} className="font-bold text-slate-900 hover:text-[#2563EB] hover:underline">{o.invoice_number}</Link>
                      <p className="text-[10px] text-slate-400">{formatDateFR(o.created_at)}</p>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">{o.customer_name || 'Client'}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{formatFCFA(o.total_amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-lg font-bold text-[10px] ${o.remaining_amount <= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {o.remaining_amount <= 0 ? 'Réglé' : 'Impayé'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDownload(o)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#16A34A]" />
            <h3 className="text-sm font-bold text-slate-900">Top clients</h3>
          </CardHeader>
          <CardBody className="p-4 space-y-2">
            {topCusts.length === 0 && <p className="text-xs text-slate-400 text-center py-6">Aucun client enregistré</p>}
            {topCusts.map((c, i) => (
              <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0 ${['bg-amber-500','bg-slate-400','bg-orange-400','bg-slate-300','bg-slate-200'][i]}`}>
                  #{i+1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-xs truncate">{c.name || 'Client'}</p>
                  <p className="text-[10px] text-slate-400">{c.phone}</p>
                </div>
                <span className="text-xs font-bold text-[#16A34A] shrink-0">{formatFCFA(c.total_spent)}</span>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

    </div>
  );
}
