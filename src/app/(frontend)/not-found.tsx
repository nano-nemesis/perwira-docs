import Link from 'next/link'

export default function TidakAda() {
  return (
    <main className="lebar tengah-teks">
      <span className="lencana">404</span>
      <h1 className="judul-halaman">Halaman tidak ditemukan</h1>
      <p className="hero-sub">Mungkin tautannya sudah pindah. Coba cari panduannya dari kotak pencarian di atas, atau kembali ke beranda.</p>
      <Link href="/" className="tombol">
        Kembali ke beranda
      </Link>
    </main>
  )
}
