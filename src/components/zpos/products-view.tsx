'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useZPos } from '@/lib/store'
import { cn } from '@/lib/utils'
import { rupiah, angka } from '@/lib/format'
import type { Product } from '@/lib/zpos-types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ViewHeader, EmptyState } from './ui-bits'
import {
  ArrowUpDown, MoreHorizontal, Package, PackagePlus, Pencil, Power, Search, Trash2,
} from 'lucide-react'

interface FormState {
  id?: string
  name: string
  sku: string
  barcode: string
  unit: string
  price: string
  cost: string
  stock: string
  minStock: string
  categoryId: string
}

const EMPTY_FORM: FormState = {
  name: '', sku: '', barcode: '', unit: 'pcs',
  price: '', cost: '', stock: '0', minStock: '5', categoryId: 'none',
}

function productToForm(p: Product): FormState {
  return {
    id: p.id, name: p.name, sku: p.sku, barcode: p.barcode ?? '', unit: p.unit,
    price: String(p.price), cost: String(p.cost), stock: String(p.stock),
    minStock: String(p.minStock), categoryId: p.categoryId ?? 'none',
  }
}

export function ProductsView() {
  const products = useZPos((s) => s.products)
  const categories = useZPos((s) => s.categories)
  const saveProduct = useZPos((s) => s.saveProduct)
  const deleteProduct = useZPos((s) => s.deleteProduct)

  const [search, setSearch] = useState('')
  const [form, setForm] = useState<FormState | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null)
  const [sortAsc, setSortAsc] = useState(true)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = products.filter(
      (p) =>
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode ?? '').includes(q)
    )
    return [...list].sort((a, b) =>
      sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    )
  }, [products, search, sortAsc])

  const submit = async () => {
    if (!form) return
    if (!form.name.trim()) {
      toast.error('Nama produk wajib diisi')
      return
    }
    if (!(Number(form.price) > 0)) {
      toast.error('Harga jual harus lebih dari 0')
      return
    }
    setSaving(true)
    const ok = await saveProduct({
      id: form.id,
      name: form.name,
      sku: form.sku || undefined,
      barcode: form.barcode || null,
      unit: form.unit,
      price: Number(form.price),
      cost: Number(form.cost) || 0,
      stock: Number(form.stock) || 0,
      minStock: Number(form.minStock) || 0,
      categoryId: form.categoryId === 'none' ? null : form.categoryId,
    })
    setSaving(false)
    if (ok) setForm(null)
  }

  const toggleActive = async (p: Product) => {
    await saveProduct({ id: p.id, name: p.name, price: p.price, isActive: !p.isActive })
    toast.success(`${p.name} ${p.isActive ? 'dinonaktifkan' : 'diaktifkan'}`)
  }

  return (
    <div>
      <ViewHeader title="Manajemen Produk" desc="Kelola katalog, harga, dan stok minimum.">
        <Button
          className="bg-zinc-900 text-white hover:bg-zinc-800"
          onClick={() => setForm({ ...EMPTY_FORM })}
        >
          <PackagePlus className="mr-2 h-4 w-4" aria-hidden="true" /> Tambah Produk
        </Button>
      </ViewHeader>

      <div className="mb-3 flex items-center gap-2">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari produk / SKU / barcode…"
            className="h-9 bg-white pl-9 text-sm"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-9 border-zinc-200 bg-white"
          onClick={() => setSortAsc(!sortAsc)}
        >
          <ArrowUpDown className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          {sortAsc ? 'A → Z' : 'Z → A'}
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Package} title="Tidak ada produk" desc="Coba kata kunci lain atau tambah produk baru." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-zinc-50/80 hover:bg-zinc-50/80">
                <TableHead className="pl-4">Produk</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-right">Harga Jual</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Harga Beli</TableHead>
                <TableHead className="text-right">Stok</TableHead>
                <TableHead className="hidden md:table-cell">Margin</TableHead>
                <TableHead className="text-center">Aktif</TableHead>
                <TableHead className="w-10 pr-3" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => {
                const margin = p.price > 0 ? Math.round(((p.price - p.cost) / p.price) * 100) : 0
                const low = p.stock <= p.minStock
                return (
                  <TableRow key={p.id} className={cn(!p.isActive && 'opacity-50')}>
                    <TableCell className="max-w-[220px] pl-4">
                      <p className="truncate text-sm font-semibold text-zinc-900">{p.name}</p>
                      <p className="truncate font-mono text-[11px] text-zinc-400">
                        {p.sku}{p.barcode ? ` · ${p.barcode}` : ''}
                      </p>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-zinc-600">{p.category?.name ?? '—'}</span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold tabular-nums">
                      {rupiah(p.price)}
                    </TableCell>
                    <TableCell className="hidden text-right font-mono text-xs tabular-nums text-zinc-400 sm:table-cell">
                      {rupiah(p.cost)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="secondary"
                        className={cn(
                          'font-mono tabular-nums',
                          p.stock <= 0
                            ? 'bg-rose-100 text-rose-700'
                            : low
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-zinc-100 text-zinc-600'
                        )}
                      >
                        {angka(p.stock)} {p.unit}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span
                        className={cn(
                          'text-xs font-semibold',
                          margin >= 20 ? 'text-emerald-600' : margin >= 10 ? 'text-amber-600' : 'text-rose-600'
                        )}
                      >
                        {margin}%
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch checked={p.isActive} onCheckedChange={() => void toggleActive(p)} aria-label={`Aktifkan ${p.name}`} />
                    </TableCell>
                    <TableCell className="pr-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700" aria-label="Menu aksi">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => setForm(productToForm(p))}>
                            <Pencil className="mr-2 h-3.5 w-3.5" /> Edit Produk
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => void toggleActive(p)}>
                            <Power className="mr-2 h-3.5 w-3.5" /> {p.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-rose-600 focus:text-rose-600"
                            onClick={() => setConfirmDelete(p)}
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" /> Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialog tambah/edit */}
      <Dialog open={form !== null} onOpenChange={(o) => !o && setForm(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{form?.id ? 'Edit Produk' : 'Tambah Produk Baru'}</DialogTitle>
            <DialogDescription>
              Harga &amp; stok yang konsisten menjaga akurasi laporan laba.
            </DialogDescription>
          </DialogHeader>
          {form && (
            <div className="grid gap-3.5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="f-nama">Nama produk *</Label>
                <Input id="f-nama" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" placeholder="mis. Indomie Goreng" />
              </div>
              <div>
                <Label htmlFor="f-sku">SKU</Label>
                <Input id="f-sku" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="mt-1 font-mono" placeholder="otomatis bila kosong" />
              </div>
              <div>
                <Label htmlFor="f-barcode">Barcode</Label>
                <Input id="f-barcode" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} className="mt-1 font-mono" placeholder="8998866200011" />
              </div>
              <div>
                <Label htmlFor="f-kategori">Kategori</Label>
                <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tanpa kategori</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="f-unit">Satuan</Label>
                <Input id="f-unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="mt-1" placeholder="pcs / btl / kg" />
              </div>
              <div>
                <Label htmlFor="f-harga">Harga jual (Rp) *</Label>
                <Input id="f-harga" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value.replace(/[^0-9]/g, '') })} className="mt-1 text-right font-mono" inputMode="numeric" placeholder="0" />
              </div>
              <div>
                <Label htmlFor="f-cost">Harga beli (Rp)</Label>
                <Input id="f-cost" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value.replace(/[^0-9]/g, '') })} className="mt-1 text-right font-mono" inputMode="numeric" placeholder="0" />
              </div>
              <div>
                <Label htmlFor="f-stock">Stok {form.id ? '(ubah via menu Stok)' : ''}</Label>
                <Input id="f-stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value.replace(/[^0-9]/g, '') })} disabled={!!form.id} className="mt-1 text-right font-mono" inputMode="numeric" />
              </div>
              <div>
                <Label htmlFor="f-min">Stok minimum</Label>
                <Input id="f-min" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value.replace(/[^0-9]/g, '') })} className="mt-1 text-right font-mono" inputMode="numeric" />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setForm(null)}>Batal</Button>
            <Button className="bg-zinc-900 text-white hover:bg-zinc-800" disabled={saving} onClick={() => void submit()}>
              {saving ? 'Menyimpan…' : 'Simpan Produk'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog konfirmasi hapus */}
      <Dialog open={confirmDelete !== null} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus produk?</DialogTitle>
            <DialogDescription>
              {confirmDelete && (
                <>
                  <strong className="text-zinc-800">{confirmDelete.name}</strong> akan dihapus dari katalog.
                  Jika produk punya riwayat transaksi, produk hanya dinonaktifkan agar laporan tetap akurat.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Batal</Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (confirmDelete) await deleteProduct(confirmDelete.id)
                setConfirmDelete(null)
              }}
            >
              Ya, Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
