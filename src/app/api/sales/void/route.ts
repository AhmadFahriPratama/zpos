import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/** Batalkan transaksi — butuh PIN manajer */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { saleId?: string; pin?: string; reason?: string }
    if (!body.saleId) return NextResponse.json({ error: 'saleId wajib' }, { status: 400 })
    const reason = (body.reason || '').trim().slice(0, 200)
    if (reason.length < 3)
      return NextResponse.json({ error: 'Alasan pembatalan wajib diisi (min. 3 karakter)' }, { status: 400 })

    const setting = await db.setting.findUnique({ where: { id: 'main' } })
    const hashed = createHash('sha256').update(`zpos:${body.pin ?? ''}`).digest('hex')
    if (!setting || setting.managerPinHash !== hashed)
      return NextResponse.json({ error: 'PIN manajer salah' }, { status: 403 })

    const sale = await db.sale.findUnique({ where: { id: body.saleId }, include: { items: true } })
    if (!sale) return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 })
    if (sale.status !== 'paid')
      return NextResponse.json({ error: 'Transaksi sudah dibatalkan sebelumnya' }, { status: 409 })

    const updated = await db.$transaction(async (tx) => {
      // Kembalikan stok
      for (const it of sale.items) {
        if (!it.productId) continue
        await tx.product.update({ where: { id: it.productId }, data: { stock: { increment: it.qty } } })
        await tx.stockMove.create({
          data: { productId: it.productId, type: 'return', qty: it.qty, refId: sale.id, note: `Void ${sale.invoiceNo}` },
        })
      }

      // Rollback agregat member bila transaksi terkait pelanggan
      if (sale.customerId) {
        const cust = await tx.customer.findUnique({ where: { id: sale.customerId } })
        if (cust) {
          const spend = Math.max(0, cust.totalSpend - sale.total)
          await tx.customer.update({
            where: { id: cust.id },
            data: {
              totalSpend: spend,
              visitCount: { decrement: 1 },
              points: { decrement: Math.floor(sale.total / 10000) },
              tier: spend >= 1_000_000 ? 'gold' : spend >= 400_000 ? 'silver' : 'regular',
            },
          })
        }
      }

      return tx.sale.update({
        where: { id: sale.id },
        data: { status: 'void', voidReason: reason, voidedAt: new Date() },
        include: { items: true },
      })
    })

    return NextResponse.json(updated)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Gagal membatalkan transaksi' },
      { status: 500 }
    )
  }
}
