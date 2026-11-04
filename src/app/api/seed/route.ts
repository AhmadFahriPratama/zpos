import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { seedDemo } from '@/lib/seed'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

/** Reset & seed ulang data demo (dipakai dari layar Pengaturan) */
export async function POST() {
  try {
    const result = await seedDemo()
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Gagal reset data demo' },
      { status: 500 }
    )
  }
}
