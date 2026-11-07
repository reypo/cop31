/**
 * Dijital broşür metni: "son COP31 Broşür Metni_Rev.pdf" (7 Kasım 2026) birebir; düzen ve vurgular basılı
 * broşürden ("Cop31 Son.pdf", 26 sayfa A4). Tek yazım farkı basılı broşürü izler: "Bizlerde" → "Bizler de" (§8).
 * Sayılar ve başlıklar yalnız burada; bileşenler (bolumler.tsx) metin üretmez.
 */

export const kimlik = "AK PARTİ | GENÇLİK KOLLARI";

export const kapak = {
  ust: "1 MİLYON",
  alt: "GENÇ,",
  el: "Tek Ortak Ev",
} as const;

/** İçindekiler: bölüm çapası, üst etiket, başlık. */
export const icindekiler = [
  { id: "mesaj", etiket: "Mesaj", baslik: "1 Milyon Genç, Tek Ortak Ev" },
  { id: "sayilarla", etiket: "Bölüm 01", baslik: "Sayılarla AK Gençlik" },
  { id: "karar-masasi", etiket: "Bölüm 02", baslik: "Gençlik Karar Masasında" },
  { id: "iklim", etiket: "Bölüm 03", baslik: "İklim İçin Sahadayız" },
  { id: "liderlik", etiket: "Bölüm 04", baslik: "Liderlik Okulu" },
  { id: "uniak", etiket: "Bölüm 05", baslik: "ÜniAK: Kampüs Hattı" },
  { id: "dinleyen", etiket: "Bölüm 06", baslik: "Dinleyen Siyaset" },
  { id: "solen", etiket: "Bölüm 07", baslik: "Gençlik Şöleni" },
  { id: "eserler", etiket: "Bölüm 08", baslik: "Büyük Türkiye’nin Büyük Eserleri" },
  { id: "dunyayla", etiket: "Bölüm 09", baslik: "Dünyayla Köprü" },
  { id: "taahhutler", etiket: "Bölüm 10", baslik: "COP31 Taahhütlerimiz" },
  { id: "kapanis", etiket: "Kapanış", baslik: "Gençlik nerede ise AK Gençlik oradadır" },
] as const;

export const mesaj = {
  paragraflar: [
    "AK Parti Gençlik Kolları, bir milyonu aşkın üyesiyle Türkiye’nin ve dünyanın en büyük gençlik hareketidir. Bizler, “Her Anında Hep Yanında” anlayışıyla gençlerimizin hayatının her alanında varlık gösteren ve onların hayallerine ortak olan büyük bir teşkilatız.",
    "Cumhurbaşkanımız Sayın Recep Tayyip Erdoğan’ın liderliğinde, ülkemizin bugününe yön veren ve yarınlarını şekillendiren öz güvenli bir nesil olarak gençlik mührümüzü çağımıza vuruyoruz. Küresel liderimiz Cumhurbaşkanımız Sayın Recep Tayyip Erdoğan’ın öncülüğünde ülkemiz, bu yıl NATO Zirvesi, Türk Devletleri Teşkilatı (TDT) Zirvesi ve COP31 olmak üzere üç önemli uluslararası zirveye ev sahipliği yapıyor. Bu zirveler arasında hepimiz için ayrı bir anlam taşıyan COP31 için heyecanlıyız.",
    "“Ortak evimiz dünyamız” diyerek iklim değişikliğiyle mücadelede gençlerin sorumluluğunu ve iradesini ortaya koyuyoruz. Çünkü bugün doğa için attığımız her adım, yarın çocuklarımıza ve gelecek nesillere bırakacağımız dünyanın niteliğini belirliyor.",
  ],
  imza: "Av. Yusuf İBİŞ",
  unvan: "AK Parti Gençlik Kolları Başkanı",
} as const;

/** 1. Sayılarla AK Gençlik */
export const sayilarla = {
  uye: { deger: 1000000, el: "’u aşkın üye", metin: "ile Türkiye’nin ve dünyanın en büyük gençlik hareketi" },
  teskilat: "81 il, 922 ilçe ve her mahallede güçlü teşkilat ağı",
  kartlar: {
    okul: { sayi: "10", el: "milyonu aşkın", metin: "Kuruluşundan bugüne AK Gençlik okulundan geçen 10 milyonu aşkın genç", lejant: "Her kare 1 milyon genç" },
    ilkOy: { sayi: "6,5", el: "milyon", metin: "6,5 milyon ilk defa oy kullanacak gence yönelik özel program ve çalışmalar", lejant: "Her kare 1 milyon genç" },
    saha: { sayi: "5", el: "milyondan fazla", metin: "Bir yılda 5 milyondan fazla gence ulaşan saha çalışmaları ve gençlik programları", lejant: "Her kare 1 milyon genç" },
    universite: { sayi: "208", el: "üniversite", metin: "208 üniversitede ÜniAK kulüpleri ile kampüslerde etkin gençlik", lejant: "Her nokta 1 üniversite" },
    proje: { sayi: "13", el: "proje", metin: "81 il ve 922 ilçede eş zamanlı yürütülen 13 proje", lejant: "Her çizgi 1 proje" },
    fidan: { sayi: "250", el: "bin fidan", metin: "AK Gençlik olarak bir yılda doğayla buluşturulan 250 bin fidan", lejant: "Her simge 10.000 fidan" },
  },
} as const;

/** 2. Gençlik Karar Masasında */
export const kararMasasi = {
  paragraflar: [
    "Genel Başkanımız ve Cumhurbaşkanımız Sayın Recep Tayyip Erdoğan, gençliği Türkiye’nin bugününü ve geleceğini şekillendiren en büyük güç olarak görmekte ve her fırsatta gençlere duyduğu güveni ortaya koymaktadır. Gençlerin siyasette ve toplumsal hayatta daha etkin rol üstlenmesini sağlayan bu vizyonun en somut adımlarından biri, 2017 yılında seçilme yaşının 18’e indirilmesi olmuştur.",
    "Gençlere Mecliste, Genel Başkan Yardımcılıklarında, belediyelerde ve teşkilatlarımızın her kademesinde sorumluluk veren Cumhurbaşkanımız, gençliği siyasetin öznesi haline getirmiş, karar alma mekanizmalarının merkezine taşımıştır. Bu yaklaşımın güçlü göstergeleri:",
  ],
  gostergeEtiket: "Bu yaklaşımın güçlü göstergeleri",
  yas: { sayi: "18", yil: "2017", el: "yılında seçilme yaşının 18’e indirilmesi" },
  vekil: { etiket: "30 YAŞ ALTI", toplam: 5, bizden: 4, metin: "Son genel seçimlerde TBMM’ye giren 30 yaş altı 5 milletvekilinin 4’ü partimizden seçildi." },
  meclis: { sayi: 700, el: "’ü aşkın genç", metin: "Belediye meclislerinde 700’ü aşkın genç, belediye meclis üyemiz olarak görev yapıyor." },
  nesil: "Bu anlayışla yetişen gençlik; fikirlerine güvenen, iddiasını ortaya koyan, sorumluluk almaktan çekinmeyen bir öz güven neslidir.",
  miras: "Bu vizyon, gençlere güven duyan ve gençlerin kendi potansiyellerine inanmasını sağlayan güçlü bir liderlik anlayışının en kıymetli mirasıdır.",
} as const;

/** 3. İklim İçin Sahadayız */
export const iklim = {
  giris: "AK Gençlik, daha yeşil bir Türkiye ve daha yaşanabilir bir gelecek için sahada…",
  etiket: "250 BİN FİDAN",
  fidan: { sayi: 250, el: "bin fidan", metin: "Bir yılda 60 ilde 10.000’den fazla gençle 250 bin fidanı toprakla buluşturduk.", lejant: "Her simge 1.000 fidan" },
  il: { sayi: 60, el: "ilde" },
  genc: { sayi: 10000, el: "’den fazla gençle" },
  orman: { sayi: 9, el: "ilimizde", metin: "Son bir yılda 9 ilimizde AK Gençlik Hatıra Ormanı kurduk." },
  el: "sahadayız!",
  kartlar: [
    { etiket: "81 İL · 922 İLÇE", metin: "Binlerce gönüllü gençle, 81 il ve 922 ilçemizde düzenli doğa temizliği faaliyetleri gerçekleştiriyoruz." },
    { etiket: "SIFIR ATIK PROJESİ", metin: "Sıfır Atık Projesi’ne destek kapsamında teşkilatlarımızı bilinçlendiren eğitim çalışmaları yürütüyoruz." },
    { etiket: "ÇEVRE BİLİNCİ", metin: "Gençlerde çevre bilinci oluşturacak eğitici oyunlar hazırlayarak bu konuda bilinçlenmelerini sağlıyoruz." },
  ],
  gonullu: { sayi: 20, el: "bin gönüllü genç", metin: "Ülkemizde meydana gelen yangın, sel ve deprem gibi doğal afetlerde vatandaşlarımızın yardımına koşuyor, 81 ilimizden 20 bin gönüllü genç arkadaşımızla afet bölgelerinde aktif görev alarak dayanışma ve yardımlaşma ruhunu sahaya yansıtıyoruz." },
  kampus: { sayi: 208, el: "üniversitedeki ÜniAK kulüplerimizle", metin: "208 üniversitedeki ÜniAK kulüplerimizle kampüslerde sürdürülebilir çevre projelerini destekliyoruz." },
  dava: "Doğayı korumayı bir sorumluluk, gelecek nesillere daha yaşanabilir bir dünya bırakmayı bir dava olarak görmeye devam edeceğiz.",
} as const;

/** 4. Liderlik Okulu */
export const liderlik = {
  giris: "Biz, gençlerin heyecanını, dinamizmini ve öz güvenini teşkilat gücüne dönüştüren büyük bir gençlik okuluyuz. Tarihini idrak eden, dünyayı iyi okuyan, imanlı, vatansever ve donanımlı kadrolar yetiştiriyoruz.",
  akademi: "Her yıl 81 ilimizde düzenlediğimiz Teşkilat Akademileri ve kamplarımız aracılığıyla, yaklaşık 35 bin teşkilat mensubumuzun katılımıyla gerçekleştirdiğimiz teşkilat içi eğitim programlarımız kapsamında kişi başı 60 saati aşkın eğitim veriyoruz.",
  rakamlar: [
    { ust: "YAKLAŞIK", sayi: "35", el: "bin", alt: "teşkilat mensubu" },
    { ust: "KİŞİ BAŞI", sayi: "60", el: "saati aşkın", alt: "eğitim" },
    { ust: "HER YIL", sayi: "81", el: "ilimizde", alt: "Teşkilat Akademileri ve kamplar" },
  ],
  dersler: ["Siyaset ve Liderlik", "Teşkilat Yönetimi", "İletişim ve Hitabet", "Güncel Siyasi Gelişmeler", "Türkiye ve Dünya Gündemi"],
  sahne: "360 derece sahne konseptiyle gerçekleştirdiğimiz eğitimlerde; AK Parti Genel Başkan Yardımcılarımızı, bakanlarımızı, alanında uzman gazetecileri ve akademisyenleri gençlerimizle buluşturuyor; doğrudan iletişim, karşılıklı etkileşim ve istişareye dayalı bir eğitim ortamı oluşturuyoruz. Eğitimlerimizi sosyal ve kültürel etkinliklerle zenginleştirerek öğrenme sürecimizi daha keyifli ve verimli hale getiriyoruz.",
  okul: "Kuruluşumuzdan bugüne 10 milyonu aşkın genç, bir okul gibi AK Gençlik’ten geçti.",
  okulEtiket: "10 MİLYONU AŞKIN GENÇ",
} as const;

/** 5. ÜniAK: Kampüs Hattı */
export const uniak = {
  paragraflar: [
    "AK Gençlik, 208 üniversitede ÜniAK kulüpleriyle üniversiteli gençlerle buluşan güçlü bir teşkilat yapısına sahiptir. Üniversite hayatının ilk gününden mezuniyetine kadar gençlerimizin yanında olmayı, onlara yol arkadaşlığı yapmayı temel bir sorumluluk olarak görüyoruz.",
    "Kampüse Hoş Geldin - İlk Durak ÜniAK stantlarımızla üniversiteye adım atan gençlerimizi karşılıyor; eğitimler, akademik çalışmalar ve sosyal etkinliklerle bağlarımızı güçlendiriyoruz. Amfide, kantinde, kampüsün her noktasında gençlerimizin hayatına dokunuyoruz. Vize ve final haftalarında motivasyonlarını güçlendiriyoruz.",
  ],
  basla: "İLK GÜN",
  bitis: "MEZUNİYET",
  hat: [
    { sayi: 450, el: "bini aşkın", metin: "Kampüse Hoş Geldin - İlk Durak ÜniAK etkinliği kapsamında son bir yılda 450 bini aşkın üniversiteli genç aramıza katıldı." },
    { sayi: 1000, el: "’i aşkın", metin: "Son bir yılda ÜniAK kulüplerimiz her ay 1.000’i aşkın farklı ve lokal etkinlik düzenleyerek özel gün ve haftalara yönelik çalışmalar gerçekleştirdi." },
    { sayi: 500, el: "bini aşkın", metin: "Geçtiğimiz Ramazan ayında 500 bini aşkın genç kampüs iftarlarında buluştu." },
    { sayi: 250, el: "bini aşkın", metin: "Son bir yıl içerisinde, düzenlediğimiz gezi programları kapsamında 250 bini aşkın gencimizin üniversite öğrenimi gördüğü şehirden farklı bir şehri ziyaret etmesine imkân sağladık." },
    { sayi: 200, el: "’ü aşkın", metin: "Gençlerimiz, ÜNİDES (Üniversite Öğrenci Toplulukları İş Birliği ve Destek Programı) kapsamında 200’ü aşkın proje hayata geçirerek sosyal farkındalığın artırılmasına ve toplumsal fayda üreten çalışmalara katkı sunmuştur." },
  ],
  kapanis: "ÜniAK, üniversiteli gençlerin fikirlerini, heyecanlarını ve potansiyellerini ortak bir zeminde buluşturan; kampüslerde AK Gençlik’in güçlü sesi ve yol arkadaşıdır.",
} as const;

/** 6. Dinleyen Siyaset */
export const dinleyen = {
  giris: "AK Gençlik olarak gençlerle gönül bağımızı güçlendiriyor, fikirlerini siyasetin merkezine taşıyoruz.",
  rakamlar: [
    { sayi: "30", el: "’dan fazla", metin: "Son 5 yılda Cumhurbaşkanımızın katılımıyla 30’dan fazla Gençlik Buluşması gerçekleştirdik." },
    { sayi: "400", el: "binden fazla", metin: "Söz Gençlikte ve Mahallede GençİZ programlarımızla son bir yılda 400 binden fazla gence ulaştık." },
    { sayi: "81", el: "il, 922 ilçe", metin: "81 il, 922 ilçe ve her mahallede gençlerimizle buluşarak mahalle çalışmalarımızı tabandan diyalog modeli olarak sürdürüyoruz." },
  ],
} as const;

/** 7. Gençlik Şöleni */
export const solen = {
  paragraf:
    "25 yıllık AK Gençlik tarihimizde stadyumlarda düzenlediğimiz 14 Gençlik Şöleni ile yüz binlerce gencimizi aynı heyecan ve ortak ideal etrafında buluşturduk. 16 Mayıs 2026’da Kocaeli’de düzenlediğimiz şölenimizde 100 bini aşkın gencimizle Cumhurbaşkanımız Sayın Recep Tayyip Erdoğan’ın katılımıyla unutulmaz bir buluşmaya imza attık.",
  gelenek: "Gençlik şölenlerimizi AK Gençlik geleneği olarak yaşatmaya devam ediyoruz.",
  sayi: 100,
  el: "bini aşkın genç",
  tarih: "16 MAYIS 2026 · KOCAELİ",
} as const;

/** 8. Büyük Türkiye’nin Büyük Eserleri */
export const eserler = {
  paragraflar: [
    "AK Parti döneminde hayata geçirilen havalimanlarından köprülere, şehir hastanelerinden savunma sanayiine, enerji yatırımlarından yerli teknoloji hamlelerine kadar sayısız eser, Türkiye’nin kalkınma yolculuğuna yön verdi.",
    "AK Gençlik olarak bizler, Gençlerle Eser Buluşmaları – Büyük Türkiye’nin Büyük Eserleri projemizle, bu vizyonu o alanda eğitim gören üniversiteli gençlerimizle buluşturuyor; eserlerin hikâyesini yerinde anlatıyoruz.",
  ],
  bulusmalar: [
    { no: "01", ad: "GABAR", yer: "Şehit Esma Çevik Sahası", nokta: "gabar", metin: "Enerji ve Tabii Kaynaklar Bakanımız Sayın Alparslan Bayraktar ile Şehit Esma Çevik Sahası’nda Türkiye’nin enerji bağımsızlığı yolculuğunu keşfettik." },
    { no: "02", ad: "TOGG", yer: "Gemlik Kampüsü", nokta: "togg", metin: "Sanayi ve Teknoloji Bakanımız Sayın Mehmet Fatih Kacır ile Gemlik Kampüsü’nde yerli ve millî otomobilimizin üretimine, Milli Teknoloji Hamlesi’ne yakından tanıklık ettik." },
    { no: "03", ad: "HATAY", yer: "Asrın İnşası", nokta: "hatay", metin: "Çevre, Şehircilik ve İklim Değişikliği Bakanımız Sayın Murat Kurum ile Asrın İnşası’nı yerinde gördük; deprem sonrası yeniden ayağa kalkan Hatay’ın yeniden doğuşuna şahit olduk." },
  ],
  kapanis:
    "Her eser bir vizyonun, her buluşma bir ilhamın izini taşıyor. Bizler de bu büyük eserleri gençlerimizle keşfetmeye, geleceğin mühendislerini, mimarlarını ve teknoloji öncülerini Türkiye’nin başarı hikâyeleriyle buluşturmaya devam edeceğiz.",
} as const;

/** 9. Dünyayla Köprü */
export const dunyayla =
  "AK Gençlik olarak uluslararası alanda aktif rol alıyor, dünya gençliğiyle güçlü bağlar kuruyoruz. Türk devletleri gençlik teşkilatları başta olmak üzere dünyanın farklı ülkelerindeki gençlik örgütleriyle ilişkilerimizi geliştiriyor; karşılıklı ziyaretler, uluslararası heyet programları ve ortak projelerle iş birliklerimizi güçlendiriyoruz. Gençler arasında dayanışmayı büyütüyor, Türkiye’nin gençlik vizyonunu dünyaya taşıyoruz.";

/** 10. COP31 Taahhütlerimiz */
export const taahhutler = {
  giris: "AK Gençlik olarak iklim krizine karşı gençliğin gücünü harekete geçiriyor, ölçülebilir hedeflerle geleceğe söz veriyoruz.",
  plan: "Beş taahhüdümüzün tamamı 2027 sonuna kadar gerçekleştirilmek üzere planlandı.",
  sure: "2027 SONUNA KADAR",
  liste: [
    { no: "01", baslik: "HER ÜYEYE 1 FİDAN – 1 MİLYON FİDAN", metin: "2027 sonuna kadar her üyemiz için bir fidan olmak üzere 1 milyon fidanı toprakla buluşturmayı hedefliyoruz.", sayi: "1", el: "milyon fidan", lejant: "Her nokta 1.000 fidan" },
    { no: "02", baslik: "100 BİN GENÇ", metin: "2027 sonuna kadar 100 bin gencimize iklim okuryazarlığı eğitimi kazandırmayı hedefliyoruz.", sayi: "100", el: "bin genç", lejant: "Her kare 1.000 genç" },
    { no: "03", baslik: "208 KAMPÜS – 208 SIFIR ATIK NOKTASI", metin: "2027 sonuna kadar ÜniAK kulüplerimizle 208 üniversitede birer sıfır atık noktası ve geri dönüşüm ekibi kurmayı hedefliyoruz.", sayi: "208", el: "kampüs", lejant: "Her nokta 1 üniversite" },
    { no: "04", baslik: "81 İL – 922 İLÇEDE 10.000 ÇEVRE ETKİNLİĞİ", metin: "2027 sonuna kadar ülke genelinde 10.000 doğa temizliği ve çevre etkinliği gerçekleştirmeyi hedefliyoruz.", sayi: "10.000", el: "çevre etkinliği", lejant: "81 il · 922 ilçe" },
    { no: "05", baslik: "25 BİN İKLİM GÖNÜLLÜSÜ", metin: "2027 sonuna kadar gençlerden oluşan iklim gönüllüsü ağımızı 25 bine çıkarmayı hedefliyoruz.", sayi: "25", el: "bin iklim gönüllüsü", lejant: "Her daire 1.000 gönüllü" },
  ],
  soz: "Daha yeşil bir Türkiye, daha yaşanabilir bir dünya için söz veriyoruz!",
} as const;

/** Kapanış */
export const kapanis = {
  baslik: ["GENÇLİK NEREDE İSE", "AK GENÇLİK", "ORADADIR."],
  el: "Her Anında Hep Yanında",
  paragraflar: [
    // Metindeki ilk cümle ("Gençlik nerede ise AK Gençlik oradadır.") basılı broşürde olduğu gibi başlıkta.
    "Buraya kadar ifade ettiğimiz çalışmalarımızın dışında illerimizde düzenlediğimiz konsept programlardan Ramazan’ın her gününde iftar ve sahur sofralarına, yaz boyunca gerçekleştirdiğimiz gençlik festivallerinden sayısız buluşmaya kadar gençlerimizle hayatın her alanında bir araya geliyoruz.",
    "Genel Başkanımız ve Cumhurbaşkanımız Sayın Recep Tayyip Erdoğan’ın ortaya koyduğu büyük Türkiye idealini geleceğe taşıyacak, Anadolu kıtası büyüklüğündeki dava taşını yerine koyacak öz güven neslinin yetişmesi için çalışıyoruz.",
    "“Her Anında Hep Yanında” anlayışıyla gençlerimizin bugününe eşlik ediyor, yarınlarına umut oluyor; ülkemiz, gençliğimiz, bugünümüz ve geleceğimiz için çalışıyoruz.",
  ],
  vurgu: "AK Gençlik, Türkiye’nin gençliğiyle birlikte büyüyen, gençliğin enerjisiyle bugünü ve geleceği inşa eden bir hareket olmaya devam edecek.",
} as const;
