'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useZPos } from '@/lib/store'
import { cn } from '@/lib/utils'
import { rupiah } from '@/lib/format'
import type { Sale, Settings as SettingsType } from '@/lib/zpos-types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { ViewHeader, Kbd } from './ui-bits'
import { ReceiptDialog } from './receipt-dialog'
import {
  AlertTriangle, Loader2, Printer, RotateCcw, Save, Store,
} from 'lucide-react'

function Card({
  title, desc, children, className,
}: {
  title: string
  desc?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('rounded-xl border border-zinc-200 bg-white p-5 shadow-sm', className)}>
      <p className="text-sm font-bold text-zinc-900">{title}</p>
      {desc && <p className="mt-0.5 text-xs text-zinc-500">{desc}</p>}
      <div className="mt-4">{children}</div>
    </div>
  )
}

export function SettingsView() {
  const settings = useZPos((s) => s.settings)
  const saveData = useZPos((s) => s.resetDemo)
  const bootstrap = useZPos((s) => s.bootstrap)
  const serverInfo = useZPos((s) => s.serverInfo)

  const [form, setForm] = useState<Partial<SettingsType>>({})
  const [saving, setSaving] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [testSale, setTestSale] = useState<Sale | null>(null)

  useEffect(() => {
    if (settings) setForm({ ...settings })
  }, [settings])

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeName: form.storeName,
          storeAddress: form.storeAddress,
          storePhone: form.storePhone,
          taxEnabled: form.taxEnabled,
          taxRate: form.taxRate,
          receiptFooter: form.receiptFooter,
          paperWidth: form.paperWidth,
        }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(body.error ?? 'Gagal menyimpan')
      }
      toast.success('Pengaturan disimpan')
      await bootstrap()
    } catch (e) {
      toast.error('Gagal menyimpan', { description: e instanceof Error ? e.message : undefined })
    } finally {
      setSaving(false)
    }
  }

  const testPrint = () => {
    const now = new Date().toISOString()
    const demo: Sale = {
      id: 'test', invoiceNo: 'TEST-0001', status: 'paid',
      subtotal: 47000, discount: 0, orderDiscount: 0,
      tax: Number(form.taxEnabled) ? Math.round(47000 * ((form.taxRate ?? 11) / 100)) : 0,
      total: Number(form.taxEnabled) ? Math.round(47000 * (1 + (form.taxRate ?? 11) / 100)) : 47000,
      paidAmount: 100000, changeAmount: Number(form.taxEnabled)
        ? 100000 - Math.round(47000 * (1 + (form.taxRate ?? 11) / 100))
        : 100000 - 47000,
      method: 'cash', orderType: 'takeaway', note: null,
      cashierName: 'Uji Cetak', shiftId: null,
      voidReason: null, voidedAt: null, createdAt: now,
      items: [
        { id: 't1', productId: null, name: 'Kopi Susu Gula Aren', qty: 1, price: 25000, discount: 0, subtotal: 25000 },
        { id: 't2', productId: null, name: 'Butter Croissant', qty: 1, price: 22000, discount: 0, subtotal: 22000 },
      ],
    }
    setTestSale(demo)
  }

  const doReset = async () => {
    setResetting(true)
    const ok = await saveData()
    setResetting(false)
    if (ok) setResetOpen(false)
  }

  return (
    <div className="mx-auto max-w-[1000px] p-4 sm:p-5">
      <ViewHeader title="Pengaturan" desc="Profil toko, pajak, struk, dan data demo.">
        <Button className="h-9 bg-zinc-900 font-bold text-white hover:bg-zinc-700" disabled={saving} onClick={() => void save()}>
          {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="mr-1.5 h-4 w-4" aria-hidden="true" />}
          Simpan Semua
        </Button>
      </ViewHeader>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Profil toko */}
        <Card title="Profil Toko" desc="Tampil di header struk pembayaran.">
          <div className="space-y-3">
            <div>
              <Label htmlFor="s-nama">Nama toko</Label>
              <Input id="s-nama" className="mt-1" value={form.storeName ?? ''} onChange={(e) => setForm({ ...form, storeName: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="s-alamat">Alamat</Label>
              <Input id="s-alamat" className="mt-1" value={form.storeAddress ?? ''} onChange={(e) => setForm({ ...form, storeAddress: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="s-telp">Telepon</Label>
              <Input id="s-telp" className="mt-1 font-mono" value={form.storePhone ?? ''} onChange={(e) => setForm({ ...form, storePhone: e.target.value })} />
            </div>
          </div>
        </Card>

        {/* Pajak */}
        <Card title="Pajak (PPN / PB1)" desc="Pajak dihitung otomatis dari total setelah diskon.">
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-zinc-200 px-3.5 py-3">
              <div>
                <p className="text-sm font-semibold text-zinc-800">Aktifkan pajak</p>
                <p className="text-[11px] text-zinc-400">Ditampilkan terpisah di keranjang & struk</p>
              </div>
              <Switch
                checked={Boolean(form.taxEnabled)}
                onCheckedChange={(v) => setForm({ ...form, taxEnabled: v })}
                aria-label="Aktifkan pajak"
              />
            </div>
            <div>
              <Label htmlFor="s-pajak">Tarif pajak (%)</Label>
              <Input
                id="s-pajak"
                className="mt-1 w-32 text-right font-mono font-bold"
                value={String(form.taxRate ?? 0)}
                onChange={(e) => setForm({ ...form, taxRate: Number(e.target.value.replace(/[^0-9.]/g, '')) || 0 })}
                inputMode="decimal"
                disabled={!form.taxEnabled}
              />
            </div>
          </div>
        </Card>

        {/* Struk */}
        <Card title="Struk & Printer" desc="Lebar kertas thermal dan catatan kaki struk.">
          <div className="space-y-3">
            <div>
              <Label>Lebar kertas</Label>
              <Select value={form.paperWidth ?? '80'} onValueChange={(v) => setForm({ ...form, paperWidth: v })}>
                <SelectTrigger className="mt-1 w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="58">58 mm (mini)</SelectItem>
                  <SelectItem value="80">80 mm (standar)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="s-footer">Catatan kaki struk</Label>
              <Textarea
                id="s-footer"
                className="mt-1 min-h-16"
                value={form.receiptFooter ?? ''}
                onChange={(e) => setForm({ ...form, receiptFooter: e.target.value })}
              />
            </div>
            <Button variant="outline" className="border-zinc-300 font-semibold" onClick={testPrint}>
              <Printer className="mr-1.5 h-4 w-4" aria-hidden="true" /> Uji Cetak Struk
            </Button>
          </div>
        </Card>

        {/* Pintasan & info */}
        <Card title="Pintasan Keyboard" desc="Percepat operasional kasir sehari-hari.">
          <ul className="space-y-2 text-xs text-zinc-600">
            <li className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2">
              <span>Fokus pencarian / scan barcode</span>
              <Kbd>/</Kbd>
            </li>
            <li className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2">
              <span>Buka dialog pembayaran</span>
              <Kbd>F9</Kbd>
            </li>
            <li className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2">
              <span>Enter di pencarian = tambah via barcode/SKU</span>
              <Kbd>Enter</Kbd>
            </li>
          </ul>
          <div className="mt-4 rounded-lg border border-zinc-200 px-3 py-2.5 text-[11px] text-zinc-500">
            <p className="flex items-center gap-1.5 font-bold text-zinc-700"><Store className="h-3.5 w-3.5" aria-hidden="true" /> {serverInfo?.name ?? 'zPos Server'} v{serverInfo?.version}</p>
            <p className="mt-1 font-mono">{serverInfo?.address} · {serverInfo?.ip} · uptime sejak {serverInfo ? new Date(serverInfo.startedAt).toLocaleTimeString('id-ID') : '—'}</p>
          </div>
        </Card>

        {/* Zona berbahaya */}
        <Card title="Zona Berbahaya" desc="Hapus semua data & muat ulang data demo." className="border-rose-200 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50/60 px-4 py-3">
            <div>
              <p className="flex items-center gap-1.5 text-sm font-bold text-rose-800">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" /> Reset Data Demo
              </p>
              <p className="text-xs text-rose-600">
                Menghapus produk, transaksi, dan shift — lalu memuat ulang katalog & 30 hari data contoh.
              </p>
            </div>
            <Button variant="outline" className="shrink-0 border-rose-300 font-bold text-rose-700 hover:bg-rose-100" onClick={() => setResetOpen(true)}>
              <RotateCcw className="mr-1.5 h-4 w-4" aria-hidden="true" /> Reset Sekarang
            </Button>
          </div>
        </Card>
      </div>

      {/* Konfirmasi reset */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset data demo?</DialogTitle>
            <DialogDescription>
              Semua produk, transaksi, dan shift akan dihapus dan diganti data demo baru. Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setResetOpen(false)}>Batal</Button>
            <Button variant="destructive" disabled={resetting} onClick={() => void doReset()}>
              {resetting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />}
              Ya, Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ReceiptDialog
        sale={testSale}
        open={testSale !== null}
        onOpenChange={(o) => !o && setTestSale(null)}
      />
    </div>
  )
}
