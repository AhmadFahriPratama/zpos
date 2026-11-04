'use client'

import { useState } from 'react'
import { useZPos } from '@/lib/store'
import { cn } from '@/lib/utils'
import { tanggalPendek } from '@/lib/format'
import type { Employee } from '@/lib/zpos-types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { StatCard, ViewHeader, EmptyState } from './ui-bits'
import {
  CheckCircle2, KeyRound, Loader2, Pencil, Plus, ShieldCheck,
  Trash2, UserCog, UsersRound, Warehouse,
} from 'lucide-react'

const ROLE_META: Record<string, { label: string; chip: string }> = {
  owner: { label: 'Pemilik', chip: 'bg-zinc-900 text-white' },
  manager: { label: 'Manajer', chip: 'bg-amber-100 text-amber-800' },
  kasir: { label: 'Kasir', chip: 'bg-emerald-100 text-emerald-700' },
  gudang: { label: 'Gudang', chip: 'bg-zinc-200 text-zinc-700' },
}

const ROLE_PERMS: Record<string, string[]> = {
  owner: ['Semua akses', 'Laba & keuangan', 'Kelola karyawan', 'Void transaksi'],
  manager: ['Semua modul toko', 'Void transaksi', 'Laporan lengkap', 'Kelola stok & beli'],
  kasir: ['Kasir', 'Daftar produk', 'Pelanggan', 'Shift sendiri'],
  gudang: ['Stok', 'Pembelian', 'Lihat produk'],
}

function EmployeeDialog({
  open, onOpenChange, editing,
}: { open: boolean; onOpenChange: (o: boolean) => void; editing: Employee | null }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && <EmployeeForm key={editing?.id ?? 'new'} editing={editing} onClose={() => onOpenChange(false)} />}
    </Dialog>
  )
}

function EmployeeForm({ editing, onClose }: { editing: Employee | null; onClose: () => void }) {
  const saveEmployee = useZPos((s) => s.saveEmployee)
  const [form, setForm] = useState(() =>
    editing
      ? { name: editing.name, role: editing.role, phone: editing.phone, pin: '' }
      : { name: '', role: 'kasir', phone: '', pin: '' }
  )
  const [busy, setBusy] = useState(false)

  const valid = form.name.trim().length >= 2 && (editing ? true : /^\d{6}$/.test(form.pin))

  const submit = async () => {
    if (!valid) return
    setBusy(true)
    const payload: Partial<Employee> & { name: string; role: string; pin?: string } = {
      ...(editing ? { id: editing.id } : {}),
      name: form.name.trim(),
      role: form.role,
      phone: form.phone.trim(),
    }
    if (form.pin) payload.pin = form.pin
    const ok = await saveEmployee(payload)
    setBusy(false)
    if (ok) onClose()
  }

  return (
    <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? 'Ubah Karyawan' : 'Karyawan Baru'}</DialogTitle>
          <DialogDescription>
            {editing ? 'Isi PIN hanya bila ingin menggantinya.' : 'PIN 6 digit digunakan untuk login & otorisasi.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid gap-1.5">
            <Label htmlFor="emp-name">Nama Lengkap *</Label>
            <Input id="emp-name" className="bg-white" value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nama karyawan" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Peran *</Label>
              <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
                <SelectTrigger className="w-full bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Pemilik</SelectItem>
                  <SelectItem value="manager">Manajer</SelectItem>
                  <SelectItem value="kasir">Kasir</SelectItem>
                  <SelectItem value="gudang">Gudang</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="emp-phone">Telepon</Label>
              <Input id="emp-phone" className="bg-white" value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="0812-…" />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="emp-pin">
              <span className="inline-flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
                PIN 6 Digit {editing ? '(opsional)' : '*'}
              </span>
            </Label>
            <Input id="emp-pin" type="password" inputMode="numeric" maxLength={6}
              className="bg-white font-mono tracking-widest" value={form.pin}
              onChange={(e) => setForm((f) => ({ ...f, pin: e.target.value.replace(/\D/g, '') }))}
              placeholder="••••••" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="border-zinc-200 bg-white" onClick={onClose}>Batal</Button>
          <Button className="bg-zinc-900 font-semibold text-white hover:bg-zinc-800" disabled={!valid || busy} onClick={submit}>
            {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
  )
}

export function EmployeesView() {
  const employees = useZPos((s) => s.employees)
  const deleteEmployee = useZPos((s) => s.deleteEmployee)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)

  const byRole = (r: string) => employees.filter((e) => e.role === r)
  const active = employees.filter((e) => e.isActive).length

  const del = async (e: Employee) => {
    if (!confirm(`Hapus karyawan "${e.name}"?`)) return
    await deleteEmployee(e.id)
  }

  return (
    <div className="mx-auto max-w-[1400px] p-4 sm:p-5">
      <ViewHeader title="Karyawan" desc="Tim toko, peran, dan hak akses masing-masing.">
        <Button size="sm" className="h-9 bg-zinc-900 font-semibold text-white hover:bg-zinc-800"
          onClick={() => { setEditing(null); setDialogOpen(true) }}>
          <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" /> Karyawan Baru
        </Button>
      </ViewHeader>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total Tim" value={String(employees.length)} icon={UsersRound} />
        <StatCard label="Sedang Aktif" value={String(active)} icon={CheckCircle2} tone="emerald" />
        <StatCard label="Kasir" value={String(byRole('kasir').length)} icon={UserCog} />
        <StatCard label="Manajer" value={String(byRole('manager').length)} icon={ShieldCheck} tone="amber" />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {/* Daftar karyawan */}
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm xl:col-span-2">
          <div className="border-b border-zinc-100 px-4 py-3">
            <p className="text-sm font-bold text-zinc-900">Daftar Karyawan</p>
          </div>
          <div className="zpos-scroll max-h-[480px] overflow-y-auto">
            {employees.length === 0 ? (
              <EmptyState icon={UsersRound} title="Belum ada karyawan" desc="Tambahkan tim pertama Anda." />
            ) : (
              <ul className="divide-y divide-zinc-100">
                {employees.map((e) => {
                  const role = ROLE_META[e.role] ?? ROLE_META.kasir
                  return (
                    <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-zinc-50">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                          e.role === 'owner' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500'
                        )}>
                          {e.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 truncate text-sm font-semibold text-zinc-900">
                            {e.name}
                            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', role.chip)}>{role.label}</span>
                          </p>
                          <p className="truncate text-[11px] text-zinc-400">
                            {e.phone || 'tanpa telepon'} · bergabung {tanggalPendek(e.joinedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className={cn('text-[11px] font-bold', e.isActive ? 'text-emerald-600' : 'text-zinc-300')}>
                          {e.isActive ? '● Aktif' : '○ Nonaktif'}
                        </span>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-zinc-500 hover:text-zinc-900"
                          onClick={() => { setEditing(e); setDialogOpen(true) }}>
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                          onClick={() => void del(e)} aria-label={`Hapus ${e.name}`}>
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Matriks hak akses */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="flex items-center gap-2 text-sm font-bold text-zinc-900">
            <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            Hak Akses per Peran
          </p>
          <p className="mt-1 text-xs text-zinc-400">RBAC — setiap peran hanya melihat modul yang relevan.</p>
          <ul className="mt-4 space-y-3">
            {Object.entries(ROLE_PERMS).map(([role, perms]) => (
              <li key={role} className="rounded-lg border border-zinc-100 bg-zinc-50/60 p-3">
                <p className="flex items-center gap-2 text-xs font-bold text-zinc-700">
                  {role === 'gudang' ? <Warehouse className="h-3.5 w-3.5" aria-hidden="true" /> : <UserCog className="h-3.5 w-3.5" aria-hidden="true" />}
                  {ROLE_META[role].label}
                  <span className="ml-auto text-[10px] font-semibold text-zinc-400">{byRole(role).length} orang</span>
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {perms.map((p) => (
                    <span key={p} className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-zinc-500 ring-1 ring-zinc-200">
                      {p}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <EmployeeDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} />
    </div>
  )
}
