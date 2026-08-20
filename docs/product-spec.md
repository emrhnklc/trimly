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

## Müşteri deneyimi

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

MVP'de isimle arama ve işletme listesi yeterlidir. Konuma göre sıralama/"yakınımdakiler" ikinci aşamadır; bunun için koordinat, konum izni, mesafe sorgusu ve gizlilik kararları gerekir.

Her işletmenin benzersiz bir `slug` değeri olur. Örnek profil bağlantısı: `trimly.app/b/ali-barber`. QR kod bu bağlantıyı içerir.

İşletme keşfi için `GET /barbershops?search=...` kullanılır; ilk aşamada ad eşleşmesine göre en fazla 20 işletme döner. Herkese açık işletme profilinde ad, açıklama, profil görseli, adres ve iletişim bilgisi bulunur. Owner/manager, `PATCH /barbershops/:barbershopId` ile bu tanıtım alanlarını günceller.

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

### Genel berber profili ve fotoğraf gizliliği

Müşteri, işletme ekranındaki aktif ve randevu alınabilir berberleri listeleyebilir; birine dokununca o işletmedeki genel berber profili açılır. Bu profil yalnız ad, profil fotoğrafı ve verebildiği aktif hizmetleri içerir. API'ler: `GET /barbershops/:barbershopId/barbers` ve `GET /barbershops/:barbershopId/barbers/:memberId`.

Müşterinin tıraş fotoğrafları ve notları berberin profiline ya da başka bir müşteriye asla gösterilmez. Berber, yetkiliyse tamamlanan randevuya kayıt/fotoğraf yükler; geçmişi görüntüleme yetkisi müşterinin kendisindedir. İleride portföy özelliği istenirse, müşteri geçmişinden tamamen ayrı, açık rızaya dayalı bir berber portföy modeli oluşturulur.

## Roller ve yetkiler

Roller işletme üyeliği üzerinde tutulur; kullanıcı üzerinde global rol yoktur.

| Rol | Ana yetki |
| --- | --- |
| `OWNER` | İşletmenin tamamını ve çalışanları yönetir. |
| `MANAGER` | Operasyonu ve tüm randevuları yönetir; sahiplik/kritik işletme ayarları sınırlandırılabilir. |
| `BARBER` | Kendi randevularını, uygun olduğu müşterileri ve tıraş kayıtlarını yönetir. |
| `APPRENTICE` | Varsayılan olarak programı/hizmetleri görüntüler; düzenleme ve iptal yapamaz. |

MVP'de rollerden türetilen sabit bir permission haritası kullanılacak. Özel rol ve veritabanından düzenlenebilir permission sistemi sonraki aşamadır. Bu, ilk sürümün yönetimini ve güvenlik denetimini daha sade tutar.

Örnek permission'lar: `VIEW_APPOINTMENTS`, `VIEW_CUSTOMERS`, `CREATE_HAIRCUT_RECORD`, `VIEW_EMPLOYEES`, `CREATE_EMPLOYEE`, `EDIT_SERVICES`, `MANAGE_BUSINESS`.

## Çalışan daveti ve bookable kuralı

Owner veya yetkili yönetici süreli, rolü önceden seçilmiş ve en fazla kullanım sayısı belirlenmiş bir davet oluşturur. Davet bağlantısı/kodu tahmin edilemeyen güvenli bir token ile temsil edilir; okunabilir kısa kod yalnız kullanıcı deneyimi içindir.

Her `BusinessMember` için `isBookable` alanı bulunur:

- `true`: Müşteri bu çalışanı seçip randevu alabilir.
- `false`: Çalışan yalnız işletme içi görünür; müşteri seçiminde listelenmez.

`APPRENTICE` varsayılan olarak bookable değildir; ancak bu yalnız rolün zorunlu sonucu değildir. İşletme isterse bir çırağı bookable yapabilir.

Owner veya manager, `PUT /barbershops/:barbershopId/members/:memberId/bookable` çağrısında `{ "isBookable": true | false }` göndererek bu durumu değiştirir. Pasif çalışanın `isBookable` değeri `true` yapılamaz.

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

Bu ayarlar işletme düzeyinde ayrı bir `BookingSettings` modelinde tutulacak. İleride iptal süresi, slot aralığı ve onay kuralı gibi ayarlar aynı modele eklenebilir.

### Müşteri iptal politikası

İşletme, müşteri iptalini tamamen kapatabilir veya randevudan en az kaç dakika önce iptal yapılabileceğini belirleyebilir. Varsayılan kural: iptal açıktır ve en az `120` dakika önce yapılır. Bu ayarlar backend'de zorunlu olarak denetlenir; mobil uygulama aynı veriyi kullanarak iptal butonunu gizler veya nedenini gösterir.

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

“Aynısını tekrar iste” seçeneği önceki kayıttaki işletme, çalışan ve hizmet seçimini taşır. Yeni tarih/saat yine güncel uygunluk kurallarına göre seçilir.

## Bildirimler

Yeni bir randevu oluşturulduğunda atanan, bookable çalışana push bildirimi gönderilir. Bildirim örneği: “Yeni randevu: Ahmet Yılmaz — Saç — 14:30”.

Push bildirimi altyapısı mobil cihaz token'ı, bildirim tercihleri ve Expo Push/benzeri bir servis gerektirir. Appointment oluşturma işlemi başarıyla tamamlandıktan sonra tetiklenir; bildirim hatası randevu oluşturmayı geri almamalıdır.

Expo cihaz token'ları kullanıcıya bağlı `PushDevice` kayıtlarında tutulur. Mobil uygulama girişten sonra `PUT /notifications/push-devices`, uygulamadan çıkışta ise `DELETE /notifications/push-devices` çağrısıyla token yönetir. Token, URL'ye konmaz; silme isteğinin gövdesinde gönderilir.

Randevu PostgreSQL'e başarıyla yazıldıktan sonra backend, atanan berberin tüm kayıtlı Expo cihazlarına “Yeni randevu” push mesajı gönderir. Push hatası yakalanır ve yalnız loglanır; randevu oluşturma başarılı kalır. Mobilde token alma/izin ve Android-iOS credential ayarları ayrı Expo adımıdır.

## Favoriler ve deep link

Favoriler, `User` ile `Barbershop` arasında ayrı bağlantı modeli olarak tutulur. Deep link/QR kod, uygulama yüklüyse ilgili işletme ekranını; değilse web yönlendirme/fallback ekranını açmalıdır.

Favori API'leri giriş gerektirir: `GET /favorites/barbershops`, `PUT /favorites/barbershops/:barbershopId` ve `DELETE /favorites/barbershops/:barbershopId`. Ekleme için `PUT` seçilmiştir; kullanıcı aynı isteği tekrar gönderse bile sonuç değişmez (idempotent).

## Referral sistemi — MVP sonrası

Her işletmenin referral kodu olabilir. Ödül, yalnız yeni işletme kayıt olduğunda değil; doğrulanmış ve ücretli/aktif müşteri olduğunda hak edilir.

Referral ve ödül sistemi MVP dışındadır çünkü abonelik/billing sistemi olmadan ödül koşulunu güvenilir biçimde belirlemek mümkün değildir.

## MVP kapsamı

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

## MVP sonrası

- Konuma göre keşif
- Tekrarlayan molalar
- Özel roller ve düzenlenebilir permission'lar
- “İlk müsait çalışan” seçeneği
- Referral, abonelik ve ödüller
- Online ödeme
- SMS/WhatsApp hatırlatma
- Yorum/puanlama, kampanyalar, kuponlar ve gelişmiş analytics
