import assert from 'node:assert/strict'
import { test } from 'node:test'
import { cari, normal, teksLexical, type Entri } from './cari.ts'

const e = (judul: string, bidang: [string, number][], jenis: Entri['jenis'] = 'panduan'): Entri => ({ jenis, judul, ket: '', href: '/' + normal(judul), nada: 'biru', ikon: 'buku', bidang: [[judul, 10], ...bidang] })
const indeks = [
  e('Setting PPPoE server di MikroTik', [['NET-020', 12], ['/ppp profile add name=10M', 2]]),
  e('Voucher hotspot massal', [['RAD-031', 12], ['Buat voucher PPPoE dan hotspot sekaligus', 1]]),
  e('Rilis v1.2', [['Perbaikan login hotspot', 3]], 'changelog'),
]

test('judul menang atas isi, semua kata wajib ada', () => {
  assert.deepEqual(cari(indeks, 'pppoe').map((h) => h.judul), ['Setting PPPoE server di MikroTik', 'Voucher hotspot massal'])
  assert.deepEqual(cari(indeks, 'pppoe mikrotik').map((h) => h.judul), ['Setting PPPoE server di MikroTik'])
  assert.deepEqual(cari(indeks, 'tidak ada'), [])
})

test('kode, perintah, dan cuplikan', () => {
  assert.equal(cari(indeks, 'net 020')[0].judul, 'Setting PPPoE server di MikroTik')
  assert.equal(cari(indeks, 'ppp profile')[0].cuplikan, '/ppp profile add name=10M')
  assert.equal(cari(indeks, 'login')[0].jenis, 'changelog')
  assert.deepEqual(cari(indeks, ' ? '), [])
})

test('teks dari Lexical termasuk blok kode', () => {
  const state = { root: { children: [{ children: [{ text: 'Halo' }, { text: 'dunia' }] }, { type: 'block', fields: { code: '/system reboot' } }] } }
  assert.equal(teksLexical(state), 'Halo dunia /system reboot')
})
