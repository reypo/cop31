/**
 * Broşür metinleri — "COP31'de AK Gençlik" (12 sayfa).
 * Metinler broşürdeki gibidir; kısaltma/yeniden yazma yapmayın.
 * Sayıları biçimlendirmek için: value.toLocaleString("tr-TR") → "1.000.000".
 */

export const cover = {
  title: "COP31'de AK Gençlik",
  slogan: "Gezegenimiz Ortak Evimizdir",
  subtitle: "Sürdürülebilir Bir Gelecek İçin Güçlü Gençlik Hareketi",
  org: "AK Parti Gençlik Kolları Türkiye",
} as const;

export type Stat = {
  readonly value?: number;
  readonly suffix?: string;
  readonly label: string;
};

/** Broşür sayfa 3 istatistik kutuları. Sonuncusunun sayısı yok (yalnızca etiket). */
export const stats: readonly Stat[] = [
  { value: 1000000, suffix: "+", label: "Genç Üye" },
  { value: 81, label: "İl" },
  { value: 922, label: "İlçe" },
  { label: "COP31 İklim Taahhüdü" },
] as const;

export const genclikKollari = {
  title: "AK Parti Gençlik Kolları",
  subtitle:
    "81 ilde ve 922 ilçede, 1 milyonu aşkın üyesiyle dünyanın en büyük gençlik hareketi",
  paragraphs: [
    "AK Parti Gençlik Kolları, bir milyonu aşkın üyesiyle Türkiye'nin ve dünyanın en büyük gençlik hareketidir.",
    "Bizler, \"Her Anında Hep Yanında\" anlayışıyla gençlerimizin hayatının her alanında varlık gösteren ve onların hayallerine ortak olan büyük bir teşkilatız.",
    "Cumhurbaşkanımız Sayın Recep Tayyip Erdoğan'ın liderliğinde, ülkemizin bugününe yön veren ve yarınlarını şekillendiren öz güvenli bir nesil olarak gençlik mührümüzü çağımıza vuruyoruz. Küresel liderimiz Cumhurbaşkanımız Sayın Recep Tayyip Erdoğan'ın öncülüğünde ülkemiz, bu yıl üç önemli uluslararası zirveye ev sahipliği yapıyor. Bu zirveler arasında hepimiz için ayrı bir anlam taşıyan COP31 için hepimiz heyecanlıyız.",
  ],
} as const;

export const baskanMesaji = {
  name: "Av. Yusuf İbiş",
  role: "AK Parti Gençlik Kolları Başkanı",
  paragraphs: [
    "\"Ortak evimiz dünyamız\" diyerek iklim değişikliğiyle mücadelede gençlerin sorumluluğunu ve iradesini ortaya koyuyoruz. Çünkü bugün doğa için attığımız her adım, yarın çocuklarımıza ve gelecek nesillere bırakacağımız dünyanın niteliğini belirliyor.",
    "AK Gençlik olarak daha yaşanabilir, daha temiz ve sürdürülebilir bir gelecek için üzerimize düşen sorumluluğu yerine getirmek adına var gücümüzle çalışıyoruz. Gençlerin enerjisini, fikirlerini ve çözüm üretme gücünü ortak bir hedefte buluşturarak dünyamıza hep birlikte sahip çıkacağımıza bir kez daha söz veriyoruz.",
  ],
} as const;

export const bizKimiz = {
  title: "Biz Kimiz?",
  paragraphs: [
    "AK Parti Gençlik Kolları, 81 ilde teşkilatlanmış, gençlerin siyasete ve toplumsal çalışmalara katılımını esas alan AK Parti gençlik yapılanmasıdır.",
    "Bizler, Adalet ve Kalkınma Partisinin gençlik kolları olarak Türkiye'nin 81 ilinde ve 922 ilçesinde faaliyet gösteren; gençlerle yüz yüze iletişim kuran, fikirlerini dinleyen, ortak programlar üreten ve yerel çalışmalarını ülke çapındaki tüm gençlerle buluşturan bir teşkilatlanmayız. Genel Merkez, il ve ilçe kademeleri sayesinde yalnızca büyük şehirlerde değil, farklı coğrafyalarda, üniversite çevrelerinde ve yerel yaşamın içinde düzenli temas kurabiliyoruz.",
    "Genel Başkanımız ve Cumhurbaşkanımız Sayın Recep Tayyip Erdoğan'ın öncülüğünde gençler; karar alma süreçlerinde etkin rol üstlenen, liderlik eden, projeler geliştiren ve toplumsal meselelere çözüm üreten siyasetin asli aktörleri hâline gelmiştir. Böylece hem bugünün hem de geleceğin söz sahibi, öz güveni yüksek, sorumluluk almaktan çekinmeyen ve kendi istikbaline yön veren bir nesil inşa edilmiştir.",
  ],
} as const;

export const vizyon = {
  title: "Cumhurbaşkanımızın Gençlik Vizyonu",
  intro:
    "Genel Başkanımız ve Cumhurbaşkanımız Sayın Recep Tayyip Erdoğan, gençlik buluşmalarında ve teşkilat eğitimlerinde gençlerle buluşarak her fırsatta gençliğe verdiği değerin altını çizmektedir. Gençliğin siyasi temsil alanının genişletilmesi de bu yaklaşımın öne çıkan başlıklarındandır.",
  items: [
    {
      title: "Toplumu Güçlendirme ve Demokratik Liderlik",
      text: "Sayın Cumhurbaşkanımız Recep Tayyip Erdoğan'ın liderliğinde partimiz; gençlerin toplumsal yaşama katılımını, liderlik ve iletişim becerilerini geliştirmelerini ve karar alma süreçlerini şekillendirmelerini desteklemektedir.",
    },
    {
      title: "2017 Seçilme Yaşı Reformu",
      text: "Partimizin girişimleriyle 2017 yılında atılan tarihi adımla seçilme yaşı 18'e indirilmiştir.",
    },
    {
      title: "TBMM'de Gençlerin Sesi",
      text: "Bu anlayışın sonucu olarak, son genel seçimlerde TBMM'deki 30 yaş altı 5 milletvekilinden 4'ü partimiz listelerinden seçilmiş; gençlerin karar mekanizmalarındaki etkinliği bir kez daha kanıtlanmıştır.",
    },
  ],
} as const;

export const bulusmalar = {
  title: "Gençlik Buluşmaları",
  paragraphs: [
    "Gençlik buluşmaları çalışmalarımızın en görünür ve süreklilik taşıyan alanlarından biridir. \"Gençlik Buluşmaları\" başlığı altında düzenlenen programlar, gençlerin farklı şehirlerde doğrudan muhataplarla bir araya gelmesi için buluşma ortamları oluşturur.",
    "Cumhurbaşkanımız Sayın Recep Tayyip Erdoğan'ın gençlerle buluşmalarının teşkilat tarihinde ayrı bir yeri vardır.",
    "Cumhurbaşkanımız, ülkemizin siyasi, ekonomik, sosyal ve kültürel politikaları başta olmak üzere pek çok alanda gençlerle istişare etmeye, onların fikir ve önerilerini dinlemeye, beklentilerini doğrudan kendilerinden öğrenmeye büyük önem vermektedir.",
    "Bu yaklaşım doğrultusunda, son 5 yılda Cumhurbaşkanımızın katılımıyla 50'den fazla gençlik buluşması gerçekleştirilmiştir. Bu buluşmalar, gençlerin görüş ve önerilerini doğrudan Cumhurbaşkanımıza iletebildiği, ülke gündemine ilişkin düşüncelerini paylaşabildiği ve karar alma süreçlerine katkı sunabildiği önemli buluşma programları olmuştur.",
    "Söz konusu programların ortak yönü, soruların, görüşlerin ve yerel gündemlerin konuşulabildiği bir ortam sağlamayı hedeflemesidir. Bir ilçede küçük ölçekli bir sohbet, başka bir şehirde daha geniş katılımlı bir buluşma düzenlenebilmesi, teşkilatımızın farklı kitlelerle çalışabilen yapısını ortaya koymaktadır.",
  ],
} as const;

export const solenler = {
  title: "Gençlik Şölenleri",
  paragraphs: [
    "16 Mayıs 2026 tarihinde Kocaeli Stadyumu'nda düzenlenen \"Bir Gençlik Şöleni\", Cumhurbaşkanımız ve Genel Başkanımız Sayın Recep Tayyip Erdoğan ile 100 binden fazla genci bir araya getirmiştir.",
    "Bu buluşma, AK Gençlik'in gençlerle kurduğu güçlü bağın, ortak hedefler etrafında kenetlenme iradesinin ve teşkilatımızın geniş kitlelere ulaşma kapasitesinin önemli bir göstergesi olmuştur.",
    "Bir Gençlik Şöleni, gençlerin ortak heyecanını, aidiyet duygusunu ve Türkiye'nin geleceğine ilişkin beklentilerini aynı zeminde buluşturan bir gençlik hareketinin yansımasıdır. Teşkilatımız, gençlerin enerjisini ortak bir ideale dönüştürerek farklı şehirlerden ve farklı hayat tecrübelerinden gelen gençleri aynı hedef etrafında buluşturmayı sürdürmektedir.",
  ],
} as const;

export const kapanis = {
  title: "Kapanış Konuşması",
  paragraphs: [
    "AK Parti Gençlik Kolları olarak gençlerin siyasette, toplumsal hayatta ve ülkemizin geleceğine yön veren süreçlerde aktif rol üstlenmesini önemsiyoruz. Gençlerin fikirlerini özgürce ifade edebildiği, sorumluluk alabildiği ve ülkesine dair hedeflerini hayata geçirebildiği bir siyaset anlayışını benimsiyoruz. Bu anlayışın hem ülkemizde hem de dünyanın farklı ülkelerinde gençler arasında da karşılık bulmasını; tecrübelerimizin, ortak değerlerimizin ve gençliğe dair hedeflerimizin uluslararası düzeyde paylaşılmasını kıymetli buluyoruz.",
  ],
} as const;

/** Broşürde bu bölümün metni yok (fotoğraf sayfası); fotoğraf altı/kısa satırlar. */
export const iklim = {
  title: "İklim Eylemleri",
  items: [
    "Üsküdar Gençlik Kolları Hatıra Ormanı — 300 fidan (2025)",
    "Genç İklim: İklim Liderliği ve Okuryazarlığı Kampı — 21-23 Ağustos 2026, İstanbul",
    "Fidan dikimi ve orman temizliği etkinlikleri",
  ],
} as const;

export const backCover = {
  quote: "\"AK Parti Her Anında Hep Yanında\"",
  line1: "COP31 Türkiye",
  line2: "Bugünü ve Geleceği Birlikte Şekillendiriyoruz",
  social: {
    handle: "akgenclikgm",
    site: "akgenclik.org.tr",
  },
} as const;

export const cop31 = {
  dates: "9–20 Kasım 2026",
  city: "Antalya",
  venue: "Antalya Expo",
  startIso: "2026-11-09T09:00:00+03:00",
} as const;

export type Social = {
  readonly name: "X" | "Instagram" | "Facebook" | "TikTok" | "Web";
  readonly label: string;
  readonly href: string;
};

export const socials: readonly Social[] = [
  { name: "X", label: "@akgenclikgm", href: "https://x.com/akgenclikgm" },
  { name: "Instagram", label: "@akgenclikgm", href: "https://instagram.com/akgenclikgm" },
  { name: "Facebook", label: "akgenclikgm", href: "https://facebook.com/akgenclikgm" },
  { name: "TikTok", label: "@akgenclikgm", href: "https://tiktok.com/@akgenclikgm" },
  { name: "Web", label: "akgenclik.org.tr", href: "https://akgenclik.org.tr" },
] as const;

/**
 * Broşürdeki sayılar (brief §2.6) tek yerde; metinlerle tutarlı kalmak için
 * sayaç/işaretçi gibi yerlerde bunları kullanın.
 */
export const facts = {
  members: 1000000,
  provinces: 81,
  districts: 922,
  meetings: 50,
  meetingsYears: 5,
  solenAttendees: 100000,
  solenDate: "16 Mayıs 2026",
  solenPlace: "Kocaeli Stadyumu",
  saplings: 300,
  saplingsYear: 2025,
  electionAgeYear: 2017,
  electionAge: 18,
  youngMps: 5,
  youngMpsOurs: 4,
  youngMpsAgeLimit: 30,
} as const;

/** Tüm bölümler tek objede. */
export const content = {
  cover,
  stats,
  genclikKollari,
  baskanMesaji,
  bizKimiz,
  vizyon,
  bulusmalar,
  solenler,
  kapanis,
  iklim,
  backCover,
  cop31,
  socials,
  facts,
} as const;

export default content;
