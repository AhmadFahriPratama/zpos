# zPos — Master Plan / Perencanaan Lengkap

> Sistem Kasir (POS) Multi-Platform Offline-First Berbasis Jaringan Lokal
> Versi dokumen: 1.0 · Status: Draft Perencanaan

---

## 1. Visi & Tujuan Produk

**zPos** adalah aplikasi kasir generasi baru — pengembangan dari konsep iPos/Ketoko — dengan prinsip utama:

1. **Data milik pemilik toko** — server berjalan di PC/homeserver sendiri, bukan cloud pihak ketiga.
2. **Tanpa biaya langganan server** — seluruh transaksi mengalir di jaringan lokal (WiFi/LAN).
3. **Multi-platform penuh** — Windows, macOS, Android, iOS, dan browser.
4. **Offline-first** — internet mati pun kasir tetap jalan; QRIS dinamis opsional.
5. **Monitoring terpusat** — aplikasi server (.exe) memiliki dashboard monitoring, backup otomatis, dan manajemen perangkat.

### Target Pengguna
- Toko ritel / minimarket kecil-menengah (1–10 mesin kasir)
- Kafe, restoran, bakery (dengan varian & meja)
- Laundry, apotek, toko bangunan (butuh stok & supplier)
- Pemilik multi-outlet dalam satu bangunan / satu jaringan

---

## 2. Arsitektur Sistem

### 2.1 Gambaran Umum

```
┌──────────────────────────────────────────────────────────────┐
│                 SERVER UTAMA (PC / Homeserver)               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  zPos Server — aplikasi desktop (.exe / .dmg)          │  │
│  │                                                        │  │
│  │  • REST API        (Fastify, port 7788)                │  │
│  │  • WebSocket       (realtime event bus)                │  │
│  │  • Database        (SQLite + WAL mode)                 │  │
│  │  • Monitoring UI   (dashboard embedded)                │  │
│  │  • Backup Engine   (otomatis harian → folder/NAS)      │  │
│  │  • mDNS Discovery  (zpos.local — zero-config)          │  │
│  │  • System Tray     (status, auto-start, quick action)  │  │
│  └────────────────────────────────────────────────────────┘  │
└───────────────────────────┬──────────────────────────────────┘
                            │  WiFi / LAN (Router/Switch)
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼───────┐   ┌───────▼───────┐   ┌───────▼───────┐
│ Kasir Windows │   │  Kasir macOS  │   │ Tablet/HP     │
│ (Tauri app)   │   │  (Tauri app)  │   │ Android/iOS   │
│ + Printer USB │   │               │   │ (Expo app)    │
└───────────────┘   └───────────────┘   └───────────────┘
        │
┌───────▼────────┐
│ Periferal LAN  │   Printer thermal (IP 9100), scanner barcode,
│                │   cash drawer, customer display (browser)
└────────────────┘
```

### 2.2 Komponen Utama

| Komponen | Peran | Teknologi |
|---|---|---|
| **zPos Server** | Pusat data, auth, sinkronisasi, monitoring | Electron (shell) + Node.js/Fastify + Prisma + SQLite |
| **Kasir Desktop** | Aplikasi kasir Windows/Mac | Tauri 2 + React + Tailwind |
| **Kasir Mobile** | Aplikasi kasir/waiter Android/iOS | Expo (React Native) |
| **Web Client** | Akses laporan via browser LAN | React (dibagikan dengan desktop) |
| **Shared Packages** | Tipe, validasi, API client, printer | TypeScript library (monorepo) |

### 2.3 Alur Data Transaksi (Golden Path)

```
1. Kasir scan barcode → client minta harga dari cache lokal (instan)
2. Keranjang selesai → POST /api/sales → server validasi stok & harga
3. Server tulis transaksi (SQLite transaction, atomic) → kurangi stok
4. Server broadcast event WebSocket → semua device update (stok, laporan live)
5. Server kirim perintah cetak → printer thermal (LAN/USB)
6. Struk tercetak → shift & kas diperbarui
```

### 2.4 Strategi Konektivitas

| Skenario | Perilaku |
|---|---|
| Internet mati, LAN hidup | **Semua fitur tetap jalan** (QRIS dinamis butuh internet — fallback QRIS statis/tunai) |
| Server restart | Client auto-reconnect + refresh token |
| Server mati total (opsional, Fase 3) | Client desktop punya mode *survival*: simpan transaksi ke SQLite lokal, antre, sinkron saat server hidup (queue sync + resolusi konflik) |
| Perangkat baru | Scan QR pairing di layar server → masukkan PIN 6 digit → device terdaftar |

### 2.5 Penemuan Perangkat (Discovery)

- Server mengiklankan diri via **mDNS/Bonjour** dengan service `_zpos._tcp` → `zpos.local:7788`
- Client di jaringan yang sama otomatis menemukan server tanpa ketik IP
- Fallback manual: input IP + port, atau scan QR berisi `https://192.168.1.10:7788/pair?token=...`

---

## 3. Teknologi & Struktur Kode

### 3.1 Pilihan Teknologi (Rekomendasi)

**Server utama (.exe) — Opsi A direkomendasikan:**

| Opsi | Stack | Kelebihan | Kekurangan |
|---|---|---|---|
| **A ✅** | **Electron (tray) + Node.js + Fastify + Prisma + SQLite** | 1 codebase TS dengan client, ekosistem npm untuk printer/serial, packaging mudah (electron-builder) | Ukuran installer ~80–120 MB |
| B | Tauri 2 (Rust) + sidecar Node | Installer kecil (~15 MB) | Kompleksitas 2 runtime, serial/print lib Rust lebih jarang |
| C | .NET 8 self-contained | Native Windows, performa tinggi | Mac/iOS perlu skill terpisah, tidak berbagi tipe dengan client |

**Client Desktop:** Tauri 2 + React (webview OS, RAM rendah, installer ~10 MB).
**Client Mobile:** Expo SDK + React Native (OTA update via EAS, satu codebase untuk Android & iOS).
**Monorepo:** Turborepo + Bun workspaces + pnpm/bun.

### 3.2 Struktur Monorepo

```
zpos/
├─ apps/
│  ├─ server/            # zPos Server (Electron + Fastify + Prisma)
│  │  ├─ src/main/       # proses utama Electron: tray, autostart, updater
│  │  ├─ src/api/        # REST + WebSocket (Fastify, socket.io)
│  │  ├─ src/modules/    # sales, inventory, shifts, auth, backup, printing
│  │  └─ src/monitor-ui/ # dashboard monitoring (dibundle ke jendela Electron)
│  ├─ kasir-desktop/     # Tauri 2 + React
│  ├─ kasir-mobile/      # Expo (React Native)
│  └─ web-admin/         # laporan via browser (opsional)
├─ packages/
│  ├─ shared-types/      # zod schemas + TypeScript types (sumber kebenaran API)
│  ├─ api-client/        # SDK ter-tipe untuk semua client
│  ├─ ui/                # komponen React bersama (Tailwind)
│  ├─ escpos/            # driver printer ESC/POS (USB/LAN/BT)
│  └─ sync/              # protokol antrean & resolusi konflik
└─ docs/                 # dokumen ini, ADR, skema API
```

### 3.3 Prinsip Teknis
- **Satu sumber kebenaran skema API**: zod schema di `shared-types` → tipe TS + validasi runtime di server & client.
- **Migrasi path**: SQLite → PostgreSQL tetap mulus karena Prisma (untuk toko sangat besar / multi-outlet lintas gedung).
- **Realtime**: WebSocket event bus (`sale.created`, `stock.low`, `device.connected`).
- **Keamanan by design**: HTTPS self-signed + cert pinning, JWT akses 15 menit + refresh, pairing perangkat wajib.

---

## 4. Desain Database (Skema Inti)

> SQLite (WAL mode) di server utama. Semua tabel punya `id (cuid)`, `createdAt`, `updatedAt`.

### 4.1 Domain Produk & Inventori

```
Category    : id, name, sortOrder, parentId?
Product     : id, sku, barcode, name, categoryId, unit, priceRetail,
              priceWholesale?, taxRate, isActive, image?, trackStock
Variant     : id, productId, name, sku, barcode, price, attributes(JSON)
Stock       : id, productId, variantId?, outletId, qty, minQty, maxQty
StockMove   : id, productId, outletId, type(in|out|adjust|transfer|sale|purchase),
              qty, refType?, refId?, note, userId
Supplier    : id, name, phone, address, note
Purchase    : id, supplierId, outletId, status(draft|ordered|received),
              total, paid, userId, receivedAt
PurchaseItem: id, purchaseId, productId, qty, cost, subtotal
```

### 4.2 Domain Penjualan

```
Shift       : id, userId, outletId, openedAt, closedAt?, openingCash,
              closingCash?, expectedCash?, status(open|closed), note?
Sale        : id, invoiceNo, outletId, shiftId?, userId, customerId?,
              status(paid|void|refund), subtotal, discountTotal, taxTotal,
              total, paidAmount, changeAmount, method(cash|qris|card|transfer|multi),
              note?, deviceId, syncedAt
SaleItem    : id, saleId, productId, variantId?, name, qty, price,
              discount, subtotal, cost
Payment     : id, saleId, method, amount, ref?, paidAt
Customer    : id, name, phone, email?, points, memberSince, note?
Promo       : id, name, type(percent|amount|bogo|member), value,
              scope(all|category|product), refId?, activeFrom, activeTo, isActive
```

### 4.3 Domain Pengguna & Sistem

```
User        : id, name, pinHash, passwordHash?, role, isActive, lastSeenAt
Role        : id, name, permissions(JSON) — owner|manager|cashier|warehouse
Device      : id, name, platform(win|mac|android|ios|web), tokenHash,
              pairedAt, lastSeenAt, version, isBlocked
Outlet      : id, name, address, phone, receiptFooter, taxRate, isActive
Setting     : key, value(JSON) — pajak, struk, printer default, bahasa, dll
AuditLog    : id, userId, action, entity, entityId, diff(JSON), ip, at
SyncQueue   : id, deviceId, payload(JSON), status(pending|done|failed),
              attempts, createdAt, processedAt   ← untuk mode offline client
```

### 4.4 Relasi Kunci
- `Product 1—* Variant 1—* Stock` (per outlet)
- `Shift 1—* Sale *—1 User` (rekonsiliasi kas per shift)
- `Sale 1—* SaleItem 1—* Payment` (multi-metode bayar)
- Semua perubahan stok lewat `StockMove` (audit penuh, tidak pernah update qty langsung)

---

## 5. Fitur: dari MVP sampai v2

### 5.1 MVP — v1.0 (target rilis pertama)
**Kasir:**
- Katalog produk (grid/list) + pencarian + scan barcode (HID)
- Keranjang: qty, diskon item, catatan, hold/parkir order
- Bayar: tunai (hitung kembalian), QRIS statis, kartu (manual), transfer
- Cetak struk 58/80 mm (ESC/POS) + header/footer toko
- Shift kasir: buka/tutup, setoran, laporan X/Z
- Refund/void dengan izin manager

**Server & Monitoring:**
- Setup wizard: toko, outlet, pajak, user pertama
- CRUD produk/kategori + impor CSV
- Dashboard: penjualan hari ini, jumlah transaksi, item terlaris
- Manajemen user & PIN, perangkat terpasang (pairing QR)
- Backup otomatis harian (reten 30 hari) + restore 1 klik
- System tray: status server, IP, auto-start Windows/Mac

**Stok:**
- Stok real-time + alert stok minimum
- Penyesuaian stok (opname) dengan alasan
- Riwayat pergerakan stok (StockMove)

### 5.2 v1.x — Penguatan
- Multi-outlet (satu server, banyak laci/ruang)
- Pembelian & supplier (po → terima → stok masuk, harga pokok rata-rata bergerak)
- Pelanggan & poin loyalitas
- Promo: diskon %/nominal, member price, happy hour
- Laporan lanjutan: laba kotor, per kasir, per jam, ekspor Excel/CSV
- Laporan via browser (akses HP owner tanpa install app)
- QRIS dinamis (Midtrans/Xendit — butuh internet, opsional)
- Multi-bahasa & multi-mata uang

### 5.3 v2.0 — Lanjutan
- Mode offline penuh di client + sinkronisasi konflik (SyncQueue)
- Dapur display (KDS) untuk restoran + manajemen meja
- Reservasi & antrean
- Integrasi e-commerce/marketplace (Tokopedia/Shopee via partner API)
- Akuntansi dasar (jurnal) + ekspor ke Accurate/Jurnal
- Cloud relay opsional (monitoring dari luar jaringan, end-to-end encrypted)
- Kiosk self-order + customer display (layar kedua)
- Timbangan digital (serial) untuk toko buah/bahan

---

## 6. Hardware & Periferal

| Periferal | Koneksi | Protokol/Library | Catatan |
|---|---|---|---|
| Printer thermal 58/80 mm | USB / LAN / BT | ESC/POS (`node-escpos`, `escpos-buffer`) | Rekomendasi model LAN (mis. Xprinter XP-N160II) — bisa dipakai bareng semua client |
| Barcode scanner | USB (HID) / BT | Emulasi keyboard — plug & play | Tidak butuh driver khusus |
| Cash drawer | RJ11 ke printer | Perintah kick ESC/POS | Buka otomatis saat bayar tunai |
| Customer display | Layar kedua / tablet | Browser (URL dari server) | Menampilkan total + QRIS saat bayar |
| Timbangan | Serial USB | `serialport` | Fase 2, toko buah/daging |
| Label printer (barcode) | USB | ZPL/TSPL/ESC/POS | Cetak label harga |
| Kertas & drawer | — | — | Standar industri, tidak dikunci vendor |

**Prinsip:** semua driver hidup di **server** (Node.js), client cukup memerintahkan cetak via API → client desktop mobile tetap ringan; printer LAN dipakai bersama.

---

## 7. Keamanan

1. **Pairing perangkat**: QR + PIN 6 digit sekali pakai; device disimpan dengan `tokenHash`; bisa diblokir/dihapus dari monitoring.
2. **Auth**: JWT akses 15 menit + refresh token 30 hari (rotasi); login kasir pakai PIN cepat, login manager butuh password/PIN kuat.
3. **Transport**: HTTPS self-signed + **cert pinning** di client (desktop & mobile). Alternatif: plain HTTP di LAN terpercaya + payload terenripsi aplikasi.
4. **RBAC**: `owner` (semua), `manager` (laporan, void, stok), `cashier` (kasir & shift sendiri), `warehouse` (stok & pembelian).
5. **Anti-fraud**: void/refund butuh approval; laporan selisih kas per shift; audit log semua aksi sensitif; struk wajib (invoice berurutan tanpa gap).
6. **Data**: SQLite file mode WAL; enkripsi disk opsional (SQLCipher, Fase 2); backup terenkripsi ZIP+AES.
7. **Backup**: otomatis harian jam 02.00 → folder lokal + salinan ke flashdisk/NAS; uji restore rutin; penanda integritas (checksum).
8. **Update**: auto-update bertanda tangan (code signing), rollback aman.

---

## 8. Aplikasi Server (.exe) — Detail Monitoring

**Jendela & fitur utama (embedded web UI di Electron):**

| Tab | Isi |
|---|---|
| **Ringkasan** | Penjualan hari ini (kartu besar), grafik per jam, transaksi aktif, device online |
| **Perangkat** | Daftar device: nama, platform, versi app, last seen, status (hijau/merah), blokir/pasangkan ulang |
| **Kasir & Shift** | Shift terbuka: siapa, modal awal, penjualan, selisih kas realtime |
| **Stok** | Alert stok minimum, opname terakhir, item paling cepat habis |
| **Printer & Periferal** | Status printer LAN (online/offline, kertas habis), tes cetak |
| **Backup** | Jadwal, lokasi, daftar snapshot (tanggal, ukuran, checksum), restore 1 klik, export ke flashdisk |
| **Pengguna** | Kelola user, PIN, role, izin |
| **Pengaturan** | Toko, pajak, struk, bahasa, jaringan (port, mDNS), pembaruan |
| **Log** | Audit log + error log terfilter |

**System tray (ikon tray Windows/Mac):**
- Tooltip status: `zPos Server — Online · 192.168.1.10 · 3 perangkat`
- Klik kanan: buka dashboard, buka port firewall, backup sekarang, mulai/stop, keluar (butuh password owner)
- Auto-start saat boot + watchdog (restart otomatis jika crash)
- Updater terpasang (nsis-web / Squirrel / Sparkle untuk Mac)

---

## 9. Roadmap & Timeline (asumsi 1–2 developer full-time)

| Fase | Durasi | Deliverable | Keluar (Exit Criteria) |
|---|---|---|---|
| **F0 — Fondasi** | 2–3 mgg | Monorepo, shared-types, CI, desain UI system, skema DB final, prototipe API | API CRUD produk jalan + review desain disetujui |
| **F1 — MVP** | 8–10 mgg | Server .exe (tray+wizard+backup), kasir desktop lengkap, struk, shift, laporan dasar | 1 toko pilot transaksi nyata 1 hari penuh tanpa kendala |
| **F2 — Mobile & Hardware** | 4–6 mgg | App Android (Expo), pairing QR, printer LAN, customer display, laporan browser | Kasir bisa pakai HP + printer jaringan stabil |
| **F3 — Multi-outlet & Pembelian** | 6–8 mgg | Multi-outlet, supplier/PO, loyalitas, promo, laporan lanjutan | 2 outlet jalan di 1 server, laba kotor akurat |
| **F4 — Ketangguhan** | 6–8 mgg | Offline sync client, enkripsi SQLCipher, cloud relay opsional, iOS release | Internet mati 1 hari → data tetap utuh, sinkron bersih |
| **F5 — Pertumbuhan** | berkelanjutan | KDS/meja, marketplace, akuntansi, kiosk | Umpan balik pasar |

**Total ke rilis komersial pertama (v1.0): ± 3–4 bulan.** Beta dengan 2–3 toko nyata mulai akhir F1.

### Milestone penting
- **M1 (akhir F1):** Pilot pertama — momen kebenaran desain.
- **M2 (akhir F2):** Rilis publik v1.0 (Windows + Android dulu; Mac & iOS menyusul).
- **M3 (akhir F4):** v2.0 — tahan offline penuh, siap skala.

---

## 10. Risiko & Mitigasi

| Risiko | Dampak | Prob. | Mitigasi |
|---|---|---|---|
| WiFi tak stabil → transaksi gagal | Tinggi | Sedang | Kasir utama pakai kabel LAN; retry + timeout; antre lokal; status koneksi jelas di UI |
| PC server mati lampu/dimatikan | Tinggi | Sedang | Auto-start + watchdog; UPS 600VA disarankan; mode survival client (F4) |
| Kehilangan data (disk rusak) | Tinggi | Rendah | Backup harian otomatis ke 2 lokasi + checksum; uji restore bulanan |
| Konflik stok saat offline ganda | Sedang | Sedang | Stok dipesan (reserve) di server; LWW + audit; opname menyusul |
| Printer/model tak kompatibel | Sedang | Sedang | Uji 5–8 printer umum Indonesia (Xprinter, Epson TM, Rongta); whitelist di docs |
| Driver USB di Mac (serial) | Rendah | Sedang | Utamakan printer LAN; serial via server Node `serialport` |
| App Store review (iOS) lambat | Rendah | Tinggi | Android dulu; iOS via TestFlight; mode LAN-only dijelaskan ke reviewer |
| Satu titik gagal (1 server) | Sedang | — | Roadmap: mode server kedua (hot standby) di F5; cukup untuk 1 lokasi |

---

## 11. Estimasi Biaya Teknis

| Item | Biaya |
|---|---|
| Lisensi software (semua open source: Electron, Tauri, Prisma, SQLite, Expo) | **Rp 0** |
| Code signing Windows (Optional, disarankan) | ~$70–200/tahun (Certum/SSL.com) |
| Apple Developer (untuk distribusi iOS/Mac via store) | $99/tahun |
| Google Play Console | $25 (sekali) |
| Perangkat uji (printer thermal LAN, scanner, drawer, tablet Android bekas) | ± Rp 1,5–3 juta |
| QRIS dinamis (opsional, Fase 1.x) | MDR per transaksi via penyedia (Midtrans/Xendit) |
| Server cloud relay (opsional, Fase 4) | VPS kecil ± $5/bulan |

---

## 12. Langkah Selanjutnya (Action Plan 2 Minggu Pertama)

1. **Konfirmasi lingkup MVP** (daftar fitur 5.1) & nama brand final.
2. Setup monorepo (Turborepo + Bun) + repo GitHub + CI lint/test.
3. Finalisasi skema DB (bagian 4) → generate Prisma → migrasi v0.
4. Desain API kontrak v1 (OpenAPI/zod) di `shared-types`.
5. Wireframe 4 layar inti kasir (katalog, keranjang, bayar, shift) + dashboard monitoring.
6. Beli perangkat uji: 1 printer thermal LAN, 1 scanner USB, 1 drawer, 1 tablet Android.
7. Prototipe end-to-end: CRUD produk → transaksi sederhana → cetak struk (2 minggu, bukti konsep).
8. Rekrut/patok 1–2 toko pilot (kenalan/kerabat) untuk M1.

---

*Dokumen ini adalah fondasi perencanaan; detail teknis lanjutan (kontrak API penuh, desain UI hi-fi, skema enkripsi) dibuat per fase di folder `docs/`.*
