// Jalankan: npm run cek
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { bolehTanpa2fa, buatKodeCadangan, buatRahasia, cocokTotp, hashKode, kodeTotp, sesiTerverifikasi, tandaSesi } from './duafa.ts'

test('TOTP cocok dengan test vector RFC 6238 (T=59, SHA1)', () => {
  // rahasia ASCII "12345678901234567890" dalam base32
  assert.equal(kodeTotp('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', 1), '287082')
})

test('kode saat ini diterima, kode acak ditolak', () => {
  const r = buatRahasia()
  assert.equal(r.length, 32)
  assert.ok(cocokTotp(r, kodeTotp(r)))
  assert.ok(!cocokTotp(r, '000000') || kodeTotp(r) === '000000')
  assert.ok(!cocokTotp(r, '12345'))
})

test('kode cadangan disimpan sebagai hash', () => {
  const { kode, hash } = buatKodeCadangan()
  assert.equal(kode.length, 8)
  assert.equal(hashKode(kode[0].toLowerCase()), hash[0])
})

test('cookie 2FA terikat ke token sesi', () => {
  process.env.PAYLOAD_SECRET = 'uji'
  const ok = `payload-token=abc; pm-2fa=${tandaSesi('abc')}`
  assert.ok(sesiTerverifikasi(ok))
  assert.ok(!sesiTerverifikasi(`payload-token=lain; pm-2fa=${tandaSesi('abc')}`))
  assert.ok(!sesiTerverifikasi('payload-token=abc'))
})

test('bebas 2FA berlaku untuk semua peran yang dicentang admin', () => {
  assert.ok(bolehTanpa2fa({ role: 'penulis', tanpa2fa: true }))
  assert.ok(bolehTanpa2fa({ role: 'editor', tanpa2fa: true }))
  assert.ok(bolehTanpa2fa({ role: 'admin', tanpa2fa: true }))
  assert.ok(!bolehTanpa2fa({ role: 'penulis', tanpa2fa: false }))
  assert.ok(!bolehTanpa2fa({ role: 'editor' }))
  assert.ok(!bolehTanpa2fa(null))
})
