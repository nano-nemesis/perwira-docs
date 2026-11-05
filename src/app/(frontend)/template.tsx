/**
 * template.tsx dipasang ulang setiap pindah halaman, jadi animasi .halaman (motion blur
 * masuk) di styles.css jalan lagi tiap kali pembaca pindah menu.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="halaman">{children}</div>
}
