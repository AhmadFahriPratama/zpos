import { Section, SectionHeader } from './section'
import { Badge } from '@/components/ui/badge'
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CircleDot,
  HardDrive,
  MonitorSmartphone,
  Printer,
  Settings,
  Users,
} from 'lucide-react'

const TABS = [
  { icon: Activity, name: 'Ringkasan', desc: 'Penjualan hari ini, grafik per jam, transaksi aktif, device online' },
  { icon: MonitorSmartphone, name: 'Perangkat', desc: 'Daftar device: platform, versi app, last seen, status, blokir/pasangkan ulang' },
  { icon: Users, name: 'Kasir & Shift', desc: 'Shift terbuka: siapa, modal awal, penjualan, selisih kas realtime' },
  { icon: AlertTriangle, name: 'Stok', desc: 'Alert minimum, item paling cepat habis, opname terakhir' },
  { icon: Printer, name: 'Printer', desc: 'Status printer LAN (online, kertas habis) + tes cetak' },
  { icon: HardDrive, name: 'Backup', desc: 'Jadwal, snapshot (tanggal, ukuran, checksum), restore 1 klik, export flashdisk' },
  { icon: Users, name: 'Pengguna', desc: 'Kelola user, PIN, role, izin' },
  { icon: Settings, name: 'Pengaturan', desc: 'Toko, pajak, struk, jaringan (port, mDNS), pembaruan' },
]

const MOCK_DEVICES = [
  { name: 'Kasir-01', platform: 'Windows · Tauri', status: 'online', last: 'baru saja' },
  { name: 'Kasir-02', platform: 'macOS · Tauri', status: 'online', last: '4 detik lalu' },
  { name: 'Waiter-iPad', platform: 'iOS · Expo', status: 'online', last: '12 detik lalu' },
  { name: 'Tablet-Kasir', platform: 'Android · Expo', status: 'offline', last: '2 jam lalu' },
]

const MOCK_ALERTS = [
  { text: 'Stok "Kopi Susu 250ml" di bawah minimum (4/20)', type: 'warning' },
  { text: 'Printer "Dapur-80mm" tidak merespons ping', type: 'danger' },
  { text: 'Backup otomatis berhasil — 14 MB · checksum OK', type: 'ok' },
]

export function Monitoring() {
  return (
    <Section id="monitoring" tint>
      <SectionHeader
        icon={<Activity className="h-4 w-4" />}
        eyebrow="Monitoring Server"
        title="Aplikasi Server (.exe) — Pusat Kendali"
        description="zPos Server bukan cuma API: dia aplikasi desktop lengkap dengan dashboard monitoring, system tray, watchdog auto-restart, dan auto-update. Ini cuplikan tampilannya."
      />

      {/* ===== Mockup dashboard ===== */}
      <div className="overflow-hidden rounded-2xl border border-zinc-300 bg-zinc-100 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
        {/* Title bar */}
        <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-rose-400" aria-hidden="true" />
            <span className="h-3 w-3 rounded-full bg-amber-400" aria-hidden="true" />
            <span className="h-3 w-3 rounded-full bg-emerald-400" aria-hidden="true" />
            <span className="ml-3 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              zPos Server Monitor — Toko Maju Jaya
            </span>
          </div>
          <Badge className="hidden bg-emerald-100 text-emerald-800 hover:bg-emerald-100 sm:inline-flex dark:bg-emerald-950 dark:text-emerald-300">
            <CircleDot className="mr-1 h-3 w-3" aria-hidden="true" /> Server Online · 192.168.1.10
          </Badge>
        </div>

        <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-3">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 lg:col-span-1">
            {[
              { label: 'Penjualan Hari Ini', value: 'Rp 4.285.000', sub: '+12% vs kemarin', tone: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Transaksi', value: '87', sub: 'rata-rata Rp 49.253' },
              { label: 'Perangkat Online', value: '3 / 4', sub: '1 offline' },
              { label: 'Shift Aktif', value: '2', sub: 'Sari & Budi' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-zinc-200 bg-white p-3.5 dark:border-zinc-800 dark:bg-zinc-950">
                <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{s.label}</p>
                <p className={`mt-1 text-lg font-extrabold text-zinc-900 dark:text-white ${s.tone ?? ''}`}>{s.value}</p>
                <p className={`text-[10px] ${s.tone ?? 'text-zinc-400 dark:text-zinc-500'}`}>{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Devices */}
          <div className="rounded-xl border border-zinc-200 bg-white p-4 lg:col-span-2 dark:border-zinc-800 dark:bg-zinc-950">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Perangkat Terhubung
            </p>
            <div className="space-y-2">
              {MOCK_DEVICES.map((d) => (
                <div
                  key={d.name}
                  className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2.5 dark:bg-zinc-900"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`h-2 w-2 rounded-full ${d.status === 'online' ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{d.name}</p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-500">{d.platform}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500">{d.last}</span>
                </div>
              ))}
            </div>

            <p className="mt-4 mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Notifikasi Terkini
            </p>
            <div className="space-y-1.5">
              {MOCK_ALERTS.map((a) => (
                <p
                  key={a.text}
                  className="flex items-start gap-2 rounded-lg px-2 py-1.5 text-[11px] leading-relaxed"
                >
                  <span
                    className={
                      a.type === 'ok'
                        ? 'mt-0.5 text-emerald-600 dark:text-emerald-400'
                        : a.type === 'warning'
                          ? 'mt-0.5 text-amber-600 dark:text-amber-400'
                          : 'mt-0.5 text-rose-600 dark:text-rose-400'
                    }
                    aria-hidden="true"
                  >
                    ●
                  </span>
                  <span className="text-zinc-600 dark:text-zinc-400">{a.text}</span>
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        Ilustrasi mockup dashboard monitoring — dibangun di Fase 1
      </p>

      {/* ===== Tabs table ===== */}
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {TABS.map((t, i) => (
          <div
            key={t.name}
            className="flex gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              <t.icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                <span className="mr-1.5 font-mono text-xs text-zinc-400">{String(i + 1).padStart(2, '0')}</span>
                {t.name}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{t.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ===== System tray ===== */}
      <div className="mt-6 rounded-xl border border-zinc-200 bg-gradient-to-r from-zinc-50 to-white p-5 sm:p-6 dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950">
        <p className="mb-3 text-sm font-bold text-zinc-900 dark:text-zinc-100">System Tray (ikon di pojok taskbar)</p>
        <ul className="grid gap-2 text-xs leading-relaxed text-zinc-600 sm:grid-cols-2 dark:text-zinc-400">
          <li>• Tooltip status: <em>zPos Server — Online · 192.168.1.10 · 3 perangkat</em></li>
          <li>• Klik kanan: buka dashboard, buka port firewall, backup sekarang, keluar (wajib password owner)</li>
          <li>• Auto-start saat boot + watchdog: restart otomatis jika proses crash</li>
          <li>• Auto-update bertanda tangan (code signing) dengan rollback aman</li>
        </ul>
      </div>
    </Section>
  )
}
