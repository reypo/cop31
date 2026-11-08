# COP31'de AK Gençlik — "COP31'in İçinden"

AK Parti Gençlik Kolları'nın COP31 Antalya standı için mobil öncelikli deneyim (Next.js 16, React 19, Tailwind v4,
TypeScript). Kod, belge ve yorum dili Türkçe. Site İngilizce açılır; Türkçesi `/tr` altında.

## Rotalar

| Rota | İçerik | Belge |
|---|---|---|
| `/` | `/icinden`'e yönlendirir (307; `next.config.ts`) | — |
| `/icinden` · `/tr/icinden` | "COP31'in İçinden": resmî logodan uzaya, Antalya Expo'ya, standa ve fidana; önceden render edilmiş kliplerle bölüm bölüm dalış. Kiosk: `/icinden?auto=1` | `docs/brief-icinden-3.md` |
| `/brosur` · `/tr/brosur` | Dijital broşür: basılı broşür PDF'inin sayfa görüntüleriyle 3B sayfa çevirme | `docs/onay-listesi.md` §15 |

Öteki konseptler (`/dunya`, `/fidan`, `/nabiz`) ve konsept seçme sayfası 8 Kasım 2026'da kaldırıldı; eski adresler
`/icinden`'e yönlenir. Belgeleri (`docs/brief.md`, `docs/brief-dunya-2.md`, `docs/brief-dunya-apple.md`) geçmiş kaydı
olarak duruyor; kodları git geçmişinde. `src/components/fidan/tree.ts` S3 render'ındaki ağacın kaynağı olarak kaldı.

Müşteri onayı bekleyen maddeler: `docs/onay-listesi.md`.

## Geliştirme

```bash
npm install
npm run dev          # http://localhost:3000
npx tsc --noEmit     # tip denetimi
npm run lint         # eslint
npm run build && npx next start -p 3100   # üretim derlemesi (ölçümler bununla yapılır)
```

`AGENTS.md`: bu Next.js sürümü eğitim verisindekinden farklı; API'ler için `node_modules/next/dist/docs/`.

## `/icinden` medya hattı

- Sitedeki medya `public/icinden/{v,p}/` altında (video `<klip>.<özet>.<kodek>.mp4`, poster WebP); dosya listesi ve
  çapalar `src/components/icinden/klipler.json` manifestinde. Manifest elle düzenlenmez:
  `scripts/icinden/manifest-birlestir.mjs` üretir (şema ve tek komut: `docs/klipler-sema.md`).
- Kaynak kareler ve 3B varlıklar depo dışında (`D:\soft\cop31-varlik\`, her klasörde `KAYNAK.md` lisans kaydı);
  render betikleri `scripts/blender/s1` (dış sahne: Dünya, Akdeniz, Antalya; `BENIOKU.md`) ve `scripts/blender/s2`
  (stant içi). Blender 5.2 ile çalışır (`docs/blender-boru-hatti.md`).
- Kodlama ve doğrulama: `scripts/icinden/kodla.mjs`, `kodlama-dogrula.py`, `dikis-olc.py`, `scrim-olc.mjs`
  (oynatıcı tasarımı ve boyut tabloları `docs/klip-oynatma.md`). Veri atıfları: `docs/varliklar-icinden.md` §3.
- Video dosyaları içerik özetli adla ve `immutable` önbellekle yayınlanır (`next.config.ts`); her yeniden kodlama
  yeni dosya adları üretir, eskileri silinir.
