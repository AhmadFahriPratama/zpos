import { Section, SectionHeader } from './section'
import { Badge } from '@/components/ui/badge'
import { MousePointerClick, Printer, Usb, Wrench } from 'lucide-react'

const HARDWARE = [
  {
    device: 'Printer thermal 58/80 mm',
    conn: 'USB / LAN / Bluetooth',
    proto: 'ESC/POS (node-escpos, escpos-buffer)',
    note: 'Rekomendasi model LAN (mis. Xprinter XP-N160II) — bisa dipakai bareng semua client',
    highlight: true,
  },
  {
    device: 'Barcode scanner',
    conn: 'USB (HID) / Bluetooth',
    proto: 'Emulasi keyboard — plug & play',
    note: 'Tanpa driver khusus, langsung dikenali aplikasi',
    highlight: false,
  },
  {
    device: 'Cash drawer',
    conn: 'RJ11 ke printer',
    proto: 'Perintah kick ESC/POS',
    note: 'Terbuka otomatis saat pembayaran tunai',
    highlight: false,
  },
  {
    device: 'Customer display',
    conn: 'Layar kedua / tablet',
    proto: 'Browser (URL dari server)',
    note: 'Menampilkan total + QRIS saat proses bayar',
    highlight: false,
  },
  {
    device: 'Timbangan digital',
    conn: 'Serial USB',
    proto: 'serialport',
    note: 'Fase 2 — untuk toko buah, daging, sembako',
    highlight: false,
  },
  {
    device: 'Label printer (barcode)',
    conn: 'USB',
    proto: 'ZPL / TSPL / ESC/POS',
    note: 'Cetak label harga & barcode rak',
    highlight: false,
  },
]

export function Hardware() {
  return (
    <Section id="hardware" tint>
      <SectionHeader
        icon={<Printer className="h-4 w-4" />}
        eyebrow="Hardware"
        title="Periferal & Kompatibilitas"
        description="Semua driver hidup di server (Node.js) — client cukup memerintahkan cetak via API. Printer LAN bisa dipakai bersama oleh semua kasir sekaligus."
      />

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/60">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Wrench className="h-3.5 w-3.5" aria-hidden="true" /> Periferal
                </span>
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Koneksi
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Protokol / Library
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Catatan
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {HARDWARE.map((h) => (
              <tr key={h.device} className="align-top">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{h.device}</span>
                    {h.highlight && <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">Prioritas</Badge>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                    <Usb className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                    {h.conn}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400">{h.proto}</td>
                <td className="max-w-xs px-4 py-3 text-xs leading-relaxed text-zinc-500 dark:text-zinc-500">
                  {h.note}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-xl border border-teal-200 bg-teal-50 p-4 dark:border-teal-900 dark:bg-teal-950/40">
        <MousePointerClick className="mt-0.5 h-5 w-5 shrink-0 text-teal-700 dark:text-teal-400" aria-hidden="true" />
        <p className="text-sm leading-relaxed text-teal-900 dark:text-teal-200">
          <strong>Prinsip anti vendor-lock:</strong> semua perangkat memakai standar industri
          (ESC/POS, HID, ZPL) — pemilik toko bebas beli printer/scanner merek apa pun, tanpa harus
          membeli aksesori resmi zPos.
        </p>
      </div>
    </Section>
  )
}
