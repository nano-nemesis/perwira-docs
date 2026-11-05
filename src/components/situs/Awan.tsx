import type { CSSProperties } from 'react'
import s from './awan.module.css'

// satu bentuk awan (gabungan empat lingkaran, alas rata), diisi gradien dari variabel tema
const BENTUK = 'M52 100A30 30 0 1 1 56.7 40.4A40 40 0 0 1 128.9 30.8A32 32 0 0 1 173.8 56.1A22 22 0 0 1 172 100Z'

// x dan w dalam vw, t = lama naik (detik), d = mulai di tengah jalan supaya awan sudah tersebar saat halaman dibuka.
// Awan "jauh" kecil, buram, dan lebih pelan, jadi terasa berlapis.
const AWAN = [
  { x: 3, w: 17, t: 62, d: -8 },
  { x: 64, w: 22, t: 50, d: -27 },
  { x: 33, w: 9, t: 96, d: -70, jauh: true },
  { x: 86, w: 10, t: 88, d: -14, jauh: true },
  { x: 16, w: 20, t: 56, d: -40 },
  { x: 50, w: 8, t: 104, d: -36, jauh: true },
  { x: 76, w: 15, t: 66, d: -52 },
]

/** Awan yang naik pelan dari bawah layar. Warna dari --awan-atas, --awan-bawah, --awan-bayang milik tema. */
export function Awan() {
  return (
    <div className={s.awan} aria-hidden="true">
      <svg className={s.defs} width="0" height="0">
        <linearGradient id="awan-isi" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.35" className={s.atas} />
          <stop offset="1" className={s.bawah} />
        </linearGradient>
      </svg>
      {AWAN.map((a, i) => (
        <svg
          key={i}
          viewBox="20 10 176 92"
          className={a.jauh ? `${s.satu} ${s.jauh}` : s.satu}
          style={{ '--x': `${a.x}vw`, '--w': `${a.w}vw`, '--t': `${a.t}s`, '--d': `${a.d}s` } as CSSProperties}
        >
          <path d={BENTUK} fill="url(#awan-isi)" />
        </svg>
      ))}
    </div>
  )
}
