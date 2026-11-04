import { Section, SectionHeader } from './section'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  FileCheck,
  Fingerprint,
  KeyRound,
  QrCode,
  ShieldCheck,
  UserCog,
} from 'lucide-react'

const LAYERS = [
  {
    icon: QrCode,
    title: 'Pairing Perangkat',
    desc: 'QR + PIN 6 digit sekali pakai. Device disimpan sebagai tokenHash dan bisa diblokir/dihapus kapan saja dari dashboard monitoring.',
  },
  {
    icon: KeyRound,
    title: 'Autentikasi',
    desc: 'JWT akses 15 menit + refresh 30 hari (rotasi). Kasir login PIN cepat; manager wajib PIN/password kuat untuk aksi sensitif.',
  },
  {
    icon: ShieldCheck,
    title: 'Transport Aman',
    desc: 'HTTPS self-signed + cert pinning di client. Alternatif LAN terpercaya: HTTP lokal + enkripsi level aplikasi.',
  },
  {
    icon: UserCog,
    title: 'RBAC 4 Peran',
    desc: 'Owner (semua akses) · Manager (laporan, void, stok) · Cashier (kasir & shift sendiri) · Warehouse (stok & pembelian).',
  },
  {
    icon: FileCheck,
    title: 'Anti-Fraud',
    desc: 'Void/refund wajib approval, invoice berurutan tanpa gap, laporan selisih kas per shift, audit log semua aksi sensitif.',
  },
  {
    icon: Fingerprint,
    title: 'Data & Backup',
    desc: 'SQLite WAL + SQLCipher opsional (F2). Backup harian jam 02.00 ke 2 lokasi dengan checksum + ZIP AES; uji restore bulanan.',
  },
]

const ROLES = [
  { role: 'Owner', perm: 'Semua akses + pengaturan server + kelola user', color: 'bg-emerald-600' },
  { role: 'Manager', perm: 'Laporan, void/refund, opname stok, pembelian', color: 'bg-teal-600' },
  { role: 'Cashier', perm: 'Transaksi, shift sendiri, lihat stok', color: 'bg-amber-500' },
  { role: 'Warehouse', perm: 'Stok masuk/keluar, PO supplier, opname', color: 'bg-rose-500' },
]

export function Security() {
  return (
    <Section id="keamanan">
      <SectionHeader
        icon={<ShieldCheck className="h-4 w-4" />}
        eyebrow="Keamanan"
        title="Berlapis, Tanpa Menghambat Kasir"
        description="Prinsip: rapat di sudut sensitif (uang, stok, data), longgar di sudut operasional. Kasir tetap cepat — sekali PIN dan langsung jualan."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LAYERS.map((l) => (
          <Card key={l.title} className="border-zinc-200 dark:border-zinc-800">
            <CardHeader className="pb-2">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                <l.icon className="h-4.5 w-4.5" aria-hidden="true" />
              </div>
              <CardTitle className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{l.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">{l.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Matriks Role & Izin</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ROLES.map((r) => (
            <div key={r.role} className="rounded-lg border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/60">
              <span className={`inline-block rounded-full ${r.color} px-2.5 py-0.5 text-[11px] font-bold text-white`}>
                {r.role}
              </span>
              <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">{r.perm}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
}
