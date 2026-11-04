export function rupiah(n: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(n))
}

export function angka(n: number): string {
  return new Intl.NumberFormat('id-ID').format(n)
}

export function tanggalWaktu(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return d.toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function jamWaktu(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

export function tanggalPendek(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return d.toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short' })
}

/** Durasi ringkas: "2 j 15 m" */
export function durasi(iso: string | Date): string {
  const ms = Date.now() - (typeof iso === 'string' ? new Date(iso) : iso).getTime()
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  if (h <= 0 && m <= 0) return 'baru saja'
  if (h <= 0) return `${m} mnt`
  return `${h} j ${m} mnt`
}

export function methodLabel(m: string): string {
  switch (m) {
    case 'cash': return 'Tunai'
    case 'qris': return 'QRIS'
    case 'transfer': return 'Transfer'
    case 'card': return 'Kartu Debit'
    default: return m
  }
}

export function orderTypeLabel(t: string): string {
  return t === 'dinein' ? 'Makan di Tempat' : 'Bawa Pulang'
}
