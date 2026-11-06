import { test } from 'node:test'
import assert from 'node:assert/strict'
import { grupVersi, lebihBaru, hanyaTerbaru } from './versi.ts'

test('grupVersi: induk kalau ada, kalau tidak dirinya sendiri', () => {
  assert.equal(grupVersi({ id: 5 }), 5)
  assert.equal(grupVersi({ id: 7, induk: 3 }), 3)
  assert.equal(grupVersi({ id: 7, induk: { id: 3 } }), 3)
  assert.equal(grupVersi({ id: 7, induk: null }), 7)
})

test('lebihBaru: perbandingan numerik, bukan string', () => {
  assert.equal(lebihBaru('2.0', '1.0'), true)
  assert.equal(lebihBaru('1.0', '2.0'), false)
  assert.equal(lebihBaru('2.10', '2.9'), true) // 10 > 9, string biasa salah di sini
  assert.equal(lebihBaru('1.0', '1.0'), false)
  assert.equal(lebihBaru('1.1', null), true)
})

test('hanyaTerbaru: satu per grup, versi tertinggi', () => {
  const docs = [
    { id: 1, versi: '1.0' }, // grup 1, v1
    { id: 2, versi: '2.0', induk: 1 }, // grup 1, v2 (terbaru)
    { id: 3, versi: '1.0' }, // grup 3 sendiri
  ]
  const hasil = hanyaTerbaru(docs).map((d) => d.id)
  assert.deepEqual(hasil.sort(), [2, 3])
})
