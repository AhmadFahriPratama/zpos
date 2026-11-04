'use client'

import { useZPos } from '@/lib/store'
import { rupiah, methodLabel, orderTypeLabel, tanggalWaktu } from '@/lib/format'
import type { Sale, Settings } from '@/lib/zpos-types'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Printer, Plus } from 'lucide-react'

/** Struk termal — class .receipt-print dipakai CSS cetak */
export function ReceiptPaper({
  sale, settings,
}: {
  sale: Sale
  settings: Settings | null
}) {
  return (
    <div
      className="receipt-print mx-auto w-full max-w-[300px] bg-white px-4 py-5 font-mono text-[11px] leading-relaxed text-zinc-800"
      role="img"
      aria-label={`Struk ${sale.invoiceNo}`}
    >
      <div className="text-center">
        <p className="text-[13px] font-bold uppercase tracking-widest">{settings?.storeName ?? 'zPos'}</p>
        {settings?.storeAddress && <p className="text-[10px] text-zinc-500">{settings.storeAddress}</p>}
        {settings?.storePhone && <p className="text-[10px] text-zinc-500">Telp. {settings.storePhone}</p>}
      </div>

      <p className="my-2 border-t border-dashed border-zinc-300" />

      <div className="space-y-0.5 text-[10px]">
        <div className="flex justify-between"><span>No.</span><span className="font-bold">{sale.invoiceNo}</span></div>
        <div className="flex justify-between"><span>Tanggal</span><span>{tanggalWaktu(sale.createdAt)}</span></div>
        <div className="flex justify-between"><span>Kasir</span><span>{sale.cashierName}</span></div>
        <div className="flex justify-between"><span>Tipe</span><span>{orderTypeLabel(sale.orderType)}</span></div>
        {sale.shiftId && <div className="flex justify-between"><span>Shift</span><span>#{sale.shiftId.slice(-4).toUpperCase()}</span></div>}
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
              {it.discount > 0 && <span> −{it.discount.toLocaleString('id-ID')}</span>}
            </div>
          </li>
        ))}
      </ul>

      <p className="my-2 border-t border-dashed border-zinc-300" />

      <div className="space-y-0.5">
        <div className="flex justify-between"><span>Subtotal</span><span className="tabular-nums">{rupiah(sale.subtotal)}</span></div>
        {sale.discount > 0 && (
          <div className="flex justify-between"><span>Diskon item</span><span className="tabular-nums">−{rupiah(sale.discount)}</span></div>
        )}
        {sale.orderDiscount > 0 && (
          <div className="flex justify-between"><span>Diskon transaksi</span><span className="tabular-nums">−{rupiah(sale.orderDiscount)}</span></div>
        )}
        {sale.tax > 0 && (
          <div className="flex justify-between"><span>Pajak</span><span className="tabular-nums">{rupiah(sale.tax)}</span></div>
        )}
        <div className="flex justify-between border-t border-dashed border-zinc-300 pt-1 text-[13px] font-bold">
          <span>TOTAL</span><span className="tabular-nums">{rupiah(sale.total)}</span>
        </div>
        <div className="flex justify-between"><span>Bayar ({methodLabel(sale.method)})</span><span className="tabular-nums">{rupiah(sale.paidAmount)}</span></div>
        {sale.method === 'cash' && (
          <div className="flex justify-between"><span>Kembalian</span><span className="tabular-nums">{rupiah(sale.changeAmount)}</span></div>
        )}
      </div>

      {sale.note && (
        <>
          <p className="my-2 border-t border-dashed border-zinc-300" />
          <p className="text-[10px] italic text-zinc-500">Catatan: {sale.note}</p>
        </>
      )}

      <p className="my-2 border-t border-dashed border-zinc-300" />

      <p className="text-center text-[10px] text-zinc-500">{settings?.receiptFooter ?? 'Terima kasih!'}</p>
      <div
        className="mx-auto mt-2.5 h-8 w-44"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, #18181b 0px, #18181b 2px, transparent 2px, transparent 4px, #18181b 4px, #18181b 5px, transparent 5px, transparent 8px)',
        }}
        aria-hidden="true"
      />
      <p className="mt-1 text-center text-[9px] tracking-[0.3em] text-zinc-400">{sale.invoiceNo}</p>
      <p className="mt-2 text-center text-[9px] tracking-widest text-zinc-300">zPOS · SERVER LOKAL</p>
    </div>
  )
}

export function ReceiptDialog({
  sale, open, onOpenChange,
}: {
  sale: Sale | null
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const settings = useZPos((s) => s.settings)
  if (!sale) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />
            Transaksi Berhasil
          </DialogTitle>
          <DialogDescription>
            {sale.invoiceNo} · kasir {sale.cashierName}
            {sale.method === 'cash' && sale.changeAmount > 0 && (
              <> · kembalian <strong className="font-bold text-emerald-700">{rupiah(sale.changeAmount)}</strong></>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-zinc-200 shadow-inner">
          <ReceiptPaper sale={sale} settings={settings} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="border-zinc-300 font-semibold" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" aria-hidden="true" /> Cetak Struk
          </Button>
          <Button className="bg-zinc-900 font-bold text-white hover:bg-zinc-700" onClick={() => onOpenChange(false)}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" /> Transaksi Baru
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
