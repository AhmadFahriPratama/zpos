import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const setting = await db.setting.findUnique({ where: { id: 'main' } })
    if (!setting) return NextResponse.json({ error: 'Pengaturan belum diinisialisasi' }, { status: 404 })
    // Jangan pernah kirim hash PIN ke client
    const { managerPinHash: _omit, ...safe } = setting
    void _omit
    return NextResponse.json(safe)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Gagal memuat pengaturan' },
      { status: 500 }
    )
  }
}

interface SettingBody {
  storeName?: string
  storeAddress?: string
  storePhone?: string
  taxEnabled?: boolean
  taxRate?: number
  receiptFooter?: string
  paperWidth?: string
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as SettingBody
    const data: SettingBody = {}
    if (body.storeName !== undefined) data.storeName = String(body.storeName).trim().slice(0, 60) || 'Toko Saya'
    if (body.storeAddress !== undefined) data.storeAddress = String(body.storeAddress).trim().slice(0, 120)
    if (body.storePhone !== undefined) data.storePhone = String(body.storePhone).trim().slice(0, 30)
    if (body.taxEnabled !== undefined) data.taxEnabled = Boolean(body.taxEnabled)
    if (body.taxRate !== undefined) data.taxRate = Math.min(50, Math.max(0, Number(body.taxRate) || 0))
    if (body.receiptFooter !== undefined) data.receiptFooter = String(body.receiptFooter).slice(0, 200)
    if (body.paperWidth !== undefined) data.paperWidth = body.paperWidth === '58' ? '58' : '80'

    const updated = await db.setting.update({ where: { id: 'main' }, data })
    const { managerPinHash: _omit, ...safe } = updated
    void _omit
    return NextResponse.json(safe)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Gagal menyimpan pengaturan' },
      { status: 500 }
    )
  }
}
