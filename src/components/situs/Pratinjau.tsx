/** Bar penanda bahwa halaman sedang dibuka dalam mode pratinjau draf (belum terbit). */
export function Pratinjau({ kembali }: { kembali: string }) {
  return (
    <aside className="pratinjau" role="status">
      <span>Pratinjau draf. Halaman ini belum terbit dan hanya terlihat olehmu.</span>
      <a href={`/preview/exit?ke=${encodeURIComponent(kembali)}`}>Keluar pratinjau</a>
    </aside>
  )
}
