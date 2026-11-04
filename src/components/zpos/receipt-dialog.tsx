'use client'

import { toast } from 'sonner'
import { useZPos } from '@/lib/store'
import { rupiah, methodLabel } from '@/lib/format'
import type { Sale } from '@/lib/zpos-types'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Printer, Plus } from 'lucide-react'

export function ReceiptDialog({
  sale, open, onOpenChange,
}: {
  sale: Sale | null
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const setView = useZPos((s) => s.setView)
  if (!sale) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              ✓
            </span>
            Transaksi Berhasil
          </DialogTitle>
          <DialogDescription>
            {sale.invoiceNo} · kasir {sale.cashierName}
          </DialogDescription>
        </DialogHeader>

        {/* Struk termal */}
        <div
          className="mx-auto w-full max-w-[280px] border border-zinc-200 bg-white px-4 py-5 font-mono text-[11px] leading-relaxed text-zinc-800 shadow-inner"
          role="img"
          aria-label={`Struk ${sale.invoiceNo}`}
        >
          <div className="text-center">
            <p className="text-sm font-bold tracking-widest">TOKO MAJU JAYA</p>
            <p className="text-[10px] text-zinc-500">Jl. Merdeka No. 88, Jakarta</p>
            <p className="text-[10px] text-zinc-500">Telp. 021-555-0123</p>
          </div>
          <p className="my-2 border-t border-dashed border-zinc-300" />
          <div className="flex justify-between text-[10px]">
            <span>{sale.invoiceNo}</span>
            <span>{new Date(sale.createdAt).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span>Kasir: {sale.cashierName}</span>
            <span>{methodLabel(sale.method)}</span>
          </div>
          <p className="my-2 border-t border-dashed border-zinc-300" />
          <ul className="space-y-1.5">
            {sale.items.map((it) => (
              <li key={it.id}>
                <div className="flex justify-between gap-2">
                  <span className="truncate">{it.name}</span>
                  <span className="shrink-0 tabular-nums">{it.subtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="text-[10px] text-zinc-400">
                  {it.qty} x {it.price.toLocaleString('id-ID')}
                  {it.discount > 0 && <span className="text-rose-500"> −{it.discount.toLocaleString('id-ID')}</span>}
                </div>
              </li>
            ))}
          </ul>
          <p className="my-2 border-t border-dashed border-zinc-300" />
          <div className="space-y-0.5">
            <div className="flex justify-between"><span>Subtotal</span><span className="tabular-nums">{rupiah(sale.subtotal)}</span></div>
            {sale.discount > 0 && (
              <div className="flex justify-between"><span>Diskon</span><span className="tabular-nums">−{rupiah(sale.discount)}</span></div>
            )}
            <div className="flex justify-between text-sm font-bold"><span>TOTAL</span><span className="tabular-nums">{rupiah(sale.total)}</span></div>
            <div className="flex justify-between"><span>Bayar ({methodLabel(sale.method)})</span><span className="tabular-nums">{rupiah(sale.paidAmount)}</span></div>
            {sale.method === 'cash' && (
              <div className="flex justify-between"><span>Kembalian</span><span className="tabular-nums">{rupiah(sale.changeAmount)}</span></div>
            )}
          </div>
          <p className="my-2 border-t border-dashed border-zinc-300" />
          <p className="text-center text-[10px] text-zinc-500">
            Terima kasih telah berbelanja 🙏<br />Barang yang sudah dibeli tidak dapat ditukar
          </p>
          <p className="mt-2 text-center text-[9px] tracking-widest text-zinc-300">zPOS · struk digital</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="border-zinc-300"
            onClick={() => toast.success('Struk dikirim ke Printer-Kasir-80mm', {
              description: 'ESC/POS · LAN 192.168.1.50:9100',
            })}
          >
            <Printer className="mr-2 h-4 w-4" aria-hidden="true" /> Cetak
          </Button>
          <Button
            className="bg-zinc-900 text-white hover:bg-zinc-800"
            onClick={() => {
              onOpenChange(false)
              setView('kasir')
            }}
          >
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" /> Transaksi Baru
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
