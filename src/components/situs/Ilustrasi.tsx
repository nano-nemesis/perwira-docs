/** Ilustrasi hero: awan, rak server, dan dokumen. SVG murni, tanpa berkas gambar. */
export function Ilustrasi() {
  const rak = (y: number) => (
    <g transform={`translate(0 ${y})`} key={y}>
      <path d="M120 120 L186 140 L186 178 L120 158 Z" fill="url(#il-depan)" />
      <path d="M186 140 L262 118 L262 156 L186 178 Z" fill="#17337F" />
      <circle cx="204" cy="150" r="4" fill="#FF9A1F" />
      <circle cx="218" cy="146" r="4" fill="#FF9A1F" />
      <circle cx="232" cy="142" r="4" fill="#FFB65A" />
      <path d="M132 137 L170 148" stroke="#8FB2FF" strokeWidth="4" strokeLinecap="round" opacity=".6" />
    </g>
  )
  return (
    <svg className="ilustrasi" role="img" aria-label="Ilustrasi cloud, rak server, dan dokumen" viewBox="0 0 300 260">
      <defs>
        <linearGradient id="il-awan" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#D6EAFF" />
          <stop offset="1" stopColor="#4C9BFF" />
        </linearGradient>
        <linearGradient id="il-depan" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3B74F0" />
          <stop offset="1" stopColor="#1D3D9E" />
        </linearGradient>
        <linearGradient id="il-atas" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8FB4FF" />
          <stop offset="1" stopColor="#4D7DEB" />
        </linearGradient>
        <linearGradient id="il-dok" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#FFE9CF" />
        </linearGradient>
      </defs>
      <circle cx="182" cy="62" r="34" fill="url(#il-awan)" />
      <circle cx="222" cy="50" r="42" fill="url(#il-awan)" />
      <circle cx="258" cy="74" r="28" fill="url(#il-awan)" />
      <rect x="158" y="62" width="122" height="38" rx="19" fill="url(#il-awan)" />
      {[84, 42, 0].map(rak)}
      <path d="M120 120 L196 99 L262 118 L186 140 Z" fill="url(#il-atas)" />
      <g transform="rotate(-10 92 190)">
        <rect x="46" y="158" width="104" height="86" rx="12" fill="#FF8A00" opacity=".35" />
        <rect x="40" y="150" width="104" height="86" rx="12" fill="url(#il-dok)" />
        <path d="M40 162 a12 12 0 0 1 12 -12 h80 a12 12 0 0 1 12 12 v10 h-104 z" fill="#FF8A00" />
        <rect x="54" y="186" width="70" height="7" rx="3.5" fill="#FFB25E" />
        <rect x="54" y="200" width="58" height="7" rx="3.5" fill="#FFC788" />
        <rect x="54" y="214" width="74" height="7" rx="3.5" fill="#FFB25E" />
      </g>
    </svg>
  )
}
