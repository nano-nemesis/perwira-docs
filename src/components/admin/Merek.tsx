/* eslint-disable @next/next/no-img-element */
export function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <img src="/logo.png" alt="" width={48} height={36} style={{ height: 36, width: 'auto' }} />
      <span style={{ fontWeight: 800, fontSize: 22 }}>
        PerwiraMedia <span style={{ color: '#FF8A00' }}>Docs</span>
      </span>
    </div>
  )
}

export function Ikon() {
  return <img src="/logo.png" alt="PerwiraMedia" width={26} height={20} style={{ height: 20, width: 'auto' }} />
}
