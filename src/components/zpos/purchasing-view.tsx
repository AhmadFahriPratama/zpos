'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import { useZPos } from '@/lib/store'
import { cn } from '@/lib/utils'
import { rupiah, angka, tanggalWaktu } from '@/lib/format'
import type { Purchase, Supplier } from '@/lib/zpos-types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { StatCard, ViewHeader, EmptyState } from './ui-bits'
import {
  Building2, CheckCircle2, ChevronDown, ClipboardList, Loader2, PackagePlus,
  Phone, Plus, Trash2, Truck,
} from 'lucide-react'

/* ================= Dialog Pembelian ================= */
function PurchaseDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && <PurchaseForm onClose={() => onOpenChange(false)} />}
    </Dialog>
  )
}

function PurchaseForm({ onClose }: { onClose: () => void }) {
  const products = useZPos((s) => s.products)
  const createPurchase = useZPos((s) => s.createPurchase)

  const first = products[0]
  const [supplierId, setSupplierId] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [lines, setLines] = useState<Array<{ productId: string; qty: number; cost: number }>>(
    first ? [{ productId: first.id, qty: 1, cost: first.cost }] : []
  )
  const [supplierList, setSupplierList] = useState<Supplier[]>([])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch('/api/suppliers')
        if (res.ok && !cancelled) setSupplierList((await res.json()) as Supplier[])
      } catch { /* ditangani saat submit */ }
    })()
    return () => { cancelled = true }
  }, [])

  const addLine = () => {
    const p = products[0]
    if (!p) return
    setLines((ls) => [...ls, { productId: p.id, qty: 1, cost: p.cost }])
  }

  const updateLine = (i: number, patch: Partial<{ productId: string; qty: number; cost: number }>) => {
    setLines((ls) => ls.map((l, idx) => {
      if (idx !== i) return l
      const next = { ...l, ...patch }
      if (patch.productId !== undefined) {
        const p = products.find((x) => x.id === patch.productId)
        next.cost = p?.cost ?? 0
      }
      return next
    }))
  }

  const total = lines.reduce((a, l) => a + l.qty * l.cost, 0)
  const valid = supplierId && lines.length > 0 && lines.every((l) => l.productId && l.qty > 0)

  const submit = async () => {
    if (!valid) return
    setBusy(true)
    const ok = await createPurchase({
      supplierId, note,
      items: lines.map((l) => ({ productId: l.productId, qty: l.qty, cost: l.cost })),
    })
    setBusy(false)
    if (ok) onClose()
  }

  return (
    <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackagePlus className="h-4.5 w-4.5" aria-hidden="true" /> Pembelian Barang Baru
          </DialogTitle>
          <DialogDescription>
            Pilih supplier, tambahkan item yang dibeli. Stok otomatis bertambah saat pembelian diterima.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-1.5">
            <Label htmlFor="po-supplier">Supplier</Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger id="po-supplier" className="w-full bg-white">
                <SelectValue placeholder="Pilih supplier…" />
              </SelectTrigger>
              <SelectContent>
                {supplierList.filter((s) => s.isActive).map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Item Pembelian</Label>
              <Button type="button" variant="outline" size="sm" className="h-8 border-zinc-200 bg-white" onClick={addLine}>
                <Plus className="mr-1 h-3.5 w-3.5" aria-hidden="true" /> Tambah Item
              </Button>
            </div>
            {lines.length === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center text-xs text-zinc-400">
                Belum ada item — klik “Tambah Item” untuk memilih produk.
              </div>
            ) : (
              <div className="space-y-2">
                {lines.map((l, i) => (
                  <div key={i} className="grid grid-cols-[1fr_64px_110px_32px] items-center gap-2 rounded-lg border border-zinc-200 bg-white p-2">
                    <Select value={l.productId} onValueChange={(v) => updateLine(i, { productId: v })}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Produk…" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} · stok {p.stock}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number" min={1} value={l.qty || ''}
                      onChange={(e) => updateLine(i, { qty: Math.max(1, Number(e.target.value) || 1) })}
                      className="bg-white text-center" aria-label="Jumlah"
                    />
                    <Input
                      type="number" min={0} value={l.cost || ''}
                      onChange={(e) => updateLine(i, { cost: Math.max(0, Number(e.target.value) || 0) })}
                      className="bg-white text-right" aria-label="Harga beli"
                    />
                    <button
                      onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                      aria-label="Hapus baris"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="po-note">Catatan (opsional)</Label>
            <Textarea id="po-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Contoh: pengiriman tiap Senin" />
          </div>

          <div className="flex items-center justify-between rounded-lg bg-zinc-900 px-4 py-3 text-white">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Total Pembelian</span>
            <span className="text-lg font-bold tabular-nums">{rupiah(total)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="border-zinc-200 bg-white" onClick={onClose}>Batal</Button>
          <Button className="bg-emerald-600 font-semibold text-white hover:bg-emerald-700" disabled={!valid || busy} onClick={submit}>
            {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />}
            Terima & Tambah Stok
          </Button>
        </DialogFooter>
      </DialogContent>
  )
}

/* ================= Dialog Supplier ================= */
function SupplierDialog({
  open, onOpenChange, editing,
}: { open: boolean; onOpenChange: (o: boolean) => void; editing: Supplier | null }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && <SupplierForm key={editing?.id ?? 'new'} editing={editing} onClose={() => onOpenChange(false)} />}
    </Dialog>
  )
}

function SupplierForm({ editing, onClose }: { editing: Supplier | null; onClose: () => void }) {
  const saveSupplier = useZPos((s) => s.saveSupplier)
  const [form, setForm] = useState(() =>
    editing
      ? { name: editing.name, contact: editing.contact, phone: editing.phone, email: editing.email, address: editing.address }
      : { name: '', contact: '', phone: '', email: '', address: '' }
  )
  const [busy, setBusy] = useState(false)

  const valid = form.name.trim().length >= 2

  const submit = async () => {
    if (!valid) return
    setBusy(true)
    const ok = await saveSupplier(editing ? { id: editing.id, ...form } : form)
    setBusy(false)
    if (ok) onClose()
  }

  return (
    <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? 'Ubah Supplier' : 'Supplier Baru'}</DialogTitle>
          <DialogDescription>Data pemasok barang untuk toko Anda.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid gap-1.5">
            <Label htmlFor="sup-name">Nama Supplier *</Label>
            <Input id="sup-name" className="bg-white" value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="PT Sumber Sejahtera" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="sup-contact">Narahubung</Label>
              <Input id="sup-contact" className="bg-white" value={form.contact}
                onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))} placeholder="Pak Budi" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="sup-phone">Telepon</Label>
              <Input id="sup-phone" className="bg-white" value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="0812-…" />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="sup-email">Email</Label>
            <Input id="sup-email" type="email" className="bg-white" value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="sales@supplier.id" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="sup-address">Alamat</Label>
            <Textarea id="sup-address" rows={2} className="bg-white" value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
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

/* ================= View Utama ================= */
type Tab = 'po' | 'supplier'

export function PurchasingView() {
  const [tab, setTab] = useState<Tab>('po')
  const [purchases, setPurchases] = useState<Purchase[] | null>(null)
  const [suppliers, setSuppliers] = useState<Supplier[] | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [supDialog, setSupDialog] = useState(false)
  const [editingSup, setEditingSup] = useState<Supplier | null>(null)
  const deleteSupplier = useZPos((s) => s.deleteSupplier)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const [r1, r2] = await Promise.all([fetch('/api/purchases'), fetch('/api/suppliers')])
        if (cancelled) return
        if (r1.ok) setPurchases((await r1.json()) as Purchase[])
        if (r2.ok) setSuppliers((await r2.json()) as Supplier[])
      } catch { /* ditangani tampilan kosong */ }
    })()
    return () => { cancelled = true }
  }, [])

  const reload = async () => {
    try {
      const [r1, r2] = await Promise.all([fetch('/api/purchases'), fetch('/api/suppliers')])
      if (r1.ok) setPurchases((await r1.json()) as Purchase[])
      if (r2.ok) setSuppliers((await r2.json()) as Supplier[])
    } catch { /* ditangani tampilan kosong */ }
  }

  const totalBulanIni = useMemo(() => {
    if (!purchases) return 0
    const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0)
    return purchases
      .filter((p) => new Date(p.createdAt) >= start)
      .reduce((a, b) => a + b.total, 0)
  }, [purchases])

  const delSupplier = async (s: Supplier) => {
    if (!confirm(`Hapus supplier "${s.name}"?`)) return
    const ok = await deleteSupplier(s.id)
    if (ok) void reload()
  }
  return (
    <div className="mx-auto max-w-[1400px] p-4 sm:p-5">
      <ViewHeader title="Pembelian & Supplier" desc="Pesan barang ke pemasok — stok masuk otomatis saat diterima.">
        {tab === 'po' ? (
          <Button size="sm" className="h-9 bg-emerald-600 font-semibold text-white hover:bg-emerald-700" onClick={() => setDialogOpen(true)}>
            <PackagePlus className="mr-1.5 h-4 w-4" aria-hidden="true" /> Buat Pembelian
          </Button>
        ) : (
          <Button size="sm" className="h-9 bg-zinc-900 font-semibold text-white hover:bg-zinc-800" onClick={() => { setEditingSup(null); setSupDialog(true) }}>
            <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" /> Supplier Baru
          </Button>
        )}
      </ViewHeader>

      {/* Ringkasan */}
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="PO Bulan Ini" value={angka(purchases?.length ?? 0)} icon={ClipboardList} />
        <StatCard label="Nilai Bulan Ini" value={rupiah(totalBulanIni)} icon={Truck} tone="emerald" />
        <StatCard label="Supplier Aktif" value={angka(suppliers?.filter((s) => s.isActive).length ?? 0)} icon={Building2} />
        <StatCard label="Total Supplier" value={angka(suppliers?.length ?? 0)} icon={Phone} />
      </div>

      {/* Tab */}
      <div className="mb-4 flex rounded-lg border border-zinc-200 bg-white p-0.5 w-fit">
        {([['po', 'Pesanan Pembelian'], ['supplier', 'Supplier']] as const).map(([v, label]) => (
          <button
            key={v}
            onClick={() => setTab(v)}
            className={cn(
              'rounded-md px-4 py-1.5 text-xs font-bold transition-colors',
              tab === v ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-900'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'po' ? (
        /* ---- Daftar PO ---- */
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="zpos-scroll max-h-[560px] overflow-y-auto">
            {!purchases ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-zinc-300" aria-hidden="true" />
              </div>
            ) : purchases.length === 0 ? (
              <EmptyState icon={ClipboardList} title="Belum ada pembelian" desc="Buat pembelian pertama — stok akan bertambah otomatis." />
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-zinc-50 text-[11px] uppercase tracking-wide text-zinc-400">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-semibold">No. PO</th>
                    <th className="px-4 py-2.5 text-left font-semibold">Supplier</th>
                    <th className="hidden px-4 py-2.5 text-left font-semibold sm:table-cell">Tanggal</th>
                    <th className="hidden px-4 py-2.5 text-center font-semibold md:table-cell">Item</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Total</th>
                    <th className="px-4 py-2.5 text-center font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {purchases.map((p) => {
                    const open = expanded === p.id
                    return (
                      <Fragment key={p.id}>
                        <tr
                          onClick={() => setExpanded(open ? null : p.id)}
                          className={cn('cursor-pointer transition-colors hover:bg-zinc-50', open && 'bg-zinc-50')}
                        >
                          <td className="px-4 py-2.5">
                            <span className="flex items-center gap-1.5 font-mono text-xs font-semibold text-zinc-900">
                              <ChevronDown className={cn('h-3.5 w-3.5 text-zinc-300 transition-transform', open && 'rotate-180')} aria-hidden="true" />
                              {p.poNo}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 font-medium text-zinc-700">{p.supplier.name}</td>
                          <td className="hidden px-4 py-2.5 text-xs text-zinc-500 sm:table-cell">{tanggalWaktu(p.receivedAt ?? p.createdAt)}</td>
                          <td className="hidden px-4 py-2.5 text-center text-xs tabular-nums text-zinc-500 md:table-cell">{p.items.length}</td>
                          <td className="px-4 py-2.5 text-right font-bold tabular-nums text-zinc-900">{rupiah(p.total)}</td>
                          <td className="px-4 py-2.5 text-center">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                              <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> Diterima
                            </span>
                          </td>
                        </tr>
                        {open && (
                          <tr>
                            <td colSpan={6} className="bg-zinc-50/60 px-4 pb-4">
                              <div className="mt-1 rounded-lg border border-zinc-200 bg-white">
                                <ul className="divide-y divide-zinc-100">
                                  {p.items.map((it) => (
                                    <li key={it.id} className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
                                      <span className="min-w-0 truncate font-medium text-zinc-700">{it.name}</span>
                                      <span className="shrink-0 tabular-nums text-zinc-500">
                                        {it.qty} × {rupiah(it.cost)} = <span className="font-semibold text-zinc-900">{rupiah(it.subtotal)}</span>
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                                {p.note && <p className="border-t border-zinc-100 px-3 py-2 text-[11px] italic text-zinc-400">{p.note}</p>}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        /* ---- Daftar Supplier ---- */
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="zpos-scroll max-h-[560px] overflow-y-auto">
            {!suppliers ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-zinc-300" aria-hidden="true" />
              </div>
            ) : suppliers.length === 0 ? (
              <EmptyState icon={Building2} title="Belum ada supplier" desc="Tambahkan pemasok untuk mulai mencatat pembelian." />
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-zinc-50 text-[11px] uppercase tracking-wide text-zinc-400">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-semibold">Nama</th>
                    <th className="hidden px-4 py-2.5 text-left font-semibold md:table-cell">Kontak</th>
                    <th className="hidden px-4 py-2.5 text-left font-semibold lg:table-cell">Telepon</th>
                    <th className="px-4 py-2.5 text-center font-semibold">PO</th>
                    <th className="px-4 py-2.5 text-center font-semibold">Status</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {suppliers.map((s) => (
                    <tr key={s.id} className="transition-colors hover:bg-zinc-50">
                      <td className="px-4 py-2.5">
                        <p className="font-semibold text-zinc-900">{s.name}</p>
                        <p className="max-w-[220px] truncate text-[11px] text-zinc-400">{s.address || '—'}</p>
                      </td>
                      <td className="hidden px-4 py-2.5 text-zinc-600 md:table-cell">{s.contact || '—'}</td>
                      <td className="hidden px-4 py-2.5 font-mono text-xs text-zinc-500 lg:table-cell">{s.phone || '—'}</td>
                      <td className="px-4 py-2.5 text-center">
                        <Badge variant="secondary" className="bg-zinc-100 font-bold text-zinc-600">{s._count?.purchases ?? 0}</Badge>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {s.isActive ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600"><CheckCircle2 className="h-3 w-3" aria-hidden="true" /> Aktif</span>
                        ) : (
                          <span className="text-[11px] font-bold text-zinc-400">Nonaktif</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-zinc-500 hover:text-zinc-900"
                            onClick={() => { setEditingSup(s); setSupDialog(true) }}>
                            Ubah
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                            onClick={() => void delSupplier(s)}>
                            Hapus
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      <PurchaseDialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) void reload() }} />
      <SupplierDialog open={supDialog} onOpenChange={setSupDialog} editing={editingSup} />
    </div>
  )
}
