'use client'

import { useMemo, useState } from 'react'
import { useZPos } from '@/lib/store'
import { cn } from '@/lib/utils'
import { rupiah, tanggalWaktu } from '@/lib/format'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, type CashEntry } from '@/lib/zpos-types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { StatCard, ViewHeader, EmptyState } from './ui-bits'
import {
  ArrowDownRight, ArrowUpRight, Loader2, Plus, ReceiptText, Trash2, TrendingDown, TrendingUp, Wallet,
} from 'lucide-react'

type Period = 'today' | 'month' | 'all'
type EntryType = 'expense' | 'income'

function sameDay(iso: string, ref: Date): boolean {
  const d = new Date(iso)
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth() && d.getDate() === ref.getDate()
}

function sameMonth(iso: string, ref: Date): boolean {
  const d = new Date(iso)
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth()
}

/* ================= Dialog Catat ================= */
function CashDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const addCashEntry = useZPos((s) => s.addCashEntry)
  const [type, setType] = useState<EntryType>('expense')
  const [category, setCategory] = useState<string>('')
  const [amountRaw, setAmountRaw] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [busy, setBusy] = useState(false)

  const cats = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES
  const amount = Number(amountRaw || 0)
  const valid = category.length > 0 && amount > 0

  const changeType = (t: EntryType) => {
    setType(t)
    setCategory('')
  }

  const submit = async () => {
    if (!valid) return
    setBusy(true)
    const ok = await addCashEntry({ type, category, amount, note: note.trim() || undefined, date })
    setBusy(false)
    if (ok) {
      onOpenChange(false)
      setCategory('')
      setAmountRaw('')
      setNote('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-4.5 w-4.5" aria-hidden="true" /> Catat Arus Kas
          </DialogTitle>
          <DialogDescription>Pengeluaran operasional & pemasukan di luar penjualan kasir.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Jenis */}
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Jenis catatan">
            {([
              { id: 'expense', label: 'Pengeluaran', icon: TrendingDown, cls: 'bg-rose-600 text-white' },
              { id: 'income', label: 'Pemasukan', icon: TrendingUp, cls: 'bg-emerald-600 text-white' },
            ] as const).map((opt) => {
              const active = type === opt.id
              const Icon = opt.icon
              return (
                <button
                  key={opt.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => changeType(opt.id)}
                  className={cn(
                    'flex h-10 items-center justify-center gap-1.5 rounded-lg border text-sm font-semibold transition-colors',
                    active ? cn('border-transparent', opt.cls) : 'border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50'
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" /> {opt.label}
                </button>
              )
            })}
          </div>

          <div className="grid gap-1.5">
            <Label>Kategori *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder={type === 'expense' ? 'Pilih kategori pengeluaran' : 'Pilih kategori pemasukan'} />
              </SelectTrigger>
              <SelectContent>
                {cats.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="cash-amount">Nominal *</Label>
            <Input
              id="cash-amount"
              inputMode="numeric"
              className="bg-white font-semibold tabular-nums"
              placeholder="cth. 150000"
              value={amountRaw}
              onChange={(e) => setAmountRaw(e.target.value.replace(/[^0-9]/g, ''))}
            />
            {amount > 0 && (
              <p className={cn('text-xs font-semibold tabular-nums', type === 'expense' ? 'text-rose-600' : 'text-emerald-600')}>
                {type === 'expense' ? '−' : '+'} {rupiah(amount)}
              </p>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="cash-note">Keterangan</Label>
            <Textarea id="cash-note" rows={2} className="bg-white" value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={type === 'expense' ? 'cth. Belanja bahan kopi & susu' : 'cth. Sewa ruang acara'} />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="cash-date">Tanggal</Label>
            <Input id="cash-date" type="date" className="bg-white" value={date} max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="border-zinc-200 bg-white" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button
            className={cn('font-semibold text-white', type === 'expense' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700')}
            disabled={!valid || busy}
            onClick={submit}
          >
            {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ================= View utama ================= */
export function KeuanganView() {
  const cashEntries = useZPos((s) => s.cashEntries)
  const deleteCashEntry = useZPos((s) => s.deleteCashEntry)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [period, setPeriod] = useState<Period>('month')

  const now = useMemo(() => new Date(), [])

  const filtered = useMemo(() => {
    return cashEntries.filter((c) =>
      period === 'today' ? sameDay(c.createdAt, now)
        : period === 'month' ? sameMonth(c.createdAt, now)
        : true
    )
  }, [cashEntries, period, now])

  const monthEntries = useMemo(() => cashEntries.filter((c) => sameMonth(c.createdAt, now)), [cashEntries, now])
  const todayEntries = useMemo(() => cashEntries.filter((c) => sameDay(c.createdAt, now)), [cashEntries, now])

  const sum = (list: CashEntry[], t: EntryType) => list.filter((c) => c.type === t).reduce((s, c) => s + c.amount, 0)

  const monthExpense = sum(monthEntries, 'expense')
  const monthIncome = sum(monthEntries, 'income')
  const todayExpense = sum(todayEntries, 'expense')

  const byCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const c of monthEntries) {
      if (c.type !== 'expense') continue
      map.set(c.category, (map.get(c.category) ?? 0) + c.amount)
    }
    const rows = [...map.entries()].map(([name, amount]) => ({ name, amount }))
    rows.sort((a, b) => b.amount - a.amount)
    return rows.slice(0, 6)
  }, [monthEntries])
  const maxCat = byCategory[0]?.amount ?? 1

  const periodExpense = sum(filtered, 'expense')
  const periodIncome = sum(filtered, 'income')

  const del = async (c: CashEntry) => {
    if (!confirm(`Hapus catatan "${c.category} — ${rupiah(c.amount)}"?`)) return
    await deleteCashEntry(c.id)
  }

  return (
    <div className="mx-auto max-w-[1400px] p-4 sm:p-5">
      <ViewHeader title="Keuangan" desc="Pengeluaran operasional & pemasukan lain — dasar perhitungan laba bersih.">
        <Button size="sm" className="h-9 bg-zinc-900 font-semibold text-white hover:bg-zinc-800"
          onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" /> Catat Arus Kas
        </Button>
      </ViewHeader>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Pengeluaran Bulan Ini" value={rupiah(monthExpense)} icon={TrendingDown} tone="rose" />
        <StatCard label="Pemasukan Lain" value={rupiah(monthIncome)} icon={TrendingUp} tone="emerald" sub="di luar penjualan kasir" />
        <StatCard
          label="Arus Kas Bersih"
          value={rupiah(monthIncome - monthExpense)}
          icon={Wallet}
          tone={monthIncome - monthExpense >= 0 ? 'emerald' : 'rose'}
          sub="pemasukan − pengeluaran"
        />
        <StatCard label="Pengeluaran Hari Ini" value={rupiah(todayExpense)} icon={ReceiptText} />
      </div>

      {/* Rincian kategori pengeluaran bulan ini */}
      {byCategory.length > 0 && (
        <div className="mb-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
          <p className="mb-3 text-sm font-bold text-zinc-900">Pengeluaran per Kategori — Bulan Ini</p>
          <div className="grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
            {byCategory.map((row) => (
              <div key={row.name}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-zinc-600">{row.name}</span>
                  <span className="font-bold tabular-nums text-zinc-900">{rupiah(row.amount)}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
                  <div className="h-full rounded-full bg-zinc-800" style={{ width: `${Math.max(4, Math.round((row.amount / maxCat) * 100))}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter periode */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <TabsList className="bg-zinc-100">
            <TabsTrigger value="today" className="text-xs font-semibold">Hari Ini</TabsTrigger>
            <TabsTrigger value="month" className="text-xs font-semibold">Bulan Ini</TabsTrigger>
            <TabsTrigger value="all" className="text-xs font-semibold">Semua</TabsTrigger>
          </TabsList>
        </Tabs>
        <p className="text-xs font-medium text-zinc-500">
          {filtered.length} catatan · <span className="font-bold text-rose-600">−{rupiah(periodExpense)}</span>{' '}
          <span className="text-zinc-300">/</span> <span className="font-bold text-emerald-600">+{rupiah(periodIncome)}</span>
        </p>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Belum ada catatan keuangan"
          desc="Catat pengeluaran seperti bahan baku, gaji, dan sewa — agar laba bersih terhitung akurat."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-[11px] font-bold uppercase tracking-wide text-zinc-400">
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Jenis</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Keterangan</th>
                  <th className="hidden px-4 py-3 sm:table-cell">Dicatat Oleh</th>
                  <th className="px-4 py-3 text-right">Nominal</th>
                  <th className="px-4 py-3" aria-label="Aksi" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-zinc-100 transition-colors last:border-0 hover:bg-zinc-50">
                    <td className="whitespace-nowrap px-4 py-3 text-xs font-medium text-zinc-500">
                      {tanggalWaktu(c.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold',
                        c.type === 'expense'
                          ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
                          : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                      )}>
                        {c.type === 'expense'
                          ? <ArrowDownRight className="h-3 w-3" aria-hidden="true" />
                          : <ArrowUpRight className="h-3 w-3" aria-hidden="true" />}
                        {c.type === 'expense' ? 'Keluar' : 'Masuk'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-zinc-900">{c.category}</td>
                    <td className="max-w-[280px] truncate px-4 py-3 text-zinc-500" title={c.note ?? undefined}>
                      {c.note || '—'}
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-3 text-xs text-zinc-500 sm:table-cell">{c.userName}</td>
                    <td className={cn(
                      'whitespace-nowrap px-4 py-3 text-right font-bold tabular-nums',
                      c.type === 'expense' ? 'text-rose-600' : 'text-emerald-600'
                    )}>
                      {c.type === 'expense' ? '−' : '+'} {rupiah(c.amount)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                        onClick={() => void del(c)} aria-label={`Hapus ${c.category}`}>
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CashDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
