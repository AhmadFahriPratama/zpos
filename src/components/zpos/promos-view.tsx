'use client'

import { useState } from 'react'
import { useZPos } from '@/lib/store'
import { cn } from '@/lib/utils'
import { rupiah, tanggalPendek } from '@/lib/format'
import type { Promo } from '@/lib/zpos-types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { StatCard, ViewHeader, EmptyState } from './ui-bits'
import {
  BadgePercent, Banknote, CalendarClock, Loader2, Pencil, Plus, Tags, Ticket, Trash2,
} from 'lucide-react'

type PromoStatus = 'aktif' | 'terjadwal' | 'berakhir' | 'nonaktif'

function promoStatus(p: Promo, now: Date): PromoStatus {
  if (!p.isActive) return 'nonaktif'
  if (now < new Date(p.startsAt)) return 'terjadwal'
  if (p.endsAt && now > new Date(p.endsAt)) return 'berakhir'
  return 'aktif'
}

const STATUS_META: Record<PromoStatus, { chip: string }> = {
  aktif: { chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
  terjadwal: { chip: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
  berakhir: { chip: 'bg-zinc-100 text-zinc-500 ring-1 ring-zinc-200' },
  nonaktif: { chip: 'bg-zinc-100 text-zinc-400 ring-1 ring-zinc-200' },
}

function PromoDialog({
  open, onOpenChange, editing,
}: { open: boolean; onOpenChange: (o: boolean) => void; editing: Promo | null }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && <PromoForm key={editing?.id ?? 'new'} editing={editing} onClose={() => onOpenChange(false)} />}
    </Dialog>
  )
}

function PromoForm({ editing, onClose }: { editing: Promo | null; onClose: () => void }) {
  const savePromo = useZPos((s) => s.savePromo)
  const [form, setForm] = useState(() => {
    if (editing) {
      return {
        code: editing.code, name: editing.name, type: editing.type, value: editing.value,
        minPurchase: editing.minPurchase,
        startsAt: editing.startsAt.slice(0, 10),
        endsAt: editing.endsAt ? editing.endsAt.slice(0, 10) : '',
      }
    }
    const today = new Date().toISOString().slice(0, 10)
    return { code: '', name: '', type: 'percent', value: 10, minPurchase: 0, startsAt: today, endsAt: '' }
  })
  const [busy, setBusy] = useState(false)

  const valueValid = form.type === 'percent' ? form.value > 0 && form.value <= 100 : form.value > 0
  const valid = form.code.trim().length >= 2 && form.name.trim().length >= 3 && valueValid

  const submit = async () => {
    if (!valid) return
    setBusy(true)
    const ok = await savePromo({
      ...(editing ? { id: editing.id } : {}),
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      type: form.type,
      value: form.value,
      minPurchase: form.minPurchase,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : undefined,
      endsAt: form.endsAt ? new Date(`${form.endsAt}T23:59:59`).toISOString() : null,
    })
    setBusy(false)
    if (ok) onClose()
  }

  return (
    <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="h-4.5 w-4.5" aria-hidden="true" /> {editing ? 'Ubah Promo' : 'Promo Baru'}
          </DialogTitle>
          <DialogDescription>Promo dipakai otomatis di kasir saat syarat terpenuhi.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-[140px_1fr] gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="promo-code">Kode *</Label>
              <Input id="promo-code" className="bg-white font-mono font-bold uppercase" value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="PROMO10" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="promo-name">Nama Promo *</Label>
              <Input id="promo-name" className="bg-white" value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Diskon 10% semua menu" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Jenis Potongan</Label>
              <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger className="w-full bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Persentase (%)</SelectItem>
                  <SelectItem value="fixed">Nominal (Rp)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="promo-value">Nilai *</Label>
              <div className="relative">
                {form.type === 'fixed' && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400">Rp</span>
                )}
                <Input id="promo-value" type="number" min={0} max={form.type === 'percent' ? 100 : undefined}
                  className={cn('bg-white tabular-nums', form.type === 'fixed' ? 'pl-9' : 'pr-8')}
                  value={form.value || ''}
                  onChange={(e) => setForm((f) => ({ ...f, value: Math.max(0, Number(e.target.value) || 0) }))} />
                {form.type === 'percent' && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400">%</span>
                )}
              </div>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="promo-min">Minimal Belanja</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-400">Rp</span>
              <Input id="promo-min" type="number" min={0} className="bg-white pl-9 tabular-nums" value={form.minPurchase || ''}
                onChange={(e) => setForm((f) => ({ ...f, minPurchase: Math.max(0, Number(e.target.value) || 0) }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="promo-start">Mulai</Label>
              <Input id="promo-start" type="date" className="bg-white" value={form.startsAt}
                onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="promo-end">Berakhir (opsional)</Label>
              <Input id="promo-end" type="date" className="bg-white" value={form.endsAt}
                onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))} />
            </div>
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

export function PromosView() {
  const promos = useZPos((s) => s.promos)
  const savePromo = useZPos((s) => s.savePromo)
  const deletePromo = useZPos((s) => s.deletePromo)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Promo | null>(null)
  const [now] = useState(() => new Date())

  const activeCount = promos.filter((p) => now && promoStatus(p, now) === 'aktif').length
  const scheduled = promos.filter((p) => now && promoStatus(p, now) === 'terjadwal').length
  const totalUsage = promos.reduce((a, p) => a + p.usageCount, 0)

  const del = async (p: Promo) => {
    if (!confirm(`Hapus promo "${p.code}"?`)) return
    await deletePromo(p.id)
  }

  return (
    <div className="mx-auto max-w-[1400px] p-4 sm:p-5">
      <ViewHeader title="Promo" desc="Diskon otomatis untuk menarik lebih banyak pembeli.">
        <Button size="sm" className="h-9 bg-zinc-900 font-semibold text-white hover:bg-zinc-800"
          onClick={() => { setEditing(null); setDialogOpen(true) }}>
          <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" /> Promo Baru
        </Button>
      </ViewHeader>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Promo Aktif" value={String(activeCount)} icon={BadgePercent} tone="emerald" />
        <StatCard label="Terjadwal" value={String(scheduled)} icon={CalendarClock} tone="amber" />
        <StatCard label="Total Promo" value={String(promos.length)} icon={Tags} />
        <StatCard label="Kali Terpakai" value={String(totalUsage)} icon={Ticket} />
      </div>

      {promos.length === 0 ? (
        <EmptyState icon={Tags} title="Belum ada promo" desc="Buat promo pertama — kode promo dipakai di layar kasir." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {promos.map((p) => {
            const status = now ? promoStatus(p, now) : 'nonaktif'
            return (
              <div key={p.id} className={cn(
                'flex flex-col rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md',
                status === 'aktif' ? 'border-zinc-200' : 'border-zinc-200 opacity-75'
              )}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-bold tracking-wide text-zinc-900">{p.code}</p>
                    <p className="mt-0.5 truncate text-xs text-zinc-500">{p.name}</p>
                  </div>
                  <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold capitalize', STATUS_META[status].chip)}>
                    {status}
                  </span>
                </div>

                <div className="my-3 flex items-center gap-2 rounded-lg bg-zinc-50 px-3 py-2">
                  {p.type === 'percent' ? (
                    <BadgePercent className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                  ) : (
                    <Banknote className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                  )}
                  <p className="text-sm font-bold tabular-nums text-zinc-900">
                    {p.type === 'percent' ? `${p.value}%` : rupiah(p.value)}
                    <span className="ml-1.5 text-[11px] font-medium text-zinc-400">potongan</span>
                  </p>
                  <p className="ml-auto text-right text-[10px] leading-tight text-zinc-400">
                    min.<br /><span className="font-semibold text-zinc-600">{rupiah(p.minPurchase)}</span>
                  </p>
                </div>

                <p className="text-[11px] text-zinc-400">
                  {tanggalPendek(p.startsAt)} — {p.endsAt ? tanggalPendek(p.endsAt) : 'selamanya'} · terpakai {p.usageCount}×
                </p>

                <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-3">
                  <label className="flex items-center gap-2 text-[11px] font-semibold text-zinc-500">
                    <Switch
                      checked={p.isActive}
                      onCheckedChange={(v) => void savePromo({ id: p.id, isActive: v })}
                      aria-label={`Aktifkan promo ${p.code}`}
                    />
                    Aktif
                  </label>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-zinc-500 hover:text-zinc-900"
                      onClick={() => { setEditing(p); setDialogOpen(true) }}>
                      <Pencil className="mr-1 h-3.5 w-3.5" aria-hidden="true" /> Ubah
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                      onClick={() => void del(p)} aria-label={`Hapus ${p.code}`}>
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <PromoDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} />
    </div>
  )
}
