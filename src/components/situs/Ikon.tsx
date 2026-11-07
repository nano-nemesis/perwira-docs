const JALUR: Record<string, React.ReactNode> = {
  rumah: <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  roket: <path d="M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2M14 4c3-1 6-1 6-1s0 3-1 6l-7 7-5-5zM15 9h.01" />,
  awan: <path d="M7 18a4 4 0 0 1-.6-8A6 6 0 0 1 18 9a4.5 4.5 0 0 1-.5 9z" />,
  lapis: <path d="M12 3l9 5-9 5-9-5zM3 13l9 5 9-5M3 17l9 5 9-5" />,
  wifi: <path d="M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01" />,
  kartu: <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 10h18M7 15h4" />,
  kunci: <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-.5-.5-2.5z" />,
  jam: <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2" />,
  pena: <path d="M4 20h4L19 9l-4-4L4 16z" />,
  cari: <path d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-3.5-3.5" />,
  panah: <path d="M5 12h14M13 6l6 6-6 6" />,
  luar: <path d="M7 17L17 7M9 7h8v8" />,
  headset: <path d="M4 14v-2a8 8 0 0 1 16 0v2M3 14h4v6H3zM17 14h4v6h-4z" />,
  info: <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v5M12 8h.01" />,
  awas: <path d="M12 3l10 18H2zM12 10v4M12 17h.01" />,
  matahari: <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />,
  bulan: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  centang: <path d="M5 12l5 5 9-10" />,
  buku: <path d="M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h5" />,
  pesan: <path d="M4 5h16v11H9l-5 4z" />,
  unggah: <path d="M12 15V4M7 9l5-5 5 5M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" />,
  unduh: <path d="M12 4v11M7 10l5 5 5-5M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" />,
  video: <path d="M4 6h11v12H4zM15 10l5-3v10l-5-3" />,
  router: <path d="M3 13h18v6H3zM7 16h.01M11 16h.01M15 16h2M7 13l-1.5-6M17 13l1.5-6" />,
  terminal: <path d="M3 5h18v14H3zM7 9l3 3-3 3M12 15h5" />,
  monitor: <path d="M3 4h18v12H3zM8 20h8M12 16v4" />,
  struk: <path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h3" />,
  perisai: <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4" />,
}

export function Ikon({ nama, ukuran = 18, className }: { nama: string; ukuran?: number; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width={ukuran}
      height={ukuran}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {JALUR[nama]}
    </svg>
  )
}

export function IkonYoutube({ ukuran = 18 }: { ukuran?: number }) {
  return (
    <svg aria-hidden="true" width={ukuran} height={ukuran} viewBox="0 0 24 24">
      <rect x="2" y="5" width="20" height="14" rx="4" fill="#FF0000" />
      <path d="M10 9l5 3-5 3z" fill="#fff" />
    </svg>
  )
}
