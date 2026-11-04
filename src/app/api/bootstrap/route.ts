import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const now = new Date()
    const [products, categories, openShift, devices, setting, customers, promos, employees, outlets] = await Promise.all([
      db.product.findMany({
        include: { category: { select: { id: true, name: true } } },
        orderBy: { name: 'asc' },
      }),
      db.category.findMany({ orderBy: { sortOrder: 'asc' } }),
      db.shift.findFirst({ where: { status: 'open' }, orderBy: { openedAt: 'desc' } }),
      db.device.findMany({ orderBy: { name: 'asc' } }),
      db.setting.findUnique({ where: { id: 'main' } }),
      db.customer.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
      db.promo.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' } }),
      db.employee.findMany({ where: { isActive: true }, orderBy: { joinedAt: 'asc' } }),
      db.outlet.findMany({ orderBy: [{ isMain: 'desc' }, { name: 'asc' }] }),
    ])

    const startedAt = new Date(Date.now() - Math.round(process.uptime() * 1000)).toISOString()

    const { managerPinHash: _omit, ...safeSetting } = setting ?? {
      id: 'main', storeName: 'Kopi Nusantara', storeAddress: '', storePhone: '',
      taxEnabled: false, taxRate: 0, receiptFooter: '', paperWidth: '80', updatedAt: new Date(),
    }
    void _omit

    // Promo hanya yang masih dalam masa berlaku
    const validPromos = promos.filter(
      (p) => now >= p.startsAt && (!p.endsAt || now <= p.endsAt)
    )

    return NextResponse.json({
      products,
      categories,
      currentShift: openShift,
      devices,
      settings: safeSetting,
      customers,
      promos: validPromos,
      employees,
      outlets,
      serverInfo: {
        name: 'zPos Server',
        address: 'zpos.local:7788',
        ip: '192.168.1.10',
        version: '1.1.0',
        dbSizeKb: 512,
        startedAt,
      },
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Gagal memuat bootstrap' },
      { status: 500 }
    )
  }
}

// touch: reload graph
