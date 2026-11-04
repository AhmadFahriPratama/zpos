import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface ProductBody {
  name?: string
  sku?: string
  barcode?: string | null
  unit?: string
  price?: number
  cost?: number
  stock?: number
  minStock?: number
  isActive?: boolean
  categoryId?: string | null
}

function clean(data: ProductBody): ProductBody {
  const out: ProductBody = {}
  if (data.name !== undefined) out.name = String(data.name).trim()
  if (data.sku !== undefined) out.sku = String(data.sku).trim() || undefined
  if (data.barcode !== undefined) out.barcode = data.barcode ? String(data.barcode).trim() : null
  if (data.unit !== undefined) out.unit = String(data.unit).trim() || 'pcs'
  if (data.price !== undefined) out.price = Math.max(0, Number(data.price) || 0)
  if (data.cost !== undefined) out.cost = Math.max(0, Number(data.cost) || 0)
  if (data.stock !== undefined) out.stock = Math.max(0, Math.round(Number(data.stock) || 0))
  if (data.minStock !== undefined) out.minStock = Math.max(0, Math.round(Number(data.minStock) || 0))
  if (data.isActive !== undefined) out.isActive = Boolean(data.isActive)
  if (data.categoryId !== undefined) out.categoryId = data.categoryId || null
  return out
}

export async function GET() {
  const products = await db.product.findMany({
    include: { category: { select: { id: true, name: true } } },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(products)
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ProductBody
    const data = clean(body)
    if (!data.name) return NextResponse.json({ error: 'Nama produk wajib diisi' }, { status: 400 })
    if (data.price === undefined || data.price <= 0)
      return NextResponse.json({ error: 'Harga jual harus lebih dari 0' }, { status: 400 })

    // SKU otomatis bila kosong
    if (!data.sku) {
      const count = await db.product.count()
      data.sku = `PRD-${String(count + 1).padStart(4, '0')}`
    }

    const existsSku = await db.product.findUnique({ where: { sku: data.sku } })
    if (existsSku) return NextResponse.json({ error: `SKU ${data.sku} sudah dipakai` }, { status: 400 })

    if (data.barcode) {
      const existsBarcode = await db.product.findUnique({ where: { barcode: data.barcode } })
      if (existsBarcode)
        return NextResponse.json({ error: `Barcode sudah dipakai produk ${existsBarcode.name}` }, { status: 400 })
    }

    const product = await db.product.create({
      data: {
        name: data.name!,
        sku: data.sku!,
        barcode: data.barcode ?? null,
        unit: data.unit ?? 'pcs',
        price: data.price ?? 0,
        cost: data.cost ?? 0,
        stock: data.stock ?? 0,
        minStock: data.minStock ?? 5,
        isActive: data.isActive ?? true,
        categoryId: data.categoryId ?? null,
      },
      include: { category: { select: { id: true, name: true } } },
    })

    if (data.stock && data.stock > 0) {
      await db.stockMove.create({
        data: { productId: product.id, type: 'in', qty: data.stock, note: 'Stok awal produk baru' },
      })
    }

    return NextResponse.json(product, { status: 201 })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Gagal membuat produk' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Parameter id wajib' }, { status: 400 })

    const body = (await req.json()) as ProductBody
    const data = clean(body)

    if (data.barcode) {
      const dup = await db.product.findFirst({ where: { barcode: data.barcode, NOT: { id } } })
      if (dup) return NextResponse.json({ error: `Barcode dipakai produk ${dup.name}` }, { status: 400 })
    }
    if (data.sku) {
      const dup = await db.product.findFirst({ where: { sku: data.sku, NOT: { id } } })
      if (dup) return NextResponse.json({ error: `SKU dipakai produk ${dup.name}` }, { status: 400 })
    }

    const product = await db.product.update({
      where: { id },
      data,
      include: { category: { select: { id: true, name: true } } },
    })
    return NextResponse.json(product)
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Gagal memperbarui produk' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Parameter id wajib' }, { status: 400 })

    const saleCount = await db.saleItem.count({ where: { productId: id } })
    if (saleCount > 0) {
      // Sudah punya riwayat transaksi → nonaktifkan saja (jaga integritas laporan)
      await db.product.update({ where: { id }, data: { isActive: false } })
      return NextResponse.json({ softDeleted: true })
    }
    await db.product.delete({ where: { id } })
    return NextResponse.json({ softDeleted: false })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Gagal menghapus produk' },
      { status: 500 }
    )
  }
}
