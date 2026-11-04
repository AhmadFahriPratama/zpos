import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface Body {
  id?: string
  name?: string
  phone?: string
  email?: string
  note?: string
  isActive?: boolean
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = (searchParams.get('q') || '').trim()
    const customers = await db.customer.findMany({
      where: q
        ? { OR: [{ name: { contains: q } }, { code: { contains: q } }, { phone: { contains: q } }] }
        : undefined,
      orderBy: { createdAt: 'desc' },
      take: 200,
    })
    return NextResponse.json(customers)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Gagal memuat pelanggan' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const b = (await req.json()) as Body
    const name = (b.name || '').trim()
    if (!name) return NextResponse.json({ error: 'Nama pelanggan wajib diisi' }, { status: 400 })

    // Kode member otomatis MBR-XXXX
    const last = await db.customer.findFirst({ orderBy: { createdAt: 'desc' }, select: { code: true } })
    const lastNum = last ? Number(last.code.replace('MBR-', '')) || 0 : 0
    const code = `MBR-${String(lastNum + 1).padStart(4, '0')}`

    const customer = await db.customer.create({
      data: {
        code, name,
        phone: (b.phone || '').trim(),
        email: (b.email || '').trim(),
        note: (b.note || '').trim() || null,
      },
    })
    return NextResponse.json(customer, { status: 201 })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Gagal menambah pelanggan' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  try {
    const b = (await req.json()) as Body
    if (!b.id) return NextResponse.json({ error: 'id wajib' }, { status: 400 })
    const customer = await db.customer.update({
      where: { id: b.id },
      data: {
        ...(b.name !== undefined ? { name: b.name.trim() } : {}),
        ...(b.phone !== undefined ? { phone: b.phone.trim() } : {}),
        ...(b.email !== undefined ? { email: b.email.trim() } : {}),
        ...(b.note !== undefined ? { note: (b.note || '').trim() || null } : {}),
        ...(b.isActive !== undefined ? { isActive: b.isActive } : {}),
      },
    })
    return NextResponse.json(customer)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Gagal memperbarui pelanggan' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id wajib' }, { status: 400 })
    await db.customer.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Gagal menghapus pelanggan' },
      { status: 500 }
    )
  }
}
