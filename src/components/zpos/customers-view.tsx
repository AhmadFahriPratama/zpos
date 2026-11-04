'use client'

import { useMemo, useState } from 'react'
import { useZPos } from '@/lib/store'
import { cn } from '@/lib/utils'
import { rupiah, angka } from '@/lib/format'
import type { Customer } from '@/lib/zpos-types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StatCard, ViewHeader, EmptyState } from './ui-bits'
import {
  Crown, Loader2, Medal, MoreHorizontal, Pencil, Plus,
  Search, Star, Trash2, UserRound, UsersRound,
} from 'lucide-react'

const TIER_META: Record<string, { label: string; chip: string; icon: typeof Crown }> = {
  gold: { label: 'Gold', chip: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200', icon: Crown },
  silver: { label: 'Silver', chip: 'bg-zinc-100 text-zinc-600 ring-1 ring-zinc-300', icon: Medal },
  regular: { label: 'Regular', chip: 'bg-zinc-50 text-zinc-500 ring-1 ring-zinc-200', icon: UserRound },
}

export function TierBadge({ tier, className }: { tier: string; className?: string }) {
  const meta = TIER_META[tier] ?? TIER_META.regular
  const Icon = meta.icon
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold', meta.chip, className)}>
      <Icon className="h-3 w-3" aria-hidden="true" /> {meta.label}
    </span>
  )
}

function CustomerDialog({
  open, onOpenChange, editing,
}: { open: boolean; onOpenChange: (o: boolean) => void; editing: Customer | null }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && <CustomerForm key={editing?.id ?? 'new'} editing={editing} onClose={() => onOpenChange(false)} />}
    </Dialog>
  )
}

function CustomerForm({ editing, onClose }: { editing: Customer | null; onClose: () => void }) {
  const saveCustomer = useZPos((s) => s.saveCustomer)
  const [form, setForm] = useState(() =>
    editing
      ? { name: editing.name, phone: editing.phone, email: editing.email, note: editing.note ?? '' }
      : { name: '', phone: '', email: '', note: '' }
  )
  const [busy, setBusy] = useState(false)

  const valid = form.name.trim().length >= 2

  const submit = async () => {
    if (!valid) return
    setBusy(true)
    const ok = await saveCustomer(editing ? { id: editing.id, ...form } : form)
    setBusy(false)
    if (ok) onClose()
  }

  return (
    <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? 'Ubah Pelanggan' : 'Daftar Member Baru'}</DialogTitle>
          <DialogDescription>
            {editing ? editing.code : 'Kode member dibuat otomatis (MBR-XXXX). Poin = 1 per Rp10.000 belanja.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid gap-1.5">
            <Label htmlFor="cust-name">Nama *</Label>
            <Input id="cust-name" className="bg-white" value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nama lengkap" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="cust-phone">Telepon</Label>
              <Input id="cust-phone" className="bg-white" value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="0812-…" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cust-email">Email</Label>
              <Input id="cust-email" type="email" className="bg-white" value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="email@mail.com" />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="cust-note">Catatan</Label>
            <Textarea id="cust-note" rows={2} className="bg-white" value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} placeholder="Alergi, preferensi, dll." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="border-zinc-200 bg-white" onClick={onClose}>Batal</Button>
          <Button className="bg-zinc-900 font-semibold text-white hover:bg-zinc-800" disabled={!valid || busy} onClick={submit}>
            {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
  )
}

export function CustomersView() {
  const customers = useZPos((s) => s.customers)
  const deleteCustomer = useZPos((s) => s.deleteCustomer)
  const [q, setQ] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return customers
    return customers.filter((c) =>
      c.name.toLowerCase().includes(t) || c.code.toLowerCase().includes(t) || c.phone.includes(t)
    )
  }, [customers, q])

  const gold = customers.filter((c) => c.tier === 'gold').length
  const silver = customers.filter((c) => c.tier === 'silver').length
  const totalPoints = customers.reduce((a, c) => a + c.points, 0)

  const del = async (c: Customer) => {
    if (!confirm(`Hapus member "${c.name}"? Riwayat transaksinya tetap tersimpan.`)) return
    await deleteCustomer(c.id)
  }

  return (
    <div className="mx-auto max-w-[1400px] p-4 sm:p-5">
      <ViewHeader title="Pelanggan" desc="Database member & program loyalitas toko.">
        <Button size="sm" className="h-9 bg-zinc-900 font-semibold text-white hover:bg-zinc-800"
          onClick={() => { setEditing(null); setDialogOpen(true) }}>
          <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" /> Member Baru
        </Button>
      </ViewHeader>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total Member" value={angka(customers.length)} icon={UsersRound} tone="emerald" />
        <StatCard label="Member Gold" value={angka(gold)} icon={Crown} tone="amber" />
        <StatCard label="Member Silver" value={angka(silver)} icon={Medal} />
        <StatCard label="Poin Beredar" value={angka(totalPoints)} icon={Star} />
      </div>

      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama, kode, atau nomor HP…"
          className="h-10 border-zinc-200 bg-white pl-9" aria-label="Cari pelanggan" />
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="zpos-scroll max-h-[560px] overflow-y-auto">
          {filtered.length === 0 ? (
            <EmptyState icon={UsersRound} title={q ? 'Tidak ada hasil' : 'Belum ada member'}
              desc={q ? 'Coba kata kunci lain.' : 'Daftarkan pelanggan pertama Anda.'} />
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-zinc-50 text-[11px] uppercase tracking-wide text-zinc-400">
                <tr>
                  <th className="px-4 py-2.5 text-left font-semibold">Member</th>
                  <th className="px-4 py-2.5 text-center font-semibold">Tier</th>
                  <th className="hidden px-4 py-2.5 text-right font-semibold sm:table-cell">Poin</th>
                  <th className="hidden px-4 py-2.5 text-right font-semibold md:table-cell">Total Belanja</th>
                  <th className="hidden px-4 py-2.5 text-center font-semibold lg:table-cell">Kunjungan</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-zinc-50">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[11px] font-bold text-zinc-500">
                          {c.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-zinc-900">{c.name}</p>
                          <p className="truncate text-[11px] text-zinc-400">
                            <span className="font-mono">{c.code}</span>{c.phone && <> · {c.phone}</>}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-center"><TierBadge tier={c.tier} /></td>
                    <td className="hidden px-4 py-2.5 text-right font-bold tabular-nums text-amber-600 sm:table-cell">
                      <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5" aria-hidden="true" />{angka(c.points)}</span>
                    </td>
                    <td className="hidden px-4 py-2.5 text-right font-semibold tabular-nums text-zinc-900 md:table-cell">
                      {rupiah(c.totalSpend)}
                    </td>
                    <td className="hidden px-4 py-2.5 text-center text-xs tabular-nums text-zinc-500 lg:table-cell">
                      {c.visitCount}×
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" aria-label={`Aksi untuk ${c.name}`}>
                            <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => { setEditing(c); setDialogOpen(true) }}>
                            <Pencil className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" /> Ubah
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => void del(c)} className="text-rose-600 focus:text-rose-700">
                            <Trash2 className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" /> Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <CustomerDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} />
    </div>
  )
}
