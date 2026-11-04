import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface Body {
  id?: string
  name?: string
  address?: string
  phone?: string
  isMain?: boolean
  isActive?: boolean
}

export async function GET() {
  try {
    const outlets = await db.outlet.findMany({ orderBy: [{ isMain: 'desc' }, { name: 'asc' }] })
    return NextResponse.json(outlets)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Gagal memuat outlet' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const b = (await req.json()) as Body
    const name = (b.name || '').trim()
    if (!name) return NextResponse.json({ error: 'Nama outlet wajib diisi' }, { status: 400 })
    const outlet = await db.$transaction(async (tx) => {
      if (b.isMain) await tx.outlet.updateMany({ data: { isMain: false } })
      return tx.outlet.create({
        data: {
          name, address: (b.address || '').trim(), phone: (b.phone || '').trim(),
          isMain: b.isMain ?? false,
        },
      })
    })
    return NextResponse.json(outlet, { status: 201 })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Gagal menambah outlet' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  try {
    const b = (await req.json()) as Body
    if (!b.id) return NextResponse.json({ error: 'id wajib' }, { status: 400 })
    const outlet = await db.$transaction(async (tx) => {
      if (b.isMain) {
        await tx.outlet.updateMany({ data: { isMain: false } })
        await tx.outlet.update({ where: { id: b.id }, data: { isMain: true, isActive: true } })
      }
      return tx.outlet.update({
        where: { id: b.id },
        data: {
          ...(b.name !== undefined ? { name: b.name.trim() } : {}),
          ...(b.address !== undefined ? { address: b.address.trim() } : {}),
          ...(b.phone !== undefined ? { phone: b.phone.trim() } : {}),
          ...(b.isMain !== undefined && !b.isMain ? { isMain: false } : {}),
          ...(b.isActive !== undefined ? { isActive: b.isActive } : {}),
        },
      })
    })
    return NextResponse.json(outlet)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Gagal memperbarui outlet' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id wajib' }, { status: 400 })
    const outlet = await db.outlet.findUnique({ where: { id } })
    if (!outlet) return NextResponse.json({ error: 'Outlet tidak ditemukan' }, { status: 404 })
    if (outlet.isMain)
      return NextResponse.json({ error: 'Outlet utama tidak dapat dihapus' }, { status: 409 })
    await db.outlet.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Gagal menghapus outlet' },
      { status: 500 }
    )
  }
}
