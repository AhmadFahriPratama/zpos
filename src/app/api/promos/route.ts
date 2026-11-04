import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface Body {
  id?: string
  code?: string
  name?: string
  type?: string
  value?: number
  minPurchase?: number
  startsAt?: string
  endsAt?: string | null
  isActive?: boolean
}

export async function GET() {
  try {
    const promos = await db.promo.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(promos)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Gagal memuat promo' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const b = (await req.json()) as Body
    const code = (b.code || '').trim().toUpperCase()
    const name = (b.name || '').trim()
    if (!code || !name) return NextResponse.json({ error: 'Kode & nama promo wajib diisi' }, { status: 400 })
    if (!['percent', 'fixed'].includes(b.type || ''))
      return NextResponse.json({ error: 'Jenis promo tidak valid' }, { status: 400 })
    if (b.type === 'percent' && ((b.value ?? 0) <= 0 || (b.value ?? 0) > 100))
      return NextResponse.json({ error: 'Persentase harus 1–100' }, { status: 400 })
    if (b.type === 'fixed' && (b.value ?? 0) <= 0)
      return NextResponse.json({ error: 'Nominal potongan harus > 0' }, { status: 400 })

    const promo = await db.promo.create({
      data: {
        code, name, type: b.type!, value: Math.max(0, Number(b.value) || 0),
        minPurchase: Math.max(0, Number(b.minPurchase) || 0),
        startsAt: b.startsAt ? new Date(b.startsAt) : new Date(),
        endsAt: b.endsAt ? new Date(b.endsAt) : null,
      },
    })
    return NextResponse.json(promo, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error && e.message.includes('Unique')
      ? 'Kode promo sudah dipakai' : 'Gagal menambah promo'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const b = (await req.json()) as Body
    if (!b.id) return NextResponse.json({ error: 'id wajib' }, { status: 400 })
    const promo = await db.promo.update({
      where: { id: b.id },
      data: {
        ...(b.code !== undefined ? { code: b.code.trim().toUpperCase() } : {}),
        ...(b.name !== undefined ? { name: b.name.trim() } : {}),
        ...(b.type !== undefined && ['percent', 'fixed'].includes(b.type) ? { type: b.type } : {}),
        ...(b.value !== undefined ? { value: Math.max(0, Number(b.value) || 0) } : {}),
        ...(b.minPurchase !== undefined ? { minPurchase: Math.max(0, Number(b.minPurchase) || 0) } : {}),
        ...(b.startsAt ? { startsAt: new Date(b.startsAt) } : {}),
        ...(b.endsAt !== undefined ? { endsAt: b.endsAt ? new Date(b.endsAt) : null } : {}),
        ...(b.isActive !== undefined ? { isActive: b.isActive } : {}),
      },
    })
    return NextResponse.json(promo)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Gagal memperbarui promo' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id wajib' }, { status: 400 })
    await db.promo.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Gagal menghapus promo' },
      { status: 500 }
    )
  }
}
