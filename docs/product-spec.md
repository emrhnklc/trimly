# Trimly — Ürün Kaydı

## Ürün tanımı

Trimly, berberler için mobil odaklı randevu, müşteri geçmişi ve çalışan yönetimi uygulamasıdır. Aynı kullanıcı hem müşteri olabilir hem de bir veya birden fazla işletmede çalışan olabilir.

Temel farkı, yalnız randevu oluşturmak değil; tamamlanan tıraşın fotoğrafı, notu ve hizmet detaylarıyla tekrar edilebilir bir müşteri geçmişi sunmaktır.

## Temel kullanıcılar

- **Müşteri:** Berber keşfeder, randevu alır, geçmişini görür ve önceki bir tıraşı tekrar seçer.
- **İşletme sahibi / yönetici:** İşletme, çalışan, hizmet, çalışma saati ve randevu yönetir.
- **Çalışan:** Kendi çalışma programını ve yetkisi olan randevuları yönetir.

Bir kullanıcı için ayrıca "müşteri" veya "işletme" modu veritabanında saklanmaz. Kullanıcının işletme üyeliklerinden işletme yetkileri türetilir; mobil arayüzde yalnızca görünüm/mod seçimi bulunur.

Kullanıcı kendi profilini JWT ile `GET /users/me` ve `PATCH /users/me` üzerinden yönetir. Şifre hash'i gibi hassas alanlar bu yanıtlarda asla dönmez.

### E-posta doğrulama

Yeni hesap `POST /auth/register` ile oluşturulduktan sonra doğrudan oturum açılmaz. Backend 6 haneli, 10 dakika geçerli ve tek kullanımlık bir kod üretir. Kodun kendisi veritabanında tutulmaz; kullanıcıya ve doğrulama koduna bağlı HMAC özeti `EmailVerificationChallenge` kaydında saklanır.

Kullanıcı kodu `POST /auth/verify-email` ile doğruladığında `User.emailVerifiedAt` yazılır ve ilk JWT bu aşamada verilir. Doğrulanmamış hesap doğru şifre kullansa bile login olamaz; `EMAIL_NOT_VERIFIED` kodu alır ve mobil uygulama doğrulama ekranına yönlendirir. Bir kod en fazla 5 kez denenebilir. Yeni kod isteme çağrısı `POST /auth/resend-email-verification` üzerinden yapılır ve iki gönderim arasında en az 60 saniye bulunur.

Local geliştirmede SMTP yapılandırılmadığında kod backend terminaline yazılır ve simulator testi için development cevabında gösterilir. Production ortamında SMTP ayarları zorunludur; development kodu API cevabına eklenmez.

## Müşteri deneyimi

Mobil uygulamadaki ilk ekran, canlı `GET /barbershops` isteğiyle işletmeleri listeler ve isimle arar. İşletme detayına geçiş, favori ve randevu akışları sonraki mobil adımlardır.

- Kayıt ve giriş yapar.
- Kendi ad, telefon ve profil fotoğrafı bilgilerini görüntüler/günceller.
- İşletmeleri listeler ve isimle arar.
- İşletme profilini, hizmetleri, fiyatları ve bookable çalışanları görüntüler.
- Çalışan, tarih ve yalnız uygun olan saati seçerek randevu oluşturur.
- Yaklaşan ve geçmiş randevularını görür; izin verilen kurallara göre iptal eder.
- İşletmeyi favoriye ekler.
- QR kod veya özel link ile doğrudan işletme profiline gider.
- Tamamlanmış tıraş geçmişindeki bir kayıttan “Aynısını tekrar iste” akışını başlatır.

### Keşif

İlk çalışan keşif sürümünde isimle arama ve işletme listesi yeterlidir. Ancak ürün kararı olarak işletme konumu zorunludur: işletme profilinde adresin yanında koordinat (`latitude`, `longitude`) tutulacaktır. Böylece sonraki keşif adımında “yakınımdakiler”, il/ilçe seçimi ve mesafeye göre sıralama eklenebilir. Müşterinin canlı konumu yalnız açık izniyle kullanılır; kullanıcı ayrıca elle konum/ilçe arayabilmelidir.

Her işletmenin benzersiz bir `slug` değeri olur. Örnek profil bağlantısı: `trimly.app/b/ali-barber`. QR kod bu bağlantıyı içerir.

İşletme keşfi için `GET /barbershops?search=...` kullanılır; ilk aşamada ad eşleşmesine göre en fazla 20 işletme döner. Herkese açık işletme profilinde ad, açıklama, yuvarlak profil görseli, LinkedIn benzeri geniş kapak görseli, adres ve iletişim bilgisi bulunur. Owner/manager, `PATCH /barbershops/:barbershopId` ile bu tanıtım alanlarını günceller.

## Yeni ürün kararları — şimdi ve ileri aşama

### Şimdi netleşen ürün kararları

- Hesap şifresi 8–72 karakter olmalı; en az bir büyük harf, bir küçük harf, bir rakam ve bir özel karakter içermeli, boşluk içermemelidir. Mobil kayıt ekranı bu şartları kullanıcı yazdıkça ayrı ayrı işaretler; aynı kurallar backend tarafından da zorunlu olarak doğrulanır.
- Türkiye cep telefonu numaraları mobilde `+90 5xx xxx xx xx` biçiminde gösterilir ve backend'de E.164 (`+905xxxxxxxxx`) biçiminde saklanır. Biçimin doğru olması numaranın kullanıcıya ait olduğunu kanıtlamaz; sahiplik doğrulaması ancak SMS koduyla yapılabilir.
- MVP hesap aktivasyonunda önce e-posta doğrulaması kullanılacaktır. Kayıt sonrası gönderilen kısa ömürlü tek kullanımlık kod hash'li saklanacak, tekrar gönderme ve hatalı deneme sınırı uygulanacaktır. SMS doğrulaması maliyet ve sağlayıcı bağımlılığı nedeniyle telefon zorunlu hale gelirse sonraki aşamada eklenir.
- “Şifremi unuttum” cevabı bir hesabın kayıtlı olup olmadığını dışarıya açıklamayacaktır. Kayıtlı hesaba kısa ömürlü, tek kullanımlık ve hash'li sıfırlama kodu/linki gönderilecek; başarılı sıfırlamada token geçersiz kılınacaktır. Gerçek gönderim için production e-posta sağlayıcısı seçildikten sonra aktif edilir.
- Doğum tarihi randevu için gerekli olmadığı için kayıt sırasında zorunlu tutulmaz. İleride doğum günü kampanyaları açılırsa açık amaç belirtilerek isteğe bağlı profil alanı olarak eklenir.
- İşletme kurulurken fotoğraf yüklemek taslak oluşturmayı engellemez. Ancak işletmenin keşfette yayınlanabilmesi için en az üç galeri görseli, profil görseli ve kapak görseli istenir. Böylece kaliteli vitrin korunurken owner'ın ilk kurulumda uygulamayı terk etme riski azaltılır.
- Saç modeliyle berber keşfi herkes için ücretsiz olacaktır. Kullanıcı örneğin `taper fade`, `low fade` veya `sakal` aradığında bu modeli portföyünde gösteren yakın/istenen konumdaki berberleri bulabilmelidir. Bu, Trimly'nin temel keşif değeridir; Plus paywall arkasına konmaz.
- İşletme sahibi, müşteri erişimini `PUBLIC` veya `CODE_REQUIRED` olarak seçebilir. `PUBLIC` işletmeler genel keşifte görünür ve giriş yapmış herkes randevu akışına girebilir. `CODE_REQUIRED` işletmeler genel keşifte görünmez; müşteri işletmenin paylaştığı kod, QR veya özel link ile bir kez erişim kazanır ve sonrasında normal randevu akışını kullanır.
- Owner/manager erişim biçimini `PATCH /barbershops/:barbershopId/access-settings` ile günceller. `isDiscoverable` keşfet görünürlüğünü, `accessMode` ise randevu erişim kuralını ayrı ayrı yönetir.
- Owner/manager erişim ayarlarını `GET /barbershops/:barbershopId/access-settings` ile görür ve `POST /barbershops/:barbershopId/access-code/rotate` ile yeni paylaşım kodu üretir. Kod yalnız bu cevabın içinde açık şekilde döner; veritabanında bcrypt hash'i saklanır ve yenileme eski kodu geçersiz kılar.
- Giriş yapmış müşteri kodu `POST /barbershops/:slug/access` ile bir kez doğrular. Başarılı doğrulama `CustomerBarbershopAccess` kaydını açar; 15 dakika içinde 5 hatalı deneme kullanıcı–işletme çiftini 15 dakika kilitler ve sayaç PostgreSQL'de tutulur.
- Kod, her randevuda yeniden istenen bir parola değildir. Başarılı kullanım kullanıcı-işletme erişimi olarak kaydedilir. İşletme kodunu yenileyebilir ve daha önce verilmiş müşteri erişimini kaldırabilir. Tahmin edilebilir kısa kod tek başına kalıcı yetki taşımaz; backend deneme sınırı ve güvenli doğrulama uygular.
- Berber portföyü, müşterinin özel tıraş geçmişinden tamamen ayrı tutulacaktır. Berber kendi portföyüne fotoğraf, başlık ve model etiketleri ekler. Müşteri geçmişindeki fotoğraf, yalnız açık rızayla ayrı bir portföy kaydına dönüştürülebilir.
- İşletme oluştururken konum zorunlu ürün verisidir. Adres, koordinat, il ve ilçe ile desteklenir. Önce mevcut adres alanı korunur; koordinat/mesafe sorgusu için veritabanı ve harita/geocoding altyapısı ayrı teknik adımda eklenir.
- Yorum yalnız gerçekten tamamlanmış randevusu olan müşteri tarafından bırakılabilir. Yorumlara fotoğraf ekleme, berber yanıtı, şikâyet/moderasyon ve müşteri izni kuralları olmadan açılmaz.

### İleri aşama — portföy ve keşif

- `BarberPortfolioItem`: berbere bağlı, görünür portföy fotoğrafı/açıklaması.
- `StyleTag`: `TAPER_FADE`, `LOW_FADE`, `SKIN_FADE`, `BUZZ_CUT`, `BEARD` gibi aranabilir model etiketleri. Bir portföy kaydında birden çok etiket olabilir.
- Keşif filtreleri: model etiketi, hizmet, il/ilçe, mesafe ve müsaitlik.
- Konum tabanlı sorgular için işletme koordinatı, mesafe hesabı ve gerektiğinde PostGIS/uygun coğrafi indeks kullanılacaktır.
- Doğrulanmış yorum, puan, opsiyonel yorum fotoğrafı, berber yanıtı ve raporlama/moderasyon akışı portföyden sonraki aşamada ele alınacaktır.

### İleri aşama — Trimly Plus

Plus, temel berber/model/konum aramasını kısıtlamaz; zaman kazandıran ve otomasyon sağlayan özellikleri sunar:

- Haftalık, iki haftada bir veya aylık tekrarlayan randevu tercihi.
- Favori berberde istenen saat boşaldığında öncelikli bildirim.
- Gelişmiş “aynısını tekrar iste” ve kişisel stil tercihleri.

Tekrarlayan randevu doğrudan, sonsuza kadar slot kapatan bir yapı olmayacaktır. `RecurringBookingPlan`; işletme, çalışan, hizmet, sıklık, tercih edilen gün/saat ve aktiflik bilgisini taşır. Sistem her oluşacak randevuda güncel vardiya, izin, fiyat ve availability kurallarını kontrol eder: uygunsa randevu oluşturur/bildirim gönderir, uygun değilse alternatif saat sunar. Kullanıcı planı duraklatabilir, tek seferi atlayabilir veya iptal edebilir.

## İşletme yönetimi

- İşletme adı, açıklaması, adresi, telefonu ve profil görselleri yönetilir.
- Hizmet adı, fiyatı, süresi, aktiflik durumu ve hizmeti verebilen çalışanlar yönetilir.
- Salonun açık olduğu günler/saatler, çalışan vardiyaları ve tekil mola/izinler yönetilir.
- Randevu penceresi ve en erken randevu kuralı belirlenir.
- Randevular görüntülenir, tamamlanır veya yetkiye bağlı olarak iptal edilir.
- Tamamlanan randevuya tıraş notu ve fotoğraf eklenir.

### Berber ana ekranı

İşletme/berber modundaki ana ekran, çalışanın sıradaki randevusunu öne çıkarır. Kartta müşterinin adı, profil fotoğrafı, seçilen hizmet, randevu saati ve aynı işletmedeki tamamlanmış ziyaret sayısı gösterilir.

Karttan açılan müşteri/randevu detayında önceki tamamlanmış randevular ve bunlara bağlı tıraş kayıtları görüntülenir. Ziyaret sayısı ayrı bir alanda kopyalanmaz; tamamlanmış randevulardan hesaplanır. Performans ihtiyacı oluşursa daha sonra önbelleklenebilir.

Backend, giriş yapan çalışanın yalnız kendi en yakın onaylı randevusunu `GET /barbershops/:barbershopId/appointments/next-for-me` ile sağlar. Sonuçta müşteri özeti, hizmet ve aynı işletmedeki tamamlanmış ziyaret sayısı bulunur; sırada randevu yoksa `null` döner.

### İşletme profili, çalışan seçimi ve fotoğraf gizliliği

Müşteri için herkese açık vitrin işletme profilidir; çalışanlara ayrı bir public profil ekranı açılmaz. İşletme ekranında ekip yalnız tanıtım amacıyla listelenir. Müşteri hizmeti seçtikten sonra o hizmeti verebilen çalışanı randevu akışında seçer. Randevuya uygun çalışanlar `GET /barbershops/:barbershopId/barbers` API'sinden alınır.

Müşterinin tıraş fotoğrafları ve notları berberin profiline ya da başka bir müşteriye asla gösterilmez. Berber, yetkiliyse tamamlanan randevuya kayıt/fotoğraf yükler; geçmişi görüntüleme yetkisi müşterinin kendisindedir. İleride portföy özelliği istenirse, müşteri geçmişinden tamamen ayrı, açık rızaya dayalı bir berber portföy modeli oluşturulur.

## Roller ve yetkiler

Roller işletme üyeliği üzerinde tutulur; kullanıcı üzerinde global rol yoktur.

| Rol          | Ana yetki                                                                                    |
| ------------ | -------------------------------------------------------------------------------------------- |
| `OWNER`      | İşletmenin tamamını ve çalışanları yönetir.                                                  |
| `MANAGER`    | Operasyonu ve tüm randevuları yönetir; sahiplik/kritik işletme ayarları sınırlandırılabilir. |
| `BARBER`     | Kendi randevularını, uygun olduğu müşterileri ve tıraş kayıtlarını yönetir.                  |
| `APPRENTICE` | Varsayılan olarak programı/hizmetleri görüntüler; düzenleme ve iptal yapamaz.                |

MVP'de rollerden türetilen sabit bir permission haritası kullanılacak. Özel rol ve veritabanından düzenlenebilir permission sistemi sonraki aşamadır. Bu, ilk sürümün yönetimini ve güvenlik denetimini daha sade tutar.

Örnek permission'lar: `VIEW_APPOINTMENTS`, `VIEW_CUSTOMERS`, `CREATE_HAIRCUT_RECORD`, `VIEW_EMPLOYEES`, `CREATE_EMPLOYEE`, `EDIT_SERVICES`, `MANAGE_BUSINESS`.

## Çalışan daveti ve bookable kuralı

Owner veya yetkili yönetici süreli, rolü önceden seçilmiş ve en fazla kullanım sayısı belirlenmiş bir davet oluşturur. Davet bağlantısı/kodu tahmin edilemeyen güvenli bir token ile temsil edilir; okunabilir kısa kod yalnız kullanıcı deneyimi içindir.

Her `BusinessMember` için `isBookable` alanı bulunur:

- `true`: Müşteri bu çalışanı seçip randevu alabilir.
- `false`: Çalışan yalnız işletme içi görünür; müşteri seçiminde listelenmez.

`APPRENTICE` varsayılan olarak bookable değildir; ancak bu yalnız rolün zorunlu sonucu değildir. İşletme isterse bir çırağı bookable yapabilir.

Owner veya manager, `PUT /barbershops/:barbershopId/members/:memberId/bookable` çağrısında `{ "isBookable": true | false }` göndererek bu durumu değiştirir. Pasif çalışanın `isBookable` değeri `true` yapılamaz.

İşletme profilindeki kısayollar iki farklı davet amacını açıkça ayırır:

- **Müşteri Davet Kodum:** Müşterinin özel işletme erişimi kazanması için kod, QR ve deep link ekranını açar.
- **Çalışan Davet Kodum:** Ekibe `MANAGER`, `BARBER` veya `APPRENTICE` olarak katılım için süreli, tek kullanımlık davet bağlantısı oluşturur.

Çalışan davet ekranına hem `Yönetim > Çalışanlar` içinden hem de işletme profilindeki kısayoldan ulaşılır. Bu iki yönetim kısayolu yalnız gerekli yetkileri bulunan owner ve manager rollerinde gösterilir.

Owner, `PATCH /barbershops/:barbershopId/members/:memberId` ile owner olmayan bir çalışanın rolünü değiştirebilir veya üyeliğini pasife alabilir. Pasife alınan kişi otomatik olarak müşteri randevusuna kapatılır. Owner rolünü değiştirmek ya da devretmek daha hassas olduğu için ayrı bir sahiplik devri akışında ele alınır.

## Hizmet ve çalışma düzeni

- Hizmetin `price` alanı ondalıklı para değeri olarak saklanır; `Float` kullanılmaz.
- Her hizmetin `durationMinutes` alanı vardır. Bu, uygunluk hesaplaması için gereklidir.
- Bir çalışan, yalnız kendisine atanmış hizmetler için seçilebilir.
- Owner/manager, `PUT /barbershops/:barbershopId/members/:memberId/services/:serviceId` ile hizmet atar; `DELETE` ile aynı URL'den atamayı kaldırır. Atama kaldırılınca availability engine bu çalışan/hizmet ikilisi için yeni saat göstermez.
- Owner/manager, hizmetleri `GET /barbershops/:barbershopId/services/management` ile aktif/pasif birlikte görür; `PATCH /barbershops/:barbershopId/services/:serviceId` ile fiyat, süre, açıklama veya aktiflik durumunu değiştirir. Mevcut randevular hizmetin o anki verisini değil, kendi fiyat/süre snapshot'ını korur.
- Salonun genel çalışma saatleri ve çalışanın kendi vardiyası ayrı tutulur.
- Mola ve izin, belirli tarih/saat aralığını kapatan bloklardır.
- Owner/manager, yanlış eklenen mola/izin bloğunu `DELETE /barbershops/:barbershopId/members/:memberId/schedule-blocks/:blockId` ile silebilir.
- Salonun `timezone` değeri vardır. Haftalık saatler bu yerel saate göre, randevu zamanları ise API katmanında güvenli biçimde UTC olarak değerlendirilir.

## Booking kuralları

Her işletmenin booking ayarları bulunur:

- `minBookingNoticeMinutes`: Randevu en erken kaç dakika sonra alınabilir? Örnek: `120`.
- `maxBookingAdvanceDays`: En fazla kaç gün ileriye randevu alınabilir? Örnek: `3` veya `14`.
- `slotIntervalMinutes`: Müşteriye gösterilecek başlangıç zamanlarının aralığı. İzin verilen değerler: `5`, `10`, `15`, `30`; varsayılan `5`.

Bu ayarlar işletme düzeyindeki `BookingSettings` modelinde tutulur. Aynı model müşteri iptalinin açık olup olmadığını ve minimum iptal bildirim süresini de taşır.

### Müşteri iptal politikası

İşletme, müşteri iptalini tamamen kapatabilir veya randevudan en az kaç dakika önce iptal yapılabileceğini belirleyebilir. Varsayılan kural: iptal açıktır ve en az `120` dakika önce yapılır. Bu ayarlar backend'de zorunlu olarak denetlenir; mobil uygulama aynı veriyi kullanarak iptal butonunu gizler veya nedenini gösterir.

Müşteri `GET /appointments/me` ile listesini, `GET /appointments/:appointmentId` ile yalnız kendisine ait randevunun detayını görür. Bu cevaplarda backend tarafından hesaplanan `canCancel`, `cancellationDeadline`, `cancellationNoticeMinutes` ve `cancellationReason` alanları bulunur. İzin verilen iptal `PATCH /appointments/:appointmentId/cancel` ile yapılır; backend isteğin geldiği anda politikayı yeniden doğrular.

`GET /barbershops/:barbershopId/booking-settings` ayarları okumaya, `PUT /barbershops/:barbershopId/booking-settings` ise owner/manager'ın ayarları değiştirmesine yarar.

## Availability engine

Bir saat yalnız aşağıdaki koşulların tamamı sağlanırsa müşteriye gösterilir:

1. Tarih, maksimum ileri randevu penceresinin içinde olmalıdır.
2. Başlangıç, minimum booking notice süresinden sonra olmalıdır.
3. Salon açık olmalıdır.
4. Çalışanın vardiyası olmalıdır.
5. Hizmet, çalışana atanmış olmalıdır.
6. Hizmet süresi vardiya/salon kapanışından önce bitmelidir.
7. Saat, çalışanın mola veya izin bloğuyla çakışmamalıdır.
8. Saat, mevcut bir randevuyla çakışmamalıdır.

MVP'de müşteri çalışanı seçer. “Fark etmez, ilk müsait çalışan” seçeneği sonraki aşamadır.

### Mobil saat seçimi

Backend uygun başlangıç saatlerini işletmenin `slotIntervalMinutes` ayarına göre hesaplar. Mobil ekranda tüm bu seçenekler tek seferde gösterilmez; ekran kalabalığını önlemek için başlangıç saatine göre gruplanır.

Örnek akış:

```text
Önce saat grubu: 10:00 | 11:00 | 12:00
Sonra seçilen grup (5 dk ayarı): 10:00, 10:05, 10:10, 10:15 ...
```

Bir saat grubu yalnız en az bir uygun başlangıç zamanı içeriyorsa gösterilir. Gruplama yalnız mobil arayüz sorumluluğudur; backend zaman aralıklarının uygunluğunu hesaplamaya devam eder.

## Randevu güvenliği

Randevu durumları en az `CONFIRMED`, `COMPLETED`, `CANCELLED` ve `NO_SHOW` olacaktır.

Owner/manager tüm randevuları, atanmış berber ise yalnız kendi randevusunu iptal edebilir veya taşıyabilir. İşletme iptali `PATCH /barbershops/:barbershopId/appointments/:appointmentId/cancel`, taşıma ise `PATCH /barbershops/:barbershopId/appointments/:appointmentId/reschedule` ile yapılır. Taşıma işleminde yeni çalışan/saat availability engine ve veritabanı çakışma kuralıyla tekrar doğrulanır; işletme bu işlemde müşteri için geçerli minimum booking notice kuralını aşabilir.

Müşteri gelmezse owner, manager veya o randevuya atanmış berber `PATCH /barbershops/:barbershopId/appointments/:appointmentId/no-show` ile randevuyu `NO_SHOW` durumuna geçirir. Yalnız onaylı (`CONFIRMED`) randevular işaretlenebilir.

Owner/manager, `GET /barbershops/:barbershopId/appointments/daily-summary?date=YYYY-MM-DD` ile gün sonu özetini alır. Yanıt; toplam, onaylı, tamamlanmış, iptal, no-show randevu sayılarını ve yalnız tamamlanan randevuların snapshot fiyatlarından hesaplanan geliri içerir. Ayrıca her çalışan için aynı kırılım ve tamamlanan gelir (`byMember`) döner. `date` verilmezse işletmenin saat diliminde bugünün özeti döner. Push bildirim altyapısı eklendiğinde aynı özet owner'a otomatik bildirim olarak da gönderilebilir.

Aynı çalışana çakışan iki randevu oluşturma, sadece mobil ekranda kontrol edilmez. Backend işlem sırasında yeniden kontrol eder ve PostgreSQL tarafında da zaman aralığı çakışmasını engelleyen bir kural uygulanır. Bu, iki müşterinin aynı anda aynı slotu seçmesi durumunda yalnız birinin başarılı olmasını sağlar.

## Tıraş geçmişi ve fotoğraflar

Tamamlanan randevuya bir tıraş kaydı eklenebilir: model adı, not, çalışan, tarih ve fotoğraflar.

Fotoğraf binary verisi PostgreSQL'e konmaz. Dosya storage servisinde tutulur; veritabanında yalnız dosya anahtarı/URL ve metadata bulunur.

Fotoğraflar kişisel veri kabul edilir. MVP'de müşteri fotoğrafı eklenmeden önce işletmenin müşteriden izin aldığını doğrulayan bir akış ve müşterinin kaydı sildirme talebi için ürün kararı gerekir. Storage erişimi public, tahmin edilebilir URL olmamalıdır; gerektiğinde imzalı URL kullanılır.

Local geliştirmede fotoğraflar backend'in gitignore'daki `uploads/haircut-photos/` klasöründe dosya olarak saklanır. Berber, tamamlanmış randevunun tıraş kaydı oluşturulduktan sonra `POST /barbershops/:barbershopId/appointments/:appointmentId/haircut-record/photos` üzerinden JPEG/PNG/WebP ve en fazla 5 MB dosya yükler. Müşteri fotoğrafı yalnız JWT ile `GET /haircut-records/:recordId/photos/:photoId` üzerinden görür; berbere fotoğraf okuma API'si verilmez. Production'da bu local storage Supabase/S3 gibi private storage ve imzalı URL yapısına taşınmalıdır.

### Tıraş fotoğrafı çekim kuralı

- Berber, müşterinin tıraş fotoğrafını yalnız Trimly içindeki kamera ekranından çekebilir; cihaz galerisinden mevcut fotoğraf seçme seçeneği sunulmaz.
- Çekilen fotoğraf cihazın Fotoğraflar/Galeri uygulamasına kaydedilmez. Dosya yalnız uygulamanın geçici önbelleğinde tutulur, Trimly'nin private storage alanına yüklenir ve işlem tamamlandığında geçici kopya temizlenir.
- Bu akış yalnız kamera izni ister; medya galerisi erişim izni istemez. Kamera izni verilmezse fotoğraf ekleme yapılamaz ancak randevunun tamamlanması engellenmez.
- Kamera açılmadan önce müşterinin açık rızasının alındığı işletme çalışanı tarafından doğrulanır. Fotoğraf yüklemek zorunlu değildir.

“Aynısını tekrar iste” seçeneği önceki kayıttaki işletme, çalışan ve hizmet seçimini taşır. Yeni tarih/saat yine güncel uygunluk kurallarına göre seçilir.

## Bildirimler

Yeni bir randevu oluşturulduğunda atanan, bookable çalışana push bildirimi gönderilir. Bildirim örneği: “Yeni randevu: Ahmet Yılmaz — Saç — 14:30”.

Push bildirimi altyapısı mobil cihaz token'ı, bildirim tercihleri ve Expo Push/benzeri bir servis gerektirir. Appointment oluşturma işlemi başarıyla tamamlandıktan sonra tetiklenir; bildirim hatası randevu oluşturmayı geri almamalıdır.

Expo cihaz token'ları kullanıcıya bağlı `PushDevice` kayıtlarında tutulur. Mobil uygulama girişten sonra `PUT /notifications/push-devices`, uygulamadan çıkışta ise `DELETE /notifications/push-devices` çağrısıyla token yönetir. Token, URL'ye konmaz; silme isteğinin gövdesinde gönderilir.

Randevu PostgreSQL'e başarıyla yazıldıktan sonra backend, atanan berberin tüm kayıtlı Expo cihazlarına “Yeni randevu” push mesajı gönderir. Push hatası yakalanır ve yalnız loglanır; randevu oluşturma başarılı kalır. Mobilde token alma/izin ve Android-iOS credential ayarları ayrı Expo adımıdır.

Müşteri randevu hatırlatmaları varsayılan olarak randevudan yaklaşık 24 saat ve 2 saat önce hazırlanır. Kullanıcı, Hesap Ayarları içindeki “Randevu Hatırlatmaları” anahtarıyla bu bildirimleri kapatabilir. Her hatırlatma randevu üzerinde gönderim zamanı ile işaretlenir; böylece backend yeniden başlasa veya kontrol döngüsü tekrar çalışsa bile aynı hatırlatma ikinci kez gönderilmez. Hatırlatma hem Bildirim Merkezi'nde kalıcı kayıt olur hem de cihaz tokenı varsa normal telefon bildirimi olarak iletilir.

## Favoriler ve deep link

Favoriler, `User` ile `Barbershop` arasında ayrı bağlantı modeli olarak tutulur. Deep link/QR kod, uygulama yüklüyse ilgili işletme ekranını; değilse web yönlendirme/fallback ekranını açmalıdır.

Özel erişimli işletmenin owner veya manager'ı yeni kod ürettiğinde mobil uygulama `access/:slug?code=...` deep link'ini içeren bir QR gösterir. QR'ı okutan kullanıcı giriş yapmamışsa işletme ve kod bilgisi giriş/kayıt boyunca korunur; oturum açıldıktan sonra kod otomatik doğrulanır ve kullanıcı işletme profiline yönlendirilir. Kod veritabanında hash olarak tutulduğu için eski kod sonradan görüntülenemez; QR yeniden hazırlanacaksa yeni kod üretilir ve önceki kod geçersiz olur. Daha önce erişim kazanmış müşterilerin kaydı korunur.

Favori API'leri giriş gerektirir: `GET /favorites/barbershops`, `PUT /favorites/barbershops/:barbershopId` ve `DELETE /favorites/barbershops/:barbershopId`. Ekleme için `PUT` seçilmiştir; kullanıcı aynı isteği tekrar gönderse bile sonuç değişmez (idempotent).

## Referral sistemi — MVP sonrası

Her işletmenin referral kodu olabilir. Ödül, yalnız yeni işletme kayıt olduğunda değil; doğrulanmış ve ücretli/aktif müşteri olduğunda hak edilir.

Referral ve ödül sistemi MVP dışındadır çünkü abonelik/billing sistemi olmadan ödül koşulunu güvenilir biçimde belirlemek mümkün değildir.

## MVP kapsamı

### Keşif ve çalışan seçimi kararı

Müşteri keşfi **işletme/dükkân** odaklıdır: Berberler sekmesinde Barbershop listesi görünür, müşteri işletme profiline girer ve randevu akışında hizmeti verebilen çalışanlardan birini seçer. Çalışan için ayrı public profil yoktur; işletme içinde ad ve fotoğrafıyla ekip üyesi olarak görünmesi yeterlidir.

1. Auth: e-posta/şifre ile kayıt, giriş ve JWT.
2. İşletme oluşturma, üyelik ve sabit roller.
3. Hizmet, çalışan-hizmet ataması ve bookable çalışanlar.
4. Salon/çalışan çalışma saatleri, tekil mola ve izinler.
5. Booking ayarları, availability engine ve çakışmasız randevu oluşturma.
6. Müşteri ve işletme mobil ekranları.
7. Randevu tamamlama, tıraş notu ve fotoğraf geçmişi.
8. Favoriler ve QR/deep link.
9. Yeni randevu push bildirimi ve berber ana ekranı.

## Geliştirici dokümantasyonu

Local backend çalışırken Swagger arayüzü `http://localhost:3000/api/docs` adresindedir. Controller decorator'larından üretilen endpoint listesini gösterir ve geliştirme sırasında istek denemeye yarar. Üretimde gerekirse `SWAGGER_ENABLED=false` ile kapatılır.

Local geliştirme verisi `backend` klasöründe `npm run prisma:seed` komutuyla oluşturulur. Seed tekrar çalıştırılabilir; Trimly'nin sabit örnek işletmelerini günceller, kopyalamaz ve diğer kullanıcı kayıtlarını silmez. Örnek owner girişi: `owner.alsancak@trimly.dev` / `Trimly123!`.

Rol bazlı işletme ekranlarını localde denemek için örnek manager girişi: `manager.alsancak@trimly.dev` / `Trimly123!`.

Yalnız kendi randevu ve takvimini gören örnek barber girişi: `barber.alsancak@trimly.dev` / `Trimly123!`.

Salt okunur takvim, hizmet kataloğu ve profil ekranlarını deneyen örnek apprentice girişi: `apprentice.alsancak@trimly.dev` / `Trimly123!`.

## MVP sonrası

- Konuma göre keşif
- Tekrarlayan molalar
- Özel roller ve düzenlenebilir permission'lar
- “İlk müsait çalışan” seçeneği
- Referral, abonelik ve ödüller
- Online ödeme
- SMS/WhatsApp hatırlatma
- Yorum/puanlama, kampanyalar, kuponlar ve gelişmiş analytics

## Bundan sonraki ilerleme sırası

Yeni büyüme özelliklerine geçmeden önce mevcut MVP aşağıdaki sırayla tamamlanıp sağlamlaştırılır:

1. **Auth güvenliği:** E-posta doğrulama tamamlandı. Sıradaki işler şifremi unuttum/sıfırlama akışı ve production SMTP sağlayıcısının bağlanmasıdır. Telefon numarası doğrulaması daha sonra SMS sağlayıcısıyla eklenebilir.
2. **Kullanıcı profili:** Doğum tarihi gibi kayıt alanlarını veritabanına bağlama; profil fotoğrafını URL yazmak yerine güvenli yükleme akışına taşıma.
3. **İşletme kurulumu ve galeri:** İşletme oluştururken en az üç görsel alma, kapak/profil/galeri ayrımı ve görsel yönetimi.
4. **Konum tabanlı keşif:** İşletme koordinatları, cihaz konum izni, gerçek mesafe hesabı ve “Yakındaki Berberler” filtresi.
5. **Production dosya saklama:** Local `uploads` yerine private Supabase Storage/S3, imzalı fotoğraf erişimi, sıkıştırma ve silme politikası.
6. **Gerçek cihaz bildirimleri:** Apple/Android imzalı build, push credential ayarları ve iOS/Android cihaz testleri.
7. **MVP kalite turu:** Rol/yetki, eşzamanlı randevu, saat dilimi, izin, iptal, no-show ve fotoğraf gizliliği senaryolarının uçtan uca testi.
8. **Canlıya hazırlık:** Backend ve PostgreSQL deployment, secret yönetimi, loglama, hata izleme, yedekleme, gizlilik metinleri ve mağaza hazırlıkları.
9. **Sosyal özellikler:** Gerçek yorum/puanlama, işletme portföyü ve stil/model araması.
10. **Gelir özellikleri:** Trimly Plus, tekrarlayan randevu, referral/ödül sistemi ve online ödeme.

Apple ve Google ile giriş, temel e-posta/şifre auth akışı tamamlanıp production kimlik bilgileri hazırlandıktan sonra eklenir. İş ilanları ve Trimly Mağaza ise çekirdek randevu ürünü gerçek kullanıcılarla doğrulandıktan sonraki en ileri aşamadır.

### En ileri aşama — Trimly platform modülleri

Trimly başlangıçta randevu ve müşteri geçmişi ürünü olarak odağını korur. Yeterli müşteri, işletme ve berber ağı oluştuğunda uygulama; aynı hesap ve tasarım sistemi altında farklı ihtiyaçlara ayrılan modüller sunabilir. Bu, randevu deneyimini ilk günden kalabalıklaştırmamak için en son aşama olarak değerlendirilir.

- **Trimly Randevu:** müşteri keşfi, hizmet/çalışan/saat seçimi, randevu ve tıraş geçmişi.
- **Trimly Ağ:** işletmelerin berber, kalfa veya çırak ilanı açtığı; çalışanların deneyim, konum, uzmanlık ve portföyüyle iş aradığı alan. Tam zamanlı, yarı zamanlı, çıraklık, koltuk kiralama ve misafir berber gibi ilan türleri düşünülebilir.
- **Trimly Mağaza:** berber ve işletmelere yönelik makine, makas, bakım ürünü, sarf malzemesi gibi ürünlerin bulunduğu olası marketplace. Stok, ödeme, iade, satıcı doğrulama ve lojistik gerektirdiği için yalnız güçlü pazar/operasyon ihtiyacı oluşursa ele alınır.

Bu modüller tek bir alt menüye aynı anda doldurulmaz. Kullanıcının aktif modu ve ihtiyacına göre görünür: müşteri ağırlıkla Randevu'yu, işletme sahibi ise Randevu yönetimi ve Ağ'ı görür. Mağaza gibi ticaret modülleri, ayrı bir ürün ve operasyon kararıyla açılır.
