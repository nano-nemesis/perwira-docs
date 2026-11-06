/**
 * Analisis SEO memakai mesin Yoast (paket open-source `yoastseo`), researcher Bahasa Indonesia.
 * Dipanggil server-side dari endpoint /api/seo-analisis. Impor dinamis supaya tidak ikut ke bundle klien.
 */

export type NilaiSeo = { rating: 'baik' | 'cukup' | 'buruk'; teks: string }
export type HasilSeo = { skor: number; warna: 'baik' | 'cukup' | 'buruk'; hasil: NilaiSeo[]; skorBaca: number; baca: NilaiSeo[] }

const warnaDari = (skor: number): 'baik' | 'cukup' | 'buruk' => (skor >= 71 ? 'baik' : skor >= 41 ? 'cukup' : 'buruk')
const ratingDari = (s: number): 'baik' | 'cukup' | 'buruk' => (s >= 7 ? 'baik' : s >= 4 ? 'cukup' : 'buruk')
const bersih = (t: string) => (t || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()

type Masuk = { keyphrase: string; title: string; description: string; slug: string; permalink: string; html: string; locale?: 'id' | 'en' }

export async function analisisSeo(m: Masuk): Promise<HasilSeo> {
  const yoast = await import('yoastseo')
  const { Paper, SeoAssessor, ContentAssessor } = yoast as unknown as { Paper: new (t: string, a: object) => object; SeoAssessor: new (r: object, o: object) => Assessor; ContentAssessor: new (r: object, o: object) => Assessor }
  const kode = m.locale === 'en' ? 'en' : 'id'
  const Researcher = (await import(`yoastseo/build/languageProcessing/languages/${kode}/Researcher.js`)).default as new (p: object) => object

  const paper = new Paper(m.html, {
    keyword: m.keyphrase, title: m.title, description: m.description, slug: m.slug,
    permalink: m.permalink, titleWidth: Math.min(600, (m.title?.length ?? 0) * 9), locale: kode === 'en' ? 'en_US' : 'id_ID',
  })
  const researcher = new Researcher(paper)
  const opsi = { locale: kode === 'en' ? 'en_US' : 'id_ID' }

  const ambil = (A: new (r: object, o: object) => Assessor) => {
    try {
      const a = new A(researcher, opsi); a.assess(paper)
      const skor = a.calculateOverallScore()
      const hasil = a.getValidResults().filter((r) => r.score > 0).map((r) => ({ rating: ratingDari(r.score), teks: bersih(r.text) }))
      return { skor, hasil }
    } catch {
      return { skor: 0, hasil: [] as NilaiSeo[] }
    }
  }
  const seo = ambil(SeoAssessor)
  const baca = ambil(ContentAssessor)
  return { skor: seo.skor, warna: warnaDari(seo.skor), hasil: seo.hasil, skorBaca: baca.skor, baca: baca.hasil }
}

type Assessor = { assess: (p: object) => void; calculateOverallScore: () => number; getValidResults: () => { score: number; text: string }[] }
