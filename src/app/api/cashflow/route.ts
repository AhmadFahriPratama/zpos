import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

/** POST /api/cashflow — catat pengeluaran / pemasukan non-penjualan */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      type?: string
      category?: string
      amount?: number
      note?: string
      userName?: string
      date?: string
    }

    const type = body.type === 'income' ? 'income' : 'expense'
    const category = (body.category ?? '').trim()
    const amount = Number(body.amount)

    if (!category) {
      return NextResponse.json({ error: 'Kategori wajib diisi' }, { status: 400 })
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Nominal harus lebih dari 0' }, { status: 400 })
    }

    const createdAt = body.date ? new Date(`${body.date}T12:00:00`) : new Date()
    const safeDate = Number.isNaN(createdAt.getTime()) ? new Date() : createdAt

    const entry = await db.cashEntry.create({
      data: {
        type,
        category,
        amount: Math.round(amount),
        note: (body.note ?? '').trim() || null,
        userName: (body.userName ?? 'Kasir').trim() || 'Kasir',
        createdAt: safeDate,
      },
    })

    return NextResponse.json(entry, { status: 201 })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Gagal menyimpan catatan keuangan' },
      { status: 500 }
    )
  }
}

/** DELETE /api/cashflow?id=... — hapus catatan */
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Parameter id wajib' }, { status: 400 })
    }
    await db.cashEntry.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Gagal menghapus catatan' },
      { status: 500 }
    )
  }
}
