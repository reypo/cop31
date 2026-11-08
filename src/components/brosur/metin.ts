/**
 * Dijital broşür sayfa metinleri (Text / Metin paneli ve ekran okuyucu metni). Kaynak: müşterinin görüntüleyicisindeki
 * `PAGES` dizisi (COP31_Brosur_EN.html / _TR.html, 7 Kasım 2026). ÜRETİLMİŞ DOSYA: scripts/brosur/metin-aktar.py —
 * elle düzenleme yapma, betiği yeniden çalıştır.
 */
import type { Dil } from "@/lib/dil";

/** baslik: sayfa başlığı · etiket: üst etiket (ör. "Meeting 1") · ara: ara başlık · p: paragraf · liste: madde listesi ·
 * icindekiler: İçindekiler sayfasının bölüm listesi (p = hedef sayfa). */
export type Blok =
  | { t: "baslik" | "etiket" | "ara" | "p"; m: string }
  | { t: "liste"; m: readonly string[] }
  | { t: "icindekiler"; m: readonly { p: number; bolum: string; ad: string }[] };

export type SayfaMetni = { ad: string; bolum: number | null; bloklar: readonly Blok[] };

export const METIN: Record<Dil, readonly SayfaMetni[]> = {
  en: [
    // 1
    { ad: "Cover", bolum: null, bloklar: [
      { t: "baslik", m: "1 MILLION YOUTH, ONE COMMON HOME" },
    ] },
    // 2
    { ad: "Contents", bolum: null, bloklar: [
      { t: "icindekiler", m: [{ p: 3, bolum: "MESSAGE", ad: "Message" }, { p: 4, bolum: "SECTION 01", ad: "AK Youth in Numbers" }, { p: 6, bolum: "SECTION 02", ad: "Youth at the Decision-Making Table" }, { p: 8, bolum: "SECTION 03", ad: "On the Ground for the Climate" }, { p: 12, bolum: "SECTION 04", ad: "Leadership School" }, { p: 14, bolum: "SECTION 05", ad: "ÜniAK: Campus Line" }, { p: 16, bolum: "SECTION 06", ad: "Politics That Listens" }, { p: 17, bolum: "SECTION 07", ad: "Youth Festival" }, { p: 18, bolum: "SECTION 08", ad: "Great Türkiye’s Great Works" }, { p: 20, bolum: "SECTION 09", ad: "Bridge to the World" }, { p: 21, bolum: "SECTION 10", ad: "Our COP31 Commitments" }, { p: 24, bolum: "CLOSING", ad: "Closing" }] },
    ] },
    // 3
    { ad: "Message", bolum: null, bloklar: [
      { t: "etiket", m: "AK PARTY | YOUTH BRANCHES" },
      { t: "baslik", m: "1 MILLION YOUTH, ONE COMMON HOME" },
      { t: "p", m: "With more than one million members, AK Party Youth Branches is the largest youth movement in Türkiye and the world. Guided by our motto “By Your Side, Every Moment,” we are a great organization that is present in every area of our young people’s lives and shares in their dreams." },
      { t: "p", m: "Under the leadership of our President, Recep Tayyip Erdoğan, we are setting the seal of youth on our era as a self-confident generation that guides our country’s present and shapes its future. Under the pioneering leadership of our global leader, President Recep Tayyip Erdoğan, our country is hosting three major international summits this year: the NATO Summit, the Organization of Turkic States (OTS) Summit and COP31. Among these summits, we are especially excited about COP31, which holds a special meaning for all of us." },
      { t: "p", m: "Declaring “Our world is our common home,” we show young people’s responsibility and determination in the fight against climate change. Because every step we take for nature today determines the quality of the world we will leave to our children and future generations tomorrow." },
      { t: "ara", m: "Atty. Yusuf İBİŞ" },
      { t: "etiket", m: "Chairman, AK Party Youth Branches" },
    ] },
    // 4
    { ad: "AK Youth in Numbers", bolum: 1, bloklar: [
      { t: "baslik", m: "AK Youth in Numbers" },
      { t: "liste", m: ["The largest youth movement in Türkiye and the world, with more than 1 million members", "A strong organizational network in 81 provinces, 922 districts and every neighborhood"] },
    ] },
    // 5
    { ad: "AK Youth in Numbers", bolum: 1, bloklar: [
      { t: "liste", m: ["Active youth on campuses through ÜniAK clubs at 208 universities", "Special programs and activities for 6.5 million young first-time voters", "Fieldwork and youth programs reaching more than 5 million young people in one year", "More than 10 million young people who have passed through the AK Youth school since its founding", "13 projects carried out simultaneously in 81 provinces and 922 districts", "250,000 saplings planted in one year by AK Youth"] },
    ] },
    // 6
    { ad: "Youth at the Decision-Making Table", bolum: 2, bloklar: [
      { t: "baslik", m: "Youth at the Decision-Making Table" },
      { t: "p", m: "Our Chairman and President, Recep Tayyip Erdoğan, sees youth as the greatest force shaping Türkiye’s present and future, and shows his trust in young people at every opportunity. One of the most concrete steps of this vision, which enables young people to play a more active role in politics and public life, was lowering the minimum age to run for office to 18 in 2017." },
      { t: "p", m: "By giving young people responsibility in Parliament, as Deputy Chairs of our party, in municipalities and at every level of our organization, our President has made youth an active agent of politics and brought them to the center of decision-making. Strong indicators of this approach:" },
    ] },
    // 7
    { ad: "Youth at the Decision-Making Table", bolum: 2, bloklar: [
      { t: "liste", m: ["Of the 5 MPs under the age of 30 who entered the Grand National Assembly of Türkiye in the last general election, 4 were elected from our party.", "More than 700 young people serve as our members on municipal councils."] },
      { t: "p", m: "The youth raised with this understanding are a generation of self-confidence: they trust their ideas, stand behind their ambitions and do not shy away from taking responsibility." },
      { t: "p", m: "This vision is the most precious legacy of a strong leadership approach that trusts young people and helps them believe in their own potential." },
    ] },
    // 8
    { ad: "On the Ground for the Climate", bolum: 3, bloklar: [
      { t: "baslik", m: "On the Ground for the Climate" },
      { t: "p", m: "AK Youth is on the ground for a greener Türkiye and a more livable future…" },
    ] },
    // 9
    { ad: "On the Ground for the Climate", bolum: 3, bloklar: [
      { t: "liste", m: ["In one year, we planted 250,000 saplings with more than 10,000 young people in 60 provinces.", "Over the past year, we established AK Youth Memorial Forests in 9 provinces."] },
    ] },
    // 10
    { ad: "On the Ground for the Climate", bolum: 3, bloklar: [
      { t: "liste", m: ["With thousands of young volunteers, we carry out regular nature clean-ups in 81 provinces and 922 districts.", "In support of the Zero Waste Project, we run training programs that raise awareness across our organization.", "We create educational games that build environmental awareness among young people and help them become more conscious of the issue."] },
    ] },
    // 11
    { ad: "On the Ground for the Climate", bolum: 3, bloklar: [
      { t: "liste", m: ["Through our ÜniAK clubs at 208 universities, we support sustainable environmental projects on campuses.", "When natural disasters such as wildfires, floods and earthquakes strike our country, we rush to help our citizens. With 20,000 young volunteers from our 81 provinces, we take an active role in disaster zones and carry the spirit of solidarity and mutual aid into the field."] },
      { t: "p", m: "We will continue to see protecting nature as a responsibility, and leaving a more livable world to future generations as a cause." },
    ] },
    // 12
    { ad: "Leadership School", bolum: 4, bloklar: [
      { t: "baslik", m: "Leadership School" },
    ] },
    // 13
    { ad: "Leadership School", bolum: 4, bloklar: [
      { t: "p", m: "We are a great school of youth that turns young people’s enthusiasm, dynamism and self-confidence into organizational strength. We raise faithful, patriotic and well-equipped cadres who understand their history and read the world well." },
      { t: "p", m: "Through the Organization Academies and camps we hold every year in our 81 provinces, our in-house training programs, attended by approximately 35,000 members of our organization, provide more than 60 hours of training per person." },
      { t: "liste", m: ["Politics and Leadership", "Organizational Management", "Communication and Rhetoric", "Current Political Developments", "Türkiye and World Affairs"] },
      { t: "p", m: "In our trainings, designed around a 360-degree stage concept, we bring our young people together with AK Party Deputy Chairs, ministers, and expert journalists and academics, creating a learning environment based on direct communication, mutual interaction and consultation. By enriching our trainings with social and cultural activities, we make the learning process more enjoyable and productive." },
      { t: "p", m: "Since our founding, more than 10 million young people have passed through AK Youth, as through a school." },
    ] },
    // 14
    { ad: "ÜniAK: Campus Line", bolum: 5, bloklar: [
      { t: "baslik", m: "ÜniAK: Campus Line" },
      { t: "p", m: "AK Youth has a strong organizational structure that reaches university students through ÜniAK clubs at 208 universities. We see it as a fundamental responsibility to stand by our young people and walk alongside them from their first day at university until graduation." },
      { t: "p", m: "With our Welcome to Campus – First Stop ÜniAK stands, we welcome young people stepping into university, and we strengthen our bonds through trainings, academic work and social activities. In lecture halls, in cafeterias, in every corner of campus, we touch the lives of our young people. During midterm and final exam weeks, we boost their motivation." },
    ] },
    // 15
    { ad: "ÜniAK: Campus Line", bolum: 5, bloklar: [
      { t: "liste", m: ["Over the past year, more than 450,000 university students joined us through the Welcome to Campus – First Stop ÜniAK event.", "Over the past year, our ÜniAK clubs organized more than 1,000 diverse local events every month, including activities for special days and weeks.", "Last Ramadan, more than 500,000 young people came together at campus iftars.", "Over the past year, our trip programs enabled more than 250,000 young people to visit a city other than the one where they study.", "Through ÜNİDES (University Student Societies Cooperation and Support Program), our young people have launched more than 200 projects, raising social awareness and contributing to work that benefits society."] },
      { t: "p", m: "ÜniAK brings together the ideas, enthusiasm and potential of university students on common ground; it is AK Youth’s strong voice and companion on campuses." },
    ] },
    // 16
    { ad: "Politics That Listens", bolum: 6, bloklar: [
      { t: "baslik", m: "Politics That Listens" },
      { t: "p", m: "As AK Youth, we strengthen our heartfelt bond with young people and bring their ideas to the center of politics." },
      { t: "liste", m: ["In the last 5 years, we have held more than 30 Youth Meetings attended by our President.", "Through our Söz Gençlikte (“Youth Has the Floor”) and Mahallede GençİZ (“We Are Young in the Neighborhood”) programs, we reached more than 400,000 young people over the past year."] },
      { t: "p", m: "Meeting young people in 81 provinces, 922 districts and every neighborhood, we carry out our neighborhood work as a grassroots dialogue model." },
    ] },
    // 17
    { ad: "Youth Festival", bolum: 7, bloklar: [
      { t: "baslik", m: "Youth Festival" },
      { t: "p", m: "In our 25-year AK Youth history, we have brought hundreds of thousands of young people together around the same excitement and a shared ideal through 14 Youth Festivals held in stadiums. At our festival in Kocaeli on May 16, 2026, we held an unforgettable gathering with more than 100,000 young people, attended by our President, Recep Tayyip Erdoğan." },
      { t: "p", m: "We continue to keep our youth festivals alive as an AK Youth tradition." },
    ] },
    // 18
    { ad: "Great Türkiye’s Great Works", bolum: 8, bloklar: [
      { t: "baslik", m: "Great Türkiye’s Great Works" },
      { t: "p", m: "From airports to bridges, city hospitals to the defense industry, and energy investments to domestic technology breakthroughs, countless works realized during the AK Party era have shaped Türkiye’s journey of development." },
      { t: "p", m: "Through our project Youth Meet the Works – Great Türkiye’s Great Works, we at AK Youth bring this vision together with university students studying in the related fields and tell the story of each work on site." },
    ] },
    // 19
    { ad: "Great Türkiye’s Great Works", bolum: 8, bloklar: [
      { t: "etiket", m: "Meeting 1" },
      { t: "ara", m: "GABAR" },
      { t: "p", m: "With our Minister of Energy and Natural Resources, Alparslan Bayraktar, we explored Türkiye’s journey toward energy independence at the Şehit Esma Çevik Field." },
      { t: "etiket", m: "Meeting 2" },
      { t: "ara", m: "TOGG" },
      { t: "p", m: "With our Minister of Industry and Technology, Mehmet Fatih Kacır, we witnessed up close the production of our domestic and national car and the National Technology Move at the Gemlik Campus." },
      { t: "etiket", m: "Meeting 3" },
      { t: "ara", m: "HATAY" },
      { t: "p", m: "With our Minister of Environment, Urbanization and Climate Change, Murat Kurum, we saw the Construction of the Century on site and witnessed the rebirth of Hatay, rising again after the earthquake." },
      { t: "p", m: "Every work carries the mark of a vision, every meeting the trace of an inspiration. We will continue to explore these great works with our young people and to bring the engineers, architects and technology pioneers of the future together with Türkiye’s success stories." },
    ] },
    // 20
    { ad: "Bridge to the World", bolum: 9, bloklar: [
      { t: "baslik", m: "Bridge to the World" },
      { t: "p", m: "As AK Youth, we play an active role on the international stage and build strong ties with the world’s youth. We are developing our relations with youth organizations in countries around the world, above all the youth organizations of the Turkic states, and strengthening our cooperation through mutual visits, international delegation programs and joint projects. We are growing solidarity among young people and carrying Türkiye’s youth vision to the world." },
    ] },
    // 21
    { ad: "Our COP31 Commitments", bolum: 10, bloklar: [
      { t: "baslik", m: "Our COP31 Commitments" },
      { t: "p", m: "As AK Youth, we are mobilizing the power of youth against the climate crisis and making a promise to the future with measurable targets." },
    ] },
    // 22
    { ad: "Our COP31 Commitments", bolum: 10, bloklar: [
      { t: "ara", m: "1 SAPLING PER MEMBER – 1 MILLION SAPLINGS:" },
      { t: "p", m: "By the end of 2027, we aim to plant 1 million saplings, one for each of our members." },
    ] },
    // 23
    { ad: "Our COP31 Commitments", bolum: 10, bloklar: [
      { t: "ara", m: "100,000 YOUNG PEOPLE:" },
      { t: "p", m: "By the end of 2027, we aim to provide climate literacy training to 100,000 young people." },
      { t: "ara", m: "208 CAMPUSES – 208 ZERO WASTE POINTS:" },
      { t: "p", m: "By the end of 2027, together with our ÜniAK clubs, we aim to set up a zero waste point and a recycling team at each of 208 universities." },
      { t: "ara", m: "10,000 ENVIRONMENTAL EVENTS IN 81 PROVINCES – 922 DISTRICTS:" },
      { t: "p", m: "By the end of 2027, we aim to hold 10,000 nature clean-ups and environmental events nationwide." },
      { t: "ara", m: "25,000 CLIMATE VOLUNTEERS:" },
      { t: "p", m: "By the end of 2027, we aim to grow our network of young climate volunteers to 25,000." },
      { t: "p", m: "For a greener Türkiye and a more livable world, we give our word!" },
    ] },
    // 24
    { ad: "Closing", bolum: null, bloklar: [
      { t: "baslik", m: "Wherever youth are, AK Youth is there." },
      { t: "p", m: "Beyond the work described so far, we come together with young people in every area of life: from concept programs in our provinces to iftar and suhoor tables on every day of Ramadan, and from the youth festivals we hold throughout the summer to countless other gatherings." },
      { t: "p", m: "We work to raise a self-confident generation that will carry into the future the ideal of a great Türkiye set out by our Chairman and President, Recep Tayyip Erdoğan, and that will lay in place the cornerstone of a cause as vast as the Anatolian continent." },
    ] },
    // 25
    { ad: "Closing", bolum: null, bloklar: [
      { t: "p", m: "With our motto “By Your Side, Every Moment,” we accompany young people in their present and become a source of hope for their future; we work for our country, our youth, our present and our future." },
      { t: "p", m: "AK Youth will continue to be a movement that grows together with Türkiye’s youth and builds the present and the future with the energy of youth." },
    ] },
    // 26
    { ad: "Back Cover", bolum: null, bloklar: [
      { t: "baslik", m: "By Your Side, Every Moment" },
    ] },
  ],
  tr: [
    // 1
    { ad: "Kapak", bolum: null, bloklar: [
      { t: "baslik", m: "1 MİLYON GENÇ, TEK ORTAK EV" },
    ] },
    // 2
    { ad: "İçindekiler", bolum: null, bloklar: [
      { t: "icindekiler", m: [{ p: 3, bolum: "MESAJ", ad: "Mesaj" }, { p: 4, bolum: "BÖLÜM 01", ad: "Sayılarla AK Gençlik" }, { p: 6, bolum: "BÖLÜM 02", ad: "Gençlik Karar Masasında" }, { p: 8, bolum: "BÖLÜM 03", ad: "İklim İçin Sahadayız" }, { p: 12, bolum: "BÖLÜM 04", ad: "Liderlik Okulu" }, { p: 14, bolum: "BÖLÜM 05", ad: "ÜniAK: Kampüs Hattı" }, { p: 16, bolum: "BÖLÜM 06", ad: "Dinleyen Siyaset" }, { p: 17, bolum: "BÖLÜM 07", ad: "Gençlik Şöleni" }, { p: 18, bolum: "BÖLÜM 08", ad: "Büyük Türkiye’nin Büyük Eserleri" }, { p: 20, bolum: "BÖLÜM 09", ad: "Dünyayla Köprü" }, { p: 21, bolum: "BÖLÜM 10", ad: "COP31 Taahhütlerimiz" }, { p: 24, bolum: "KAPANIŞ", ad: "Kapanış" }] },
    ] },
    // 3
    { ad: "Mesaj", bolum: null, bloklar: [
      { t: "etiket", m: "AK PARTİ | GENÇLİK KOLLARI" },
      { t: "baslik", m: "1 MİLYON GENÇ, TEK ORTAK EV" },
      { t: "p", m: "AK Parti Gençlik Kolları, bir milyonu aşkın üyesiyle Türkiye’nin ve dünyanın en büyük gençlik hareketidir. Bizler, “Her Anında Hep Yanında” anlayışıyla gençlerimizin hayatının her alanında varlık gösteren ve onların hayallerine ortak olan büyük bir teşkilatız." },
      { t: "p", m: "Cumhurbaşkanımız Sayın Recep Tayyip Erdoğan’ın liderliğinde, ülkemizin bugününe yön veren ve yarınlarını şekillendiren öz güvenli bir nesil olarak gençlik mührümüzü çağımıza vuruyoruz. Küresel liderimiz Cumhurbaşkanımız Sayın Recep Tayyip Erdoğan’ın öncülüğünde ülkemiz, bu yıl NATO Zirvesi, Türk Devletleri Teşkilatı (TDT) Zirvesi ve COP31 olmak üzere üç önemli uluslararası zirveye ev sahipliği yapıyor. Bu zirveler arasında hepimiz için ayrı bir anlam taşıyan COP31 için heyecanlıyız." },
      { t: "p", m: "“Ortak evimiz dünyamız” diyerek iklim değişikliğiyle mücadelede gençlerin sorumluluğunu ve iradesini ortaya koyuyoruz. Çünkü bugün doğa için attığımız her adım, yarın çocuklarımıza ve gelecek nesillere bırakacağımız dünyanın niteliğini belirliyor." },
      { t: "ara", m: "Av. Yusuf İBİŞ" },
      { t: "etiket", m: "AK Parti Gençlik Kolları Başkanı" },
    ] },
    // 4
    { ad: "Sayılarla AK Gençlik", bolum: 1, bloklar: [
      { t: "baslik", m: "Sayılarla AK Gençlik" },
      { t: "liste", m: ["1 milyonu aşkın üye ile Türkiye’nin ve dünyanın en büyük gençlik hareketi", "81 il, 922 ilçe ve her mahallede güçlü teşkilat ağı"] },
    ] },
    // 5
    { ad: "Sayılarla AK Gençlik", bolum: 1, bloklar: [
      { t: "liste", m: ["208 üniversitede ÜniAK kulüpleri ile kampüslerde etkin gençlik", "6,5 milyon ilk defa oy kullanacak gence yönelik özel program ve çalışmalar", "Bir yılda 5 milyondan fazla gence ulaşan saha çalışmaları ve gençlik programları", "Kuruluşundan bugüne AK Gençlik okulundan geçen 10 milyonu aşkın genç", "81 il ve 922 ilçede eş zamanlı yürütülen 13 proje", "AK Gençlik olarak bir yılda doğayla buluşturulan 250 bin fidan"] },
    ] },
    // 6
    { ad: "Gençlik Karar Masasında", bolum: 2, bloklar: [
      { t: "baslik", m: "Gençlik Karar Masasında" },
      { t: "p", m: "Genel Başkanımız ve Cumhurbaşkanımız Sayın Recep Tayyip Erdoğan, gençliği Türkiye’nin bugününü ve geleceğini şekillendiren en büyük güç olarak görmekte ve her fırsatta gençlere duyduğu güveni ortaya koymaktadır. Gençlerin siyasette ve toplumsal hayatta daha etkin rol üstlenmesini sağlayan bu vizyonun en somut adımlarından biri, 2017 yılında seçilme yaşının 18’e indirilmesi olmuştur." },
      { t: "p", m: "Gençlere Mecliste, Genel Başkan Yardımcılıklarında, belediyelerde ve teşkilatlarımızın her kademesinde sorumluluk veren Cumhurbaşkanımız, gençliği siyasetin öznesi haline getirmiş, karar alma mekanizmalarının merkezine taşımıştır. Bu yaklaşımın güçlü göstergeleri:" },
    ] },
    // 7
    { ad: "Gençlik Karar Masasında", bolum: 2, bloklar: [
      { t: "liste", m: ["Son genel seçimlerde TBMM’ye giren 30 yaş altı 5 milletvekilinin 4’ü partimizden seçildi.", "Belediye meclislerinde 700’ü aşkın genç, belediye meclis üyemiz olarak görev yapıyor."] },
      { t: "p", m: "Bu anlayışla yetişen gençlik; fikirlerine güvenen, iddiasını ortaya koyan, sorumluluk almaktan çekinmeyen bir öz güven neslidir." },
      { t: "p", m: "Bu vizyon, gençlere güven duyan ve gençlerin kendi potansiyellerine inanmasını sağlayan güçlü bir liderlik anlayışının en kıymetli mirasıdır." },
    ] },
    // 8
    { ad: "İklim İçin Sahadayız", bolum: 3, bloklar: [
      { t: "baslik", m: "İklim İçin Sahadayız" },
      { t: "p", m: "AK Gençlik, daha yeşil bir Türkiye ve daha yaşanabilir bir gelecek için sahada…" },
    ] },
    // 9
    { ad: "İklim İçin Sahadayız", bolum: 3, bloklar: [
      { t: "liste", m: ["Bir yılda 60 ilde 10.000’den fazla gençle 250 bin fidanı toprakla buluşturduk.", "Son bir yılda 9 ilimizde AK Gençlik Hatıra Ormanı kurduk."] },
    ] },
    // 10
    { ad: "İklim İçin Sahadayız", bolum: 3, bloklar: [
      { t: "liste", m: ["Binlerce gönüllü gençle, 81 il ve 922 ilçemizde düzenli doğa temizliği faaliyetleri gerçekleştiriyoruz.", "Sıfır Atık Projesi’ne destek kapsamında teşkilatlarımızı bilinçlendiren eğitim çalışmaları yürütüyoruz.", "Gençlerde çevre bilinci oluşturacak eğitici oyunlar hazırlayarak bu konuda bilinçlenmelerini sağlıyoruz."] },
    ] },
    // 11
    { ad: "İklim İçin Sahadayız", bolum: 3, bloklar: [
      { t: "liste", m: ["208 üniversitedeki ÜniAK kulüplerimizle kampüslerde sürdürülebilir çevre projelerini destekliyoruz.", "Ülkemizde meydana gelen yangın, sel ve deprem gibi doğal afetlerde vatandaşlarımızın yardımına koşuyor, 81 ilimizden 20 bin gönüllü genç arkadaşımızla afet bölgelerinde aktif görev alarak dayanışma ve yardımlaşma ruhunu sahaya yansıtıyoruz."] },
      { t: "p", m: "Doğayı korumayı bir sorumluluk, gelecek nesillere daha yaşanabilir bir dünya bırakmayı bir dava olarak görmeye devam edeceğiz." },
    ] },
    // 12
    { ad: "Liderlik Okulu", bolum: 4, bloklar: [
      { t: "baslik", m: "Liderlik Okulu" },
    ] },
    // 13
    { ad: "Liderlik Okulu", bolum: 4, bloklar: [
      { t: "p", m: "Biz, gençlerin heyecanını, dinamizmini ve öz güvenini teşkilat gücüne dönüştüren büyük bir gençlik okuluyuz. Tarihini idrak eden, dünyayı iyi okuyan, imanlı, vatansever ve donanımlı kadrolar yetiştiriyoruz." },
      { t: "p", m: "Her yıl 81 ilimizde düzenlediğimiz Teşkilat Akademileri ve kamplarımız aracılığıyla, yaklaşık 35 bin teşkilat mensubumuzun katılımıyla gerçekleştirdiğimiz teşkilat içi eğitim programlarımız kapsamında kişi başı 60 saati aşkın eğitim veriyoruz." },
      { t: "liste", m: ["Siyaset ve Liderlik", "Teşkilat Yönetimi", "İletişim ve Hitabet", "Güncel Siyasi Gelişmeler", "Türkiye ve Dünya Gündemi"] },
      { t: "p", m: "360 derece sahne konseptiyle gerçekleştirdiğimiz eğitimlerde; AK Parti Genel Başkan Yardımcılarımızı, bakanlarımızı, alanında uzman gazetecileri ve akademisyenleri gençlerimizle buluşturuyor; doğrudan iletişim, karşılıklı etkileşim ve istişareye dayalı bir eğitim ortamı oluşturuyoruz. Eğitimlerimizi sosyal ve kültürel etkinliklerle zenginleştirerek öğrenme sürecimizi daha keyifli ve verimli hale getiriyoruz." },
      { t: "p", m: "Kuruluşumuzdan bugüne 10 milyonu aşkın genç, bir okul gibi AK Gençlik’ten geçti." },
    ] },
    // 14
    { ad: "ÜniAK: Kampüs Hattı", bolum: 5, bloklar: [
      { t: "baslik", m: "ÜniAK: Kampüs Hattı" },
      { t: "p", m: "AK Gençlik, 208 üniversitede ÜniAK kulüpleriyle üniversiteli gençlerle buluşan güçlü bir teşkilat yapısına sahiptir. Üniversite hayatının ilk gününden mezuniyetine kadar gençlerimizin yanında olmayı, onlara yol arkadaşlığı yapmayı temel bir sorumluluk olarak görüyoruz." },
      { t: "p", m: "Kampüse Hoş Geldin - İlk Durak ÜniAK stantlarımızla üniversiteye adım atan gençlerimizi karşılıyor; eğitimler, akademik çalışmalar ve sosyal etkinliklerle bağlarımızı güçlendiriyoruz. Amfide, kantinde, kampüsün her noktasında gençlerimizin hayatına dokunuyoruz. Vize ve final haftalarında motivasyonlarını güçlendiriyoruz." },
    ] },
    // 15
    { ad: "ÜniAK: Kampüs Hattı", bolum: 5, bloklar: [
      { t: "liste", m: ["Kampüse Hoş Geldin - İlk Durak ÜniAK etkinliği kapsamında son bir yılda 450 bini aşkın üniversiteli genç aramıza katıldı.", "Son bir yılda ÜniAK kulüplerimiz her ay 1.000’i aşkın farklı ve lokal etkinlik düzenleyerek özel gün ve haftalara yönelik çalışmalar gerçekleştirdi.", "Geçtiğimiz Ramazan ayında 500 bini aşkın genç kampüs iftarlarında buluştu.", "Son bir yıl içerisinde, düzenlediğimiz gezi programları kapsamında 250 bini aşkın gencimizin üniversite öğrenimi gördüğü şehirden farklı bir şehri ziyaret etmesine imkân sağladık.", "Gençlerimiz, ÜNİDES (Üniversite Öğrenci Toplulukları İş Birliği ve Destek Programı) kapsamında 200’ü aşkın proje hayata geçirerek sosyal farkındalığın artırılmasına ve toplumsal fayda üreten çalışmalara katkı sunmuştur."] },
      { t: "p", m: "ÜniAK, üniversiteli gençlerin fikirlerini, heyecanlarını ve potansiyellerini ortak bir zeminde buluşturan; kampüslerde AK Gençlik’in güçlü sesi ve yol arkadaşıdır." },
    ] },
    // 16
    { ad: "Dinleyen Siyaset", bolum: 6, bloklar: [
      { t: "baslik", m: "Dinleyen Siyaset" },
      { t: "p", m: "AK Gençlik olarak gençlerle gönül bağımızı güçlendiriyor, fikirlerini siyasetin merkezine taşıyoruz." },
      { t: "liste", m: ["Son 5 yılda Cumhurbaşkanımızın katılımıyla 30’dan fazla Gençlik Buluşması gerçekleştirdik.", "Söz Gençlikte ve Mahallede GençİZ programlarımızla son bir yılda 400 binden fazla gence ulaştık."] },
      { t: "p", m: "81 il, 922 ilçe ve her mahallede gençlerimizle buluşarak mahalle çalışmalarımızı tabandan diyalog modeli olarak sürdürüyoruz." },
    ] },
    // 17
    { ad: "Gençlik Şöleni", bolum: 7, bloklar: [
      { t: "baslik", m: "Gençlik Şöleni" },
      { t: "p", m: "25 yıllık AK Gençlik tarihimizde stadyumlarda düzenlediğimiz 14 Gençlik Şöleni ile yüz binlerce gencimizi aynı heyecan ve ortak ideal etrafında buluşturduk. 16 Mayıs 2026’da Kocaeli’de düzenlediğimiz şölenimizde 100 bini aşkın gencimizle Cumhurbaşkanımız Sayın Recep Tayyip Erdoğan’ın katılımıyla unutulmaz bir buluşmaya imza attık." },
      { t: "p", m: "Gençlik şölenlerimizi AK Gençlik geleneği olarak yaşatmaya devam ediyoruz." },
    ] },
    // 18
    { ad: "Büyük Türkiye’nin Büyük Eserleri", bolum: 8, bloklar: [
      { t: "baslik", m: "Büyük Türkiye’nin Büyük Eserleri" },
      { t: "p", m: "AK Parti döneminde hayata geçirilen havalimanlarından köprülere, şehir hastanelerinden savunma sanayiine, enerji yatırımlarından yerli teknoloji hamlelerine kadar sayısız eser, Türkiye’nin kalkınma yolculuğuna yön verdi." },
      { t: "p", m: "AK Gençlik olarak bizler, Gençlerle Eser Buluşmaları – Büyük Türkiye’nin Büyük Eserleri projemizle, bu vizyonu o alanda eğitim gören üniversiteli gençlerimizle buluşturuyor; eserlerin hikâyesini yerinde anlatıyoruz." },
    ] },
    // 19
    { ad: "Büyük Türkiye’nin Büyük Eserleri", bolum: 8, bloklar: [
      { t: "etiket", m: "1. Buluşma" },
      { t: "ara", m: "GABAR" },
      { t: "p", m: "Enerji ve Tabii Kaynaklar Bakanımız Sayın Alparslan Bayraktar ile Şehit Esma Çevik Sahası’nda Türkiye’nin enerji bağımsızlığı yolculuğunu keşfettik." },
      { t: "etiket", m: "2. Buluşma" },
      { t: "ara", m: "TOGG" },
      { t: "p", m: "Sanayi ve Teknoloji Bakanımız Sayın Mehmet Fatih Kacır ile Gemlik Kampüsü’nde yerli ve millî otomobilimizin üretimine, Milli Teknoloji Hamlesi’ne yakından tanıklık ettik." },
      { t: "etiket", m: "3. Buluşma" },
      { t: "ara", m: "HATAY" },
      { t: "p", m: "Çevre, Şehircilik ve İklim Değişikliği Bakanımız Sayın Murat Kurum ile Asrın İnşası’nı yerinde gördük; deprem sonrası yeniden ayağa kalkan Hatay’ın yeniden doğuşuna şahit olduk." },
      { t: "p", m: "Her eser bir vizyonun, her buluşma bir ilhamın izini taşıyor. Bizler de bu büyük eserleri gençlerimizle keşfetmeye, geleceğin mühendislerini, mimarlarını ve teknoloji öncülerini Türkiye’nin başarı hikâyeleriyle buluşturmaya devam edeceğiz." },
    ] },
    // 20
    { ad: "Dünyayla Köprü", bolum: 9, bloklar: [
      { t: "baslik", m: "Dünyayla Köprü" },
      { t: "p", m: "AK Gençlik olarak uluslararası alanda aktif rol alıyor, dünya gençliğiyle güçlü bağlar kuruyoruz. Türk devletleri gençlik teşkilatları başta olmak üzere dünyanın farklı ülkelerindeki gençlik örgütleriyle ilişkilerimizi geliştiriyor; karşılıklı ziyaretler, uluslararası heyet programları ve ortak projelerle iş birliklerimizi güçlendiriyoruz. Gençler arasında dayanışmayı büyütüyor, Türkiye’nin gençlik vizyonunu dünyaya taşıyoruz." },
    ] },
    // 21
    { ad: "COP31 Taahhütlerimiz", bolum: 10, bloklar: [
      { t: "baslik", m: "COP31 Taahhütlerimiz" },
      { t: "p", m: "AK Gençlik olarak iklim krizine karşı gençliğin gücünü harekete geçiriyor, ölçülebilir hedeflerle geleceğe söz veriyoruz." },
    ] },
    // 22
    { ad: "COP31 Taahhütlerimiz", bolum: 10, bloklar: [
      { t: "ara", m: "HER ÜYEYE 1 FİDAN – 1 MİLYON FİDAN:" },
      { t: "p", m: "2027 sonuna kadar her üyemiz için bir fidan olmak üzere 1 milyon fidanı toprakla buluşturmayı hedefliyoruz." },
    ] },
    // 23
    { ad: "COP31 Taahhütlerimiz", bolum: 10, bloklar: [
      { t: "ara", m: "100 BİN GENÇ:" },
      { t: "p", m: "2027 sonuna kadar 100 bin gencimize iklim okuryazarlığı eğitimi kazandırmayı hedefliyoruz." },
      { t: "ara", m: "208 KAMPÜS – 208 SIFIR ATIK NOKTASI:" },
      { t: "p", m: "2027 sonuna kadar ÜniAK kulüplerimizle 208 üniversitede birer sıfır atık noktası ve geri dönüşüm ekibi kurmayı hedefliyoruz." },
      { t: "ara", m: "81 İL – 922 İLÇEDE 10.000 ÇEVRE ETKİNLİĞİ:" },
      { t: "p", m: "2027 sonuna kadar ülke genelinde 10.000 doğa temizliği ve çevre etkinliği gerçekleştirmeyi hedefliyoruz." },
      { t: "ara", m: "25 BİN İKLİM GÖNÜLLÜSÜ:" },
      { t: "p", m: "2027 sonuna kadar gençlerden oluşan iklim gönüllüsü ağımızı 25 bine çıkarmayı hedefliyoruz." },
      { t: "p", m: "Daha yeşil bir Türkiye, daha yaşanabilir bir dünya için söz veriyoruz!" },
    ] },
    // 24
    { ad: "Kapanış", bolum: null, bloklar: [
      { t: "baslik", m: "Gençlik nerede ise AK Gençlik oradadır." },
      { t: "p", m: "Buraya kadar ifade ettiğimiz çalışmalarımızın dışında illerimizde düzenlediğimiz konsept programlardan Ramazan’ın her gününde iftar ve sahur sofralarına, yaz boyunca gerçekleştirdiğimiz gençlik festivallerinden sayısız buluşmaya kadar gençlerimizle hayatın her alanında bir araya geliyoruz." },
      { t: "p", m: "Genel Başkanımız ve Cumhurbaşkanımız Sayın Recep Tayyip Erdoğan’ın ortaya koyduğu büyük Türkiye idealini geleceğe taşıyacak, Anadolu kıtası büyüklüğündeki dava taşını yerine koyacak öz güven neslinin yetişmesi için çalışıyoruz." },
    ] },
    // 25
    { ad: "Kapanış", bolum: null, bloklar: [
      { t: "p", m: "“Her Anında Hep Yanında” anlayışıyla gençlerimizin bugününe eşlik ediyor, yarınlarına umut oluyor; ülkemiz, gençliğimiz, bugünümüz ve geleceğimiz için çalışıyoruz." },
      { t: "p", m: "AK Gençlik, Türkiye’nin gençliğiyle birlikte büyüyen, gençliğin enerjisiyle bugünü ve geleceği inşa eden bir hareket olmaya devam edecek." },
    ] },
    // 26
    { ad: "Arka Kapak", bolum: null, bloklar: [
      { t: "baslik", m: "Her Anında Hep Yanında" },
    ] },
  ],
};
