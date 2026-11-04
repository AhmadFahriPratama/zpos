import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface Body {
  id?: string
  name?: string
  contact?: string
  phone?: string
  email?: string
  address?: string
  isActive?: boolean
}

export async function GET() {
  try {
    const suppliers = await db.supplier.findMany({
      include: { _count: { select: { purchases: true } } },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(suppliers)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Gagal memuat supplier' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const b = (await req.json()) as Body
    const name = (b.name || '').trim()
    if (!name) return NextResponse.json({ error: 'Nama supplier wajib diisi' }, { status: 400 })
    const supplier = await db.supplier.create({
      data: {
        name,
        contact: (b.contact || '').trim(),
        phone: (b.phone || '').trim(),
        email: (b.email || '').trim(),
        address: (b.address || '').trim(),
      },
    })
    return NextResponse.json(supplier, { status: 201 })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Gagal membuat supplier' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  try {
    const b = (await req.json()) as Body
    if (!b.id) return NextResponse.json({ error: 'id wajib' }, { status: 400 })
    const supplier = await db.supplier.update({
      where: { id: b.id },
      data: {
        ...(b.name !== undefined ? { name: b.name.trim() } : {}),
        ...(b.contact !== undefined ? { contact: b.contact.trim() } : {}),
        ...(b.phone !== undefined ? { phone: b.phone.trim() } : {}),
        ...(b.email !== undefined ? { email: b.email.trim() } : {}),
        ...(b.address !== undefined ? { address: b.address.trim() } : {}),
        ...(b.isActive !== undefined ? { isActive: b.isActive } : {}),
      },
    })
    return NextResponse.json(supplier)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Gagal memperbarui supplier' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id wajib' }, { status: 400 })
    const count = await db.purchase.count({ where: { supplierId: id } })
    if (count > 0)
      return NextResponse.json(
        { error: `Supplier masih memiliki ${count} pembelian — nonaktifkan saja.` },
        { status: 409 }
      )
    await db.supplier.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Gagal menghapus supplier' },
      { status: 500 }
    )
  }
}
