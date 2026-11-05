import { Awan } from './Awan'

/**
 * Latar situs: warna merek di tepi layar (tengah tetap putih) dan awan yang naik pelan.
 * Sengaja tidak terikat scroll supaya tidak ada lapisan yang ikut bergerak saat membaca. Gaya di styles.css (.latar).
 */
export function Latar() {
  return (
    <div className="latar" aria-hidden="true">
      <Awan />
    </div>
  )
}
