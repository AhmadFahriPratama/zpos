import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const ROLES = ['owner', 'manager', 'kasir', 'gudang']

function hashPin(pin: string): string {
  return createHash('sha256').update(`zpos:${pin}`).digest('hex')
}

interface Body {
  id?: string
  name?: string
  role?: string
  phone?: string
  pin?: string
  isActive?: boolean
}

export async function GET() {
  try {
    const employees = await db.employee.findMany({ orderBy: { joinedAt: 'asc' } })
    return NextResponse.json(employees.map((e) => ({ ...e, pinHash: undefined })))
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Gagal memuat karyawan' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const b = (await req.json()) as Body
    const name = (b.name || '').trim()
    if (!name) return NextResponse.json({ error: 'Nama karyawan wajib diisi' }, { status: 400 })
    if (!ROLES.includes(b.role || '')) return NextResponse.json({ error: 'Peran tidak valid' }, { status: 400 })
    const pin = (b.pin || '').trim()
    if (!/^\d{6}$/.test(pin))
      return NextResponse.json({ error: 'PIN harus 6 digit angka' }, { status: 400 })
    const employee = await db.employee.create({
      data: { name, role: b.role!, phone: (b.phone || '').trim(), pinHash: hashPin(pin) },
    })
    return NextResponse.json({ ...employee, pinHash: undefined }, { status: 201 })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Gagal menambah karyawan' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  try {
    const b = (await req.json()) as Body
    if (!b.id) return NextResponse.json({ error: 'id wajib' }, { status: 400 })
    const pin = (b.pin || '').trim()
    if (pin && !/^\d{6}$/.test(pin))
      return NextResponse.json({ error: 'PIN harus 6 digit angka' }, { status: 400 })
    const employee = await db.employee.update({
      where: { id: b.id },
      data: {
        ...(b.name !== undefined ? { name: b.name.trim() } : {}),
        ...(b.role !== undefined && ROLES.includes(b.role) ? { role: b.role } : {}),
        ...(b.phone !== undefined ? { phone: b.phone.trim() } : {}),
        ...(pin ? { pinHash: hashPin(pin) } : {}),
        ...(b.isActive !== undefined ? { isActive: b.isActive } : {}),
      },
    })
    return NextResponse.json({ ...employee, pinHash: undefined })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Gagal memperbarui karyawan' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id wajib' }, { status: 400 })
    await db.employee.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Gagal menghapus karyawan' },
      { status: 500 }
    )
  }
}
