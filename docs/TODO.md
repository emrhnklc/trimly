# Trimly — Yapılacaklar

Bu dosya bütün aktif işlerin tek bakışta takip edildiği listedir. Ayrıntılı ürün kuralları [Ürün Kuralları ve Yol Haritası](product-rules-roadmap.md), geniş ürün kapsamı [Ürün Kaydı](product-spec.md), canlı öncesi kontroller ise [Yayına Hazırlık / Polish Listesi](launch-polish.md) içinde tutulur.

## Kullanım şekli

- `[ ]` başlanmadı
- `[-]` devam ediyor
- `[x]` tamamlandı ve doğrulandı
- Bir iş yalnız ekranı çizildiğinde değil; backend kuralı, mobil davranışı ve gerekli testleri tamamlandığında işaretlenir.

## Ana gidişat yol haritası

Bu sıra takvim tahmini değil, **bağımlılık sırasıdır**. Bir fazın çıkış kapısı geçilmeden sonraki faz ana çalışma hâline getirilmez. Küçük ve bağımsız görsel düzeltmeler arada yapılabilir; fakat yeni büyük özellikler çekirdek randevu akışının önüne geçmez.

| Faz | Hedef | Ana çıktılar | Çıkış kapısı |
| --- | --- | --- | --- |
| **0 — Envanter ve karar kilidi** | Ne çalışıyor, ne eksik ve hangi kural geçerli netleşsin | Ekran/endpoint/veri modeli envanteri, navigasyon matrisi, rol matrisi, karar bekleyen P0 maddeleri | Çelişkili ürün kararı kalmaması ve her P0 işinin test edilebilir kabul kriteri olması |
| **1 — Uygulama kabuğu ve kalite** | Kullanıcı hiçbir ekranda kaybolmasın | Geri dönüşler, tab/stack davranışı, profil değiştirme, ilk açılış tercihi, açık/koyu tema, loading/error/empty durumları | Müşteri ve işletme ana akışlarının gerçek cihazda çökmeden ve yanlış sayfaya atmadan tamamlanması |
| **2 — İşletme kurulumu ve erişim** | Eksik işletme yanlışlıkla yayınlanamasın | Taslak/yayın/randevuya açık durumları, kurulum kontrol listesi, hizmet-çalışan-saat zorunlulukları, rol/davet kontrolleri | Yeni owner sıfırdan işletme kurup kendini bookable yaparak güvenli biçimde yayına alabilmesi |
| **3 — Randevu motoru ve yaşam döngüsü** | Çakışmasız, değiştirilemez geçmiş üreten güvenilir randevu | Availability, timezone, günlük limit, taşıma/iptal teklifi, start/complete/no-show, işletme iptali, audit kayıtları | Oluşturma → değişiklik → varış → tamamlama/iptal/no-show senaryolarının backend E2E testlerinden geçmesi |
| **4 — Tıraş kaydı, fotoğraf ve gizlilik** | Tamamlanan işlemin güvenli ve değiştirilemez geçmişe dönüşmesi | Draft/finalized kayıt, özel fotoğraf, portföy rızası, müşteri fotoğrafı, izin geri çekme | Yetkisiz hiçbir rolün özel fotoğraf/notu görememesi veya finalized kaydı değiştirememesi |
| **5 — Yakınlarım** | Çocuk/kardeş için kuralları delmeden randevu | Yakın profili, “Kimin için?” adımı, katılımcı bazlı günlük sınır, ayrı geçmiş ve veli izinleri | Aynı kişi ikinci randevuyu alamazken hesap sahibinin farklı yakını için güvenli rezervasyon yapabilmesi |
| **6 — Berber/çalışan profili** | Müşteri işletme içindeki doğru çalışanı seçebilsin | Public çalışan özeti, puan/işlem sayısı, hizmetler, portföy, yorumlar, seçili çalışanla booking | İşletme → çalışan profili → seçili çalışanla uygun saat akışının uçtan uca çalışması |
| **7 — Güven, iletişim ve geri kazanım** | Değişiklikler kullanıcıya ulaşsın, kötüye kullanım yönetilsin | Push tercihleri, randevu değişiklik bildirimleri, yorum moderasyonu, itirazlar, spam/risk kontrolleri | Kritik olayların teslim/okunma kaydı ve itiraz/moderasyon izinin denetlenebilir olması |
| **8 — Production ve kapalı pilot** | Gerçek kullanıcıyla güvenli deneme yapılabilsin | Production storage/SMTP/push, deployment, log/alert, yedek, veri dışa aktarma/silme, hukuki metinler | Küçük pilot grubun temel akışları kritik veri kaybı veya yetki açığı olmadan kullanabilmesi |
| **9 — Yayın ve ölçüm** | Mağaza yayını kontrollü büyüsün | Store hazırlıkları, destek süreci, admin/operasyon araçları, funnel ve güvenilirlik metrikleri | Crash, booking başarı, iptal/no-show ve bildirim metriklerinin izlenmesi; kritik olaylara müdahale sürecinin çalışması |
| **10 — Gelir ve büyüme** | Çekirdek deneyimi bozmadan gelir üretmek | Kapora/ödeme, Plus, sadakat/referral, gelişmiş kampanya ve analytics | İade/itiraz/komisyon kuralları tamamlanmış ve ücretsiz temel randevu deneyimi korunmuş olması |

### Faz 0'da kesinleştirilecek kararlar

- [ ] Geç kalma, gerçek hizmet başlangıcı ve cezasız ayrılma süreleri.
- [ ] `COMPLETED`, `NO_SHOW` ve yanlış durum işaretleme itiraz akışı.
- [ ] Ek hizmet, uzayan süre ve son fiyat için müşteri onayı.
- [ ] Çalışan ayrıldığında veya pasife alındığında gelecek randevular.
- [ ] Fotoğraf rızasının geri çekilmesi ve veri saklama/silme süreleri.
- [ ] Müşteri ve işletme ceza kararlarının kullanıcıya nasıl açıklanacağı ve itiraz edileceği.

### İlk uygulama sırası — buradan başlanacak

1. [ ] Mevcut ekranlar, route'lar, backend modülleri ve Prisma modelleri listelensin; her birine **çalışıyor / eksik / hatalı / karar bekliyor** durumu verilsin.
2. [ ] Müşteri ve işletme için kritik yol senaryoları yazılsın: kayıt/giriş, profil seçimi, işletme kurulumu, randevu alma, işletme yönetimi, tamamlama ve geçmiş.
3. [ ] Navigasyon kaynağı-hedef-geri dönüş matrisi oluşturulup kalan bütün geri/yeniden yükleme sorunları kapatılsın.
4. [ ] Ortak tema bileşenleri ve semantik renkler denetlensin; ardından ekran ekran açık/koyu tema turu yapılsın.
5. [ ] İşletme durum makinesi ve kurulum zorunlulukları tek backend servisine bağlansın; farklı endpoint'lerde kural kopyalanmasın.
6. [ ] Randevu durum makinesi, yetki matrisi, snapshot ve audit alanları kesinleştirilip migration planı çıkarılsın.
7. [ ] Availability, timezone ve eşzamanlı çakışma testleri; ardından taşıma/iptal/no-show/tamamlama E2E testleri yazılsın.
8. [ ] Tıraş kaydı `DRAFT → FINALIZED` kilidi ve fotoğraf erişim testleri tamamlansın.
9. [ ] Çekirdek akış gerçek iOS/Android cihazda baştan sona test edilip Faz 1–4 çıkış kapıları kapatılsın.
10. [ ] Bundan sonra Yakınlarım, ardından berber/çalışan profili geliştirilsin.

## Her iş paketinin çalışma standardı

Her özellik veya hata aşağıdaki sırayla ele alınır:

1. **Kural:** Kullanıcı hikâyesi, izin verilen/yasak davranış ve uç durum yazılır.
2. **Veri:** Migration, snapshot, audit ve silme/saklama etkileri belirlenir.
3. **Backend:** DTO, servis, guard/policy ve transaction doğrulaması yapılır.
4. **Mobil:** Loading, error, empty, disabled ve başarı durumları birlikte uygulanır.
5. **Test:** Unit/entegrasyon/E2E ile rol, saat dilimi ve eşzamanlı istekler sınanır.
6. **Cihaz kontrolü:** Küçük iPhone ve en az bir Android cihazda açık/koyu tema denenir.
7. **Dokümantasyon:** Tamamlanan madde işaretlenir; değişen ürün kararı ana belgeye yazılır.

## Yol haritası boyunca takip edilecek temel ölçüler

- Kayıt → ilk başarılı randevu dönüşümü.
- Slot görüntüleme → randevu onayı başarı oranı ve hata nedenleri.
- Çakışma/availability hatası ve başarısız booking oranı.
- Müşteri iptali, işletme iptali, no-show ve itiraz oranları.
- Randevu değişikliği bildirimi teslim oranı.
- Tamamlanan randevu → yorum ve tekrar randevu oranı.
- İşletme kurulumunu bitirme süresi ve terk edilen kurulum adımı.
- Crash-free session, API hata oranı ve kritik endpoint gecikmesi.

## Adım 1 — Mevcut uygulamayı temizleme

- [ ] Bütün müşteri ve işletme ekranlarında sayfalar arası geçiş/geri dönüş matrisi çıkarılsın.
- [ ] Geri tuşunun ekranı yeniden yüklemesi, yanlış taba göndermesi ve yönetim ekranının tepesine atması kalan bütün akışlarda taransın.
- [ ] Açık/koyu tema renkleri gerçek cihazda ekran ekran kontrol edilsin; düşük kontrastlı metin, ikon, rozet, input ve disabled durumlar düzeltilsin.
- [ ] Randevu oluşturma, taşıma, iptal, no-show ve tamamlama kuralları backend seviyesinde uygulanıp E2E testleri yazılsın.
- [ ] İşletme taslak, yayınlanabilir ve randevuya açık durumlarının bütün giriş noktalarında aynı kuralları kullandığı doğrulansın.
- [ ] Eksik kurulumda alt navigasyon görünür kalsın; kilitli işletme ekranları neden kilitli olduğunu açıklasın ve müşteri profiline geçişi engellemesin.

### Kontrol öncesi hazırlık

- [ ] Backend ve Expo temiz şekilde başlatılsın; açılış sırasında kırmızı hata veya sürekli tekrar eden console/API hatası olmadığı doğrulansın.
- [ ] Test için en az bir müşteri, bir owner, bir manager, bir barber ve bir apprentice hesabı hazır olsun.
- [ ] Yayındaki işletme yanında kurulumu eksik/taslak bir işletme de bulunsun.
- [ ] Kontrol aynı veriyle önce koyu, sonra açık temada; mümkünse küçük iPhone ve bir Android cihazda yapılsın.
- [ ] Her hata için ekran adı, kullanıcı modu/rolü, tema, tekrar adımları, beklenen-gerçekleşen sonuç ve ekran görüntüsü/video kaydedilsin.

### 1A — Açılış, kayıt ve giriş

- [ ] Uygulama oturumsuz açıldığında doğru giriş ekranı görünmeli; başlık, input, placeholder ve butonlar iki temada okunmalı.
- [ ] Kayıt olma niyeti seçimi, kayıt formu, parola kuralları ve klavye davranışı kontrol edilmeli.
- [ ] Geçersiz e-posta, zayıf parola, kullanılan e-posta ve bağlantı hatası anlaşılır mesaj göstermeli.
- [ ] E-posta doğrulama ekranında yanlış/süresi dolmuş kod, yeniden gönderme sayacı ve doğru kod kontrol edilmeli.
- [ ] Giriş, beni hatırla, şifremi unuttum ve şifre sıfırlama akışlarında geri tuşları test edilmeli.
- [ ] Uygulama tamamen kapatılıp açıldığında oturum ve seçilen başlangıç profili doğru korunmalı.

### 1B — Profillerim ve mod değiştirme

- [ ] Profillerim ekranında müşteri ve bütün işletme üyelikleri doğru kartlarla görünmeli.
- [ ] Seçili profil, “Uygulama açıldığında” tercihi ve rol etiketleri doğru olmalı.
- [ ] Müşteri → işletme → müşteri geçişi eski ekranı veya yanlış alt menüyü taşımamalı.
- [ ] Profillerim ekranından geri dönüş, ekranın açıldığı müşteri/işletme sayfasına yumuşak şekilde dönmeli.
- [ ] Yeni işletme oluştur, çalışan davetine katıl ve çıkış yap girişleri doğru hedefe gitmeli.
- [ ] Çıkış sonrası korumalı ekranlara geri dönülememeli.

### 1C — Müşteri ana sekmeleri

- [ ] Ana Sayfa, Berberler, merkezdeki Randevu Al, Randevularım ve Profilim sekmeleri sırayla açılmalı.
- [ ] Her sekme kendi scroll ve seçili filtre durumunu makul şekilde korumalı; tekrar basınca beklenmedik remount olmamalı.
- [ ] Ana sayfadaki yaklaşan randevu, son tıraşı tekrarla, hızlı aksiyonlar ve davet kodu doğru hedeflere gitmeli.
- [ ] Berber arama, konum/filtre, favori kartları, işletme detayı, galeri ve geri dönüş kontrol edilmeli.
- [ ] Randevularımda Bugün/Yaklaşan/Geçmiş, ay değiştirme, kart ve detay ekranı kontrol edilmeli.
- [ ] Veri yok, ağ hatası ve yeniden dene durumları boş beyaz/siyah ekran bırakmamalı.

### 1D — Müşteri profili ve alt ekranlar

- [ ] Profil düzenle, profil fotoğrafını değiştir ve hesap bilgileri ekranları doğru değerlerle açılmalı.
- [ ] Kaydettiğin stiller, favoriler, bildirimler ve bildirim tercihleri açıldığı yere doğru dönmeli.
- [ ] Uygulama ayarlarında tema/dil seçimi anında uygulanmalı ve geri dönüş profile olmalı.
- [ ] Şifre değiştir, bağlı hesaplar, aktif oturumlar, veri dışa aktar ve hesabı sil girişleri kontrol edilmeli.
- [ ] Plus kartının konumu, metni ve dokunma davranışı kontrol edilmeli; işletme profilinde müşteri Plus kartı görünmemeli.
- [ ] Bütün alt ekranlarda yazılımsal geri, header geri ve iOS geri kaydırma aynı mantıkla çalışmalı.

### 1E — Randevu alma ekranlarının görsel ve navigasyon kontrolü

- [ ] Berber seçimi, hizmet seçimi, çalışan seçimi, tarih/saat ve önizleme adımları sırayla tamamlanmalı.
- [ ] Her adımda ilerleme göstergesi, geri butonu ve kapatma butonu doğru davranmalı.
- [ ] Yatay tarih/saat listeleri taşmamalı; son seçenek seçilebilir ve metinler kesilmemeli.
- [ ] Seçim yapılmadan devam butonu disabled görünmeli ve yanlışlıkla işlem yapmamalı.
- [ ] Akıştan çıkıp yeniden girildiğinde eski işletme/hizmet/çalışan seçimi yanlış randevuya taşınmamalı.
- [ ] Başarılı oluşturma sonrasında geri tuşu formu tekrar göndermemeli; randevu doğru listede görünmeli.

### 1F — İşletme ana sekmeleri ve profil

- [ ] Randevular, Takvim, Müşteriler, Yönetim ve Profil sekmeleri her rolde izinlere göre görünmeli.
- [ ] Sekmeler arası geçiş ekranı başa atmamalı veya tab barı kaybetmemeli.
- [ ] İşletme randevuları Bugün/Yaklaşan/Geçmiş filtreleri ve kart detaylarıyla kontrol edilmeli.
- [ ] Takvimde hafta/gün değişimi, çalışan filtresi ve boş/dolu slot görünümü kontrol edilmeli.
- [ ] Müşterilerde arama, filtre, müşteri detayı ve gizli fotoğraf/not erişimi kontrol edilmeli.
- [ ] İşletme profilini düzenle, bildirimler, işletme erişimleri ve ayarlar doğru geri dönüş yapmalı.

### 1G — Yönetim ekranlarının tamamı

- [ ] Yönetim ana ekranındaki özetler ve bütün menü kartları doğru hedefe gitmeli.
- [ ] Hizmetler listesi, yeni hizmet, hizmet düzenleme ve aktif/pasif filtreleri kontrol edilmeli.
- [ ] Çalışanlar listesi, çalışan detayı/düzenleme, kendini randevuya açma ve davet oluşturma kontrol edilmeli.
- [ ] Çalışma saatleri, çalışan vardiyaları, mola/izin listesi, yeni kayıt ve düzenleme akışları kontrol edilmeli.
- [ ] Randevu ayarları, kampanyalar, gelir ve işletme ayarları kontrol edilmeli.
- [ ] Her alt ekrandan geri dönüldüğünde Yönetim ekranındaki önceki scroll/konum korunmalı.
- [ ] Owner, manager, barber ve apprentice yetkisiz menü veya işlemi kullanamamalı; yalnız butonu gizlemek yerine backend de reddetmeli.

### 1H — Randevu sonrası işletme akışı

- [ ] İşletme randevu detayından uygun işlemler doğru duruma göre görünmeli.
- [ ] Randevuyu taşıma, iptal, geldi/gelmedi ve tamamlama girişleri yanlış durumda açılmamalı.
- [ ] Tıraş kaydı formunda input, sayaç, fotoğraf kartı ve alt butonlar klavye/alt bar altında kalmamalı.
- [ ] Kamera izni reddi, müşteri fotoğraf izni verilmemesi ve kamera iptali güvenli geri dönüş sağlamalı.
- [ ] Tamamlanan randevu doğru listede görünmeli; tekrar girişte aynı işlem iki kez uygulanmamalı.

### 1I — Tema, ekran boyutu ve dayanıklılık turu

- [ ] Yukarıdaki ekranların tamamında metin, ikon, border, rozet, input ve disabled buton kontrastı iki temada kontrol edilmeli.
- [ ] Uzun işletme/kişi/hizmet adı, büyük yazı boyutu ve küçük ekran taşmaları denenmeli.
- [ ] Klavye açıldığında aktif input ve ana işlem butonu erişilebilir kalmalı.
- [ ] Yavaş ağ, internet kesilmesi, istek tekrarı ve uygulamanın arka plana gidip dönmesi denenmeli.
- [ ] Hızlı çift dokunma aynı randevuyu, daveti veya kaydı iki kez oluşturmamalı.
- [ ] Kontrolün sonunda yeni kırmızı ekran, takılı spinner, boş sayfa veya sessiz başarısızlık kalmamalı.

### Adım 1'in tamamlanma kapısı

- [ ] 1A–1I kontrol paketlerinin tamamı en az bir iOS cihazda geçmeli.
- [ ] Kritik/seviye-1 hata sıfır olmalı; açık kalan düşük öncelikli görsel işler gerekçesiyle kayda alınmalı.
- [ ] Navigasyon ve tema regresyonu için mümkün olan ana senaryolara otomatik test eklenmeli.
- [ ] Adım 2'ye geçmeden önce temiz bir baştan sona müşteri ve owner videosu alınmalı.

## Berber/çalışan profilleri

Amaç, müşteri işletmeye girdikten sonra hizmeti kimin vereceğine güvenle karar verebilsin. İlk sürüm ayrı bir sosyal ağ değil, işletme içindeki doğrulanmış çalışan profilidir.

- [ ] İşletme detayında **Ekibimiz / Berberler** bölümü gösterilsin.
- [ ] Çalışan kartında fotoğraf, ad, rol, kısa uzmanlıklar, ortalama puan, yorum sayısı ve tamamlanan randevu sayısı gösterilsin.
- [ ] Çalışan kartına basıldığında public çalışan profil ekranı açılsın.
- [ ] Profilde çalışanın verdiği hizmetler, randevuya açık durumu, açık rızalı portföyü ve doğrulanmış son yorumları gösterilsin.
- [ ] **Bu berberden randevu al** butonu randevu akışını işletme ve çalışan seçilmiş olarak başlatsın.
- [ ] Puan ve tamamlanan işlem sayısı yalnız o işletmedeki doğrulanmış randevulardan hesaplansın.
- [ ] Telefon, e-posta, gelir, müşteri listesi, özel müşteri notları ve izinsiz fotoğraflar public profilde gösterilmesin.
- [ ] Çalışan kendi profilinde fotoğraf, biyografi ve uzmanlık önerisi yapabilsin; işletmenin doğrulaması gereken alanlar ayrıca belirlensin.
- [ ] Owner/manager çalışanın hizmet eşleşmesini ve randevuya açık durumunu yönetebilsin.
- [ ] Çalışan işletmeden ayrıldığında public profil o işletmede pasife alınsın; geçmiş randevularda isim/fotoğraf snapshot'ı korunsun.
- [ ] Public çalışan detay endpoint'i; üye bazlı puan, yorum, tamamlanan randevu ve portföy özetini güvenli şekilde dönsün.
- [ ] Boş profil, yorum yok, portföy yok ve randevuya kapalı durumlarının tasarımları tamamlansın.

**Tamamlanma ölçütü:** Müşteri işletme detayından bir çalışanı inceleyip ilgili çalışan seçili şekilde uygun hizmet ve saate ulaşabilmeli; gizli çalışan/müşteri verisi public API'ye çıkmamalıdır.

## Yakınlarım — çocuk/kardeş adına randevu

Amaç, tek hesaptan çocuk veya bakmakla yükümlü olunan kişi için randevu alınmasını sağlamak; günlük tek randevu sınırının anonim misafir adıyla aşılmasını önlemektir.

- [x] Müşteri profilinde **Yakınlarım** bölümü oluşturulsun.
- [x] Kullanıcı yakın ekleyebilsin, düzenleyebilsin ve güvenli koşullarda silebilsin.
- [x] İlk sürüm ilişki seçenekleri **Çocuğum**, **Kardeşim** ve **Bakmakla yükümlü olduğum kişi** olsun.
- [x] Yakın profilinde görünen ad, ilişki ve yaş grubu tutulsun; ayrı telefon, e-posta, parola veya Trimly hesabı istenmesin.
- [x] Randevu akışına **Kimin için?** adımı eklensin: **Kendim için** veya kayıtlı yakın.
- [x] İşletme randevuda hizmeti alacak kişinin adını; iletişim ve bildirimlerde rezervasyonu yapan hesap sahibini görsün.
- [x] Randevu onaylandıktan sonra katılımcı değiştirilemesin; yanlış seçim iptal ve yeni randevuyla çözülsün.
- [ ] Günlük tek randevu sınırı hesap yerine katılımcı bazında uygulansın; her yakın için ayrıca kontrol edilsin.
- [ ] Yakının randevu, no-show ve tıraş geçmişi hesap sahibinin geçmişinden ayrı gösterilsin.
- [ ] Yakın adına oluşan no-show ve diğer ihlaller hem yakın kaydına hem rezervasyonu yapan ana hesaba bağlansın.
- [ ] Reşit olmayanlarda özel geçmiş fotoğrafı varsayılan kapalı olsun; fotoğraf çekimi ve public portföy için ayrı veli onayları alınsın.
- [x] Aktif/gelecek randevusu veya korunması gereken geçmişi bulunan yakın doğrudan silinmesin; geçmişi bulunan profil silinmek yerine arşivlensin.
- [x] Backend'e yakın profili modeli ile randevuya `dependentProfileId`, değişmez `attendeeNameSnapshot` ve `appointmentLocalDate` alanları eklensin.
- [ ] Self randevuda kullanıcı+tarih, yakın randevusunda yakın+tarih benzersizliği transaction/veritabanı seviyesinde korunsun.
- [ ] Yakınlarım listesi, ekleme/düzenleme ekranları, boş durum ve hata mesajları açık/koyu temada test edilsin.

**Tamamlanma ölçütü:** Aynı hesap kendisi ve farklı bir yakını için aynı güne ayrı randevu alabilmeli; aynı katılımcı için ikinci randevu backend tarafından engellenmeli ve çocuk fotoğrafı açık rıza olmadan hiçbir public alana çıkmamalıdır.

## Karar verilecek kurallar

- [ ] Müşteri ve işletme geç kalma süreleri ile cezasız ayrılma hakkı kesinleştirilsin.
- [ ] Randevu başlatma ve tamamlama doğrulaması kesinleştirilsin.
- [ ] Ek hizmet, süre ve fiyat değişikliğinde müşteri onay akışı kesinleştirilsin.
- [ ] Çalışanın ayrılması/pasife alınması hâlinde gelecek randevuların çözümü kesinleştirilsin.
- [ ] Yorum moderasyonu, fotoğraf iznini geri çekme ve veri saklama süreleri kesinleştirilsin.
- [ ] Spam, ceza aşma, sahte randevu ve puan manipülasyonu kontrolleri tasarlansın.
- [ ] Ödeme geliştirilmeden önce kapora, iade, komisyon, itiraz ve ters ibraz politikası kesinleştirilsin.

## Sonra

- [ ] İlk kullanım için atlanabilir, adım adım **uygulama tanıtımı / ekran rehberi** geliştirilsin.
- [ ] Müşteri ilk girişi, işletme oluşturma süreci ve işletme kurulduktan sonraki yönetim kullanımı için ayrı rehber akışları hazırlansın.
- [ ] Rehber; ana sekmeleri ve önemli işlemleri ekran üzerinde vurgulayarak anlatsın, zorunlu işletme kurulum adımlarının yerine geçmesin.
- [ ] Kullanıcı rehberi istediği anda atlayabilsin; daha sonra Uygulama Ayarları veya Yardım alanından yeniden başlatabilsin.
- [ ] Tamamlandı/atlandı bilgisi profil türü ve rehber sürümü bazında saklansın; yeni özellik geldiğinde yalnız ilgili yeni adımlar gösterilebilsin.
- [ ] Favori berber bildirimleri gerçek push altyapısına bağlansın.
- [ ] Uygulama duyuruları ve segmentli gönderim altyapısı tamamlansın.
- [ ] Apple/Google bağlı hesaplar ve güvenli hesap birleştirme akışı geliştirilsin.
- [ ] Kalıcı konum tercihi ve manuel il/ilçe/harita seçimi tamamlansın.
- [ ] Trimly Plus kapsamı, fiyatı, ödeme sağlayıcısı ve erişim kontrolü netleştirilsin.
- [ ] Plus için Akıllı Stil Hafızası, Son Tıraşı Tekrarla, öncelikli boş slot ve kişisel eşleştirme sırayla değerlendirilsin.

## Fikir havuzu — doğrulama olmadan geliştirilmez

Bu maddeler söz verilmiş özellik değildir. Pilot verisi veya gerçek kullanıcı talebi ilgili problemi doğrularsa ürün kararı hazırlanıp yol haritasına alınır.

### Randevu ve müşteri deneyimi

- [ ] İptal olan saate otomatik bekleme listesi ve boş slot bildirimi.
- [ ] Tekrarlayan randevu önerisi; kullanıcı onayı olmadan otomatik rezervasyon yapılmaması.
- [ ] Apple/Google takvime ekleme ve takvim çakışma uyarısı.
- [ ] Web/deep-link üzerinden uygulamasız işletme ve uygunluk görüntüleme; rezervasyon için güvenli kimlik doğrulama.
- [ ] Hediye kartı, paket hizmet ve sadakat puanı.
- [ ] Erişilebilirlik turu: ekran okuyucu, dinamik yazı boyutu, kontrast ve hareket azaltma.
- [ ] Türkçe dışındaki diller ve bölgesel tarih/para/saat formatları.

### İşletme operasyonu

- [ ] Çok şubeli işletme, şubeler arası çalışan ve merkezi hizmet kataloğu.
- [ ] Koltuk/kabin kapasitesi ve aynı kaynağı kullanan hizmetlerde kaynak çakışması.
- [ ] Tekrarlayan vardiya, toplu izin, resmî tatil ve vardiya değişim talebi.
- [ ] Müşteri onaylı işletme içi mesajlaşma veya güvenli iletişim kanalı.
- [ ] Günlük/haftalık doluluk, tekrar müşteri, iptal ve çalışan katkısı raporları.
- [ ] Admin destek paneli: kullanıcı/işletme inceleme, audit geçmişi, itiraz ve moderasyon kuyruğu.

### Büyüme ve platform

- [ ] Referral/ödül sistemi; yalnız doğrulanmış aktif müşteri veya ödeme sonrası ödül.
- [ ] İşletme kampanyaları, kuponlar ve hedefli ama izinli bildirimler.
- [ ] **Trimly Ağ:** berber, kalfa, çırak, koltuk kiralama ve misafir berber ilanları.
- [ ] **Trimly Mağaza:** yalnız satıcı doğrulama, stok, ödeme, iade ve lojistik operasyonu gerçekten kurulabilecekse.
- [ ] Stil/model araması ve kişiselleştirilmiş öneriler; özel müşteri fotoğrafları eğitim/veri kaynağı yapılmaması.

### Fikir havuzundan yol haritasına geçiş şartı

- Çözülen problem ve hedef kullanıcı açıkça tanımlanmış olmalı.
- Talep kullanıcı görüşmesi, destek kaydı veya ürün metriğiyle doğrulanmış olmalı.
- Gizlilik, operasyon ve kötüye kullanım maliyeti değerlendirilmiş olmalı.
- Başarı metriği ve özelliği kapatma/geri alma koşulu önceden belirlenmiş olmalı.

## Canlıya çıkmadan önce

- [ ] Veri dışa aktarma JSON yanında kullanıcı dostu PDF ve gerekiyorsa CSV sunsun.
- [ ] Dışa aktarılan dosyalarda parola, token, oturum ve erişim kodu bulunmadığı doğrulansın.
- [ ] Hesap silme; e-posta kodu, gelecek randevular, anonimleştirme ve işletme sahipliği kurallarına uysun.
- [ ] Production dosya saklama, imzalı erişim, sıkıştırma ve silme politikası tamamlansın.
- [ ] Push bildirimleri gerçek iOS/Android cihazlarda doğrulansın.
- [ ] Deployment, secret yönetimi, loglama, hata izleme, yedekleme, gizlilik metinleri ve mağaza hazırlıkları tamamlansın.

## Tamamlandı

Tamamlanan büyük işler burada kısa bir satırla tutulur; ayrıntı git geçmişinde ve ilgili ürün belgesinde kalır.
