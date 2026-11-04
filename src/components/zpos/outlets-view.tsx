'use client'

import { useState } from 'react'
import { useZPos } from '@/lib/store'
import { cn } from '@/lib/utils'
import type { Outlet } from '@/lib/zpos-types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { StatCard, ViewHeader, EmptyState } from './ui-bits'
import {
  Building2, Loader2, MapPin, Pencil, Phone, Plus, Star, Store, Trash2,
} from 'lucide-react'

function OutletDialog({
  open, onOpenChange, editing,
}: { open: boolean; onOpenChange: (o: boolean) => void; editing: Outlet | null }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && <OutletForm key={editing?.id ?? 'new'} editing={editing} onClose={() => onOpenChange(false)} />}
    </Dialog>
  )
}

function OutletForm({ editing, onClose }: { editing: Outlet | null; onClose: () => void }) {
  const saveOutlet = useZPos((s) => s.saveOutlet)
  const [form, setForm] = useState(() =>
    editing
      ? { name: editing.name, address: editing.address, phone: editing.phone, isMain: editing.isMain }
      : { name: '', address: '', phone: '', isMain: false }
  )
  const [busy, setBusy] = useState(false)

  const valid = form.name.trim().length >= 3

  const submit = async () => {
    if (!valid) return
    setBusy(true)
    const ok = await saveOutlet(editing ? { id: editing.id, ...form } : form)
    setBusy(false)
    if (ok) onClose()
  }

  return (
    <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-4.5 w-4.5" aria-hidden="true" /> {editing ? 'Ubah Outlet' : 'Outlet Baru'}
          </DialogTitle>
          <DialogDescription>Cabang toko Anda. Outlet utama dipakai sebagai lokasi default.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid gap-1.5">
            <Label htmlFor="out-name">Nama Outlet *</Label>
            <Input id="out-name" className="bg-white" value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Kopi Nusantara — Dago" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="out-address">Alamat</Label>
            <Textarea id="out-address" rows={2} className="bg-white" value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="out-phone">Telepon</Label>
            <Input id="out-phone" className="bg-white" value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="0812-…" />
          </div>
          {editing && !editing.isMain && (
            <label className="flex items-center gap-2 text-xs font-medium text-zinc-600">
              <input
                type="checkbox"
                checked={form.isMain}
                onChange={(e) => setForm((f) => ({ ...f, isMain: e.target.checked }))}
                className="h-4 w-4 rounded border-zinc-300 accent-zinc-900"
              />
              Jadikan outlet utama
            </label>
          )}
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

export function OutletsView() {
  const outlets = useZPos((s) => s.outlets)
  const deleteOutlet = useZPos((s) => s.deleteOutlet)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Outlet | null>(null)

  const activeCount = outlets.filter((o) => o.isActive).length

  const del = async (o: Outlet) => {
    if (!confirm(`Hapus outlet "${o.name}"?`)) return
    await deleteOutlet(o.id)
  }

  return (
    <div className="mx-auto max-w-[1400px] p-4 sm:p-5">
      <ViewHeader title="Outlet" desc="Kelola cabang — siap untuk multi-toko seiring bisnis tumbuh.">
        <Button size="sm" className="h-9 bg-zinc-900 font-semibold text-white hover:bg-zinc-800"
          onClick={() => { setEditing(null); setDialogOpen(true) }}>
          <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" /> Outlet Baru
        </Button>
      </ViewHeader>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total Outlet" value={String(outlets.length)} icon={Store} />
        <StatCard label="Sedang Aktif" value={String(activeCount)} icon={Building2} tone="emerald" />
        <StatCard label="Outlet Utama" value={String(outlets.filter((o) => o.isMain).length)} icon={Star} tone="amber" />
        <StatCard label="Nonaktif" value={String(outlets.length - activeCount)} icon={MapPin} />
      </div>

      {outlets.length === 0 ? (
        <EmptyState icon={Store} title="Belum ada outlet" desc="Tambahkan lokasi toko pertama Anda." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {outlets.map((o) => (
            <div key={o.id} className={cn(
              'flex flex-col rounded-xl border p-4 shadow-sm transition-shadow hover:shadow-md',
              o.isMain ? 'border-zinc-900 bg-white' : 'border-zinc-200 bg-white',
              !o.isActive && 'opacity-70'
            )}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-start gap-3">
                  <span className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                    o.isMain ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500'
                  )}>
                    <Store className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-zinc-900">{o.name}</p>
                    {o.isMain && (
                      <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-200">
                        <Star className="h-2.5 w-2.5" aria-hidden="true" /> Outlet Utama
                      </span>
                    )}
                  </div>
                </div>
                <span className={cn(
                  'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold',
                  o.isActive ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-zinc-100 text-zinc-400 ring-1 ring-zinc-200'
                )}>
                  {o.isActive ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-zinc-500">
                <p className="flex items-start gap-1.5">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-300" aria-hidden="true" />
                  <span className="line-clamp-2">{o.address || 'Tanpa alamat'}</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-zinc-300" aria-hidden="true" />
                  {o.phone || 'Tanpa telepon'}
                </p>
              </div>

              <div className="mt-auto flex items-center justify-end gap-1 border-t border-zinc-100 pt-3">
                {!o.isMain && (
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                    onClick={() => void del(o)} aria-label={`Hapus ${o.name}`}>
                    <Trash2 className="mr-1 h-3.5 w-3.5" aria-hidden="true" /> Hapus
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-zinc-500 hover:text-zinc-900"
                  onClick={() => { setEditing(o); setDialogOpen(true) }}>
                  <Pencil className="mr-1 h-3.5 w-3.5" aria-hidden="true" /> Ubah
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <OutletDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} />
    </div>
  )
}
