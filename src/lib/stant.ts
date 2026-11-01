/**
 * Stant içeriği — "12.000 Yıllık Emanet" (brief: docs/brief-dunya-2.md §3).
 * Kaynak: stant tasarım PDF'i (8 sayfa render; metinler raster, render'lardan kırpılarak okundu).
 * Her metnin okuma kaydı ve güven düzeyi: docs/stant-icerik.md. PDF'te olmayan ya da kısmen
 * okunan her şey "// ONAY:" yorumuyla işaretli ve docs/onay-listesi.md'de.
 *
 * Yazım: metinler PDF'teki gibi; tireler en dash (–) ile normalize edildi. Büyük harf gereken yerde
 * metin doğrudan büyük yazılmalı (text-transform: uppercase yok).
 */

export type StantBolgesi = {
  readonly no: number;
  readonly ad: string;
  readonly kisa: string;
};

export const stant = {
  /** Rotunda bandı: "12.000 Yıllık Emanet – A 12.000-Year Trust" (okundu). */
  tema: "12.000 Yıllık Emanet",
  // ONAY: bantta "A 12.000-Year Trust" yazıyor (pankartlar[0]). İngilizcede binlik ayıracı virgül;
  // yabancı ziyaretçi "12.000"i "12" gibi okuyabilir. Sitede İngilizce yazımla (onay-listesi §13).
  temaEn: "A 12,000-Year Trust",
  /** Büyük giriş pankartı (okundu). */
  hashtag: "#YaniBanaEmanet",
  /** Büyük giriş pankartı alt satırı: "GençİKlim – 12.000 Yıllık Emanet – İçeride →" (okundu). */
  program: "GençİKlim",
  // ONAY: iki yazım var — koyu totem "İklim, doğa ve sıfır atık bize miras." (aşağıdaki),
  // büyük pankart "İklim, doğa, sıfır atık bize miras." Hangisi esas?
  slogan: "İklim, doğa ve sıfır atık bize miras.",
  girisMetni: [
    // ONAY: koyu totemin alt satırı kısmen okundu: "Tarihe göre – 12.000 yıl önceden bugüne."
    // ("Tarihe göre" küçük ve soluk). Burada yalnızca net okunan kısmı var.
    "12.000 yıl önceden bugüne.",
    // ONAY: öneri metni, PDF'te yok (rotunda + zemin halkasının anlattığını tek cümlede toplar).
    "Rotundadaki 12 sütunun her biri, Anadolu'nun doğal ve kültürel mirasından bir emaneti taşıyor.",
  ],
  bolgeler: [
    {
      no: 1,
      // ONAY: "Emanet Rotundası" adı PDF'te yok (brief'ten); bant metni "12.000 Yıllık Emanet".
      ad: "Emanet Rotundası",
      // ONAY: öneri; zemin halkası ortasındaki "Buradasın / Bugün" ve 12 sütun PDF'te var.
      kisa: "12 sütun, 12 emanet; ortada zemin halkası: Buradasın, bugün.",
    },
    {
      no: 2,
      // Okundu: koyu bant "Oyna – Sen olsan ne yapardın?" (EN bant: "Play – What would you do?").
      ad: "Oyna – Sen olsan ne yapardın?",
      // Okundu: turuncu dikey pankart "Gel, oyna! Come and play!"
      kisa: "Gel, oyna!",
    },
    {
      no: 3,
      // ONAY: "Söz Kiosku" adı PDF'te yok; kiosk ekranında "Bugün 112 kişi söz verdi." okunuyor.
      ad: "Söz Kiosku",
      // ONAY: "Sen de söz ver." PDF'te yok (brief'ten). Sayı yalnızca standdaki ekranda canlı.
      kisa: "Bugün kaç kişi söz verdi? Sen de söz ver.",
    },
    {
      no: 4,
      // ONAY: ad PDF'te yok. Planda iki kavisli bank + konuşmacı sandalyeleri + ekran duvarı var.
      ad: "Amfi · söyleşiler",
      // ONAY: öneri, PDF'te yok.
      kisa: "Kavisli banklarda söyleşiler ve sunumlar.",
    },
  ] satisfies readonly StantBolgesi[],
  kiosk: {
    // Okundu (örnek sayı 112 ile): "Bugün 112 kişi söz verdi." Üstünde küçük "Türkiye'de" satırı.
    // Sitede sabit sayı YOK; sayı yalnızca standdaki ekranda.
    baslik: "Bugün … kişi söz verdi.",
    // ONAY: PDF'te yok (brief'ten).
    cagri: "Sen de söz ver.",
  },
  /** Stant üzerindeki pankart/bant metinleri, okunan biçimiyle (hepsi "okundu"). */
  pankartlar: [
    "12.000 Yıllık Emanet – A 12.000-Year Trust", // rotunda bandı
    "İklim, doğa, sıfır atık bize miras.", // büyük giriş pankartı
    "#YaniBanaEmanet", // büyük giriş pankartı
    "GençİKlim – 12.000 Yıllık Emanet – İçeride", // büyük giriş pankartı alt satırı (sonda "→")
    "Gel, oyna! Come and play!", // sol turuncu dikey pankart
    "Oyna – Sen olsan ne yapardın?", // oyun alanı bandı (TR)
    "Play – What would you do?", // oyun alanı bandı (EN)
    // ONAY: "DengeCOP31" küçük ve dikey yazılı; yazımı teyit edilmeli.
    "Sıfır Atık Yöneticileri – COP31'e Giden Yol – DengeCOP31", // sağ turuncu dikey pankart
  ],
  /** Zemin halkasının ortası (okundu): küçük "Buradasın", altında büyük serif "Bugün". */
  zemin: { ust: "Buradasın", alt: "Bugün" },
  /**
   * Render'lardan PIL ile örneklenen renkler (medyan; salon ışığı tonları koyulaştırıyor olabilir).
   * Ayrıntı ve diğer örnekler (turuncu pankart #DF9560, aydınlık rotunda bandı #377568, bordo çip
   * #58281F): docs/stant-icerik.md §Palet.
   */
  palet: {
    krem: "#F7E6CD", // büyük giriş pankartının krem zemini
    koyuYesil: "#28332F", // koyu totem + zemin halkası + pankart koyu yeşili (birleşik medyan)
    ahsap: "#B49168", // ahşap dikey çıtalar (birleşik medyan)
  },
} as const;
