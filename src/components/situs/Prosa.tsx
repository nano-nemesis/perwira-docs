import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { sanitizeUrl } from 'payload/shared'
import { BAHASA_KODE } from '@/lib/markdown'
import { Terminal } from './Interaktif'

type Kode = { fields: { code?: string; language?: string } }
type Tautan = { node: { fields?: { url?: string; newTab?: boolean; linkType?: string }; children: unknown[] }; nodesToJSX: (a: { nodes: unknown[] }) => React.ReactNode }

/**
 * Link aman: konverter bawaan Lexical memasang href mentah dari konten, jadi skema berbahaya
 * (data:, vbscript:, javascript:) bisa lolos ke atribut href. sanitizeUrl Payload hanya mengizinkan
 * http/https/mailto/tel dan jalur relatif; sisanya jadi '#'. Internal doc link tidak dipakai di situs ini.
 */
function tautanAman({ node, nodesToJSX }: Tautan) {
  const anak = nodesToJSX({ nodes: node.children })
  const baru = node.fields?.newTab
  return (
    <a href={sanitizeUrl(node.fields?.url ?? '') || '#'} rel={baru ? 'noopener noreferrer nofollow' : 'nofollow'} target={baru ? '_blank' : undefined}>
      {anak}
    </a>
  )
}

/** Konten lexical di situs. Blok kode (``` di Markdown) tampil sebagai terminal dengan tombol salin. */
export function Prosa({ data, en }: { data: SerializedEditorState; en: boolean }) {
  return (
    <RichText
      data={data}
      className="prosa"
      converters={({ defaultConverters }) => ({
        ...defaultConverters,
        link: tautanAman as never,
        autolink: tautanAman as never,
        blocks: {
          Code: ({ node }: { node: unknown }) => {
            const { code = '', language = 'routeros' } = (node as Kode).fields
            return <Terminal kode={code} en={en} label={language === 'routeros' ? undefined : BAHASA_KODE[language] ?? language} />
          },
        },
      })}
    />
  )
}
