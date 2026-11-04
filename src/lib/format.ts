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

export function methodLabel(m: string): string {
  switch (m) {
    case 'cash': return 'Tunai'
    case 'qris': return 'QRIS'
    case 'transfer': return 'Transfer'
    case 'card': return 'Kartu Debit'
    default: return m
  }
}
