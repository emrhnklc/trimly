# Trimly — Ürün Kuralları ve Yol Haritası

Bu belge, ekran tasarımından bağımsız iş kurallarının tek kaynağıdır. Mobil uygulama kullanıcıya kuralı açıklar; backend ise kuralı mutlaka uygular. Bir butonu gizlemek güvenlik veya veri tutarlılığı için yeterli değildir.

## Öncelik sırası

1. **P0 — Zorunluluklar, yasaklar, durum geçişleri ve navigasyon:** Randevu, fotoğraf, yayın, rol ve kampanya kuralları backend doğrulaması ile; sayfalar arası geçişler de tek bir geri-dönüş sözleşmesiyle netleşecek.
2. **P1 — Uçtan uca kalite:** Bu kuralların müşteri/işletme tarafında anlaşılır hata mesajları, boş durumları ve E2E testleri tamamlanacak.
3. **P2 — Berber profilinin işletme içi ilk sürümü:** Berber seçimini ve güveni güçlendirecek; ayrı sosyal ağ yapılmayacak.
4. **P3 — `Yakında` etiketli özellikler:** Altyapısı ve gerçek kullanıcı değeri hazır olanlar sırayla açılacak.
5. **P4 — Plus ve ileri otomasyonlar:** Plus, temel randevu deneyimini kısıtlamayan değer katmanı olarak ele alınacak.

## P0 — Zorunluluklar ve yasaklar

### 0. Sayfalar arası geçiş ve geri dönüş sözleşmesi

Mevcut ve yeni bütün ekranlarda sayfalar arası geçiş bug'ları ayrı bir P0 kalite işi olarak taranacak ve çözülecek.

- Her ekran, hangi kaynaktan açıldığını bilir; geri tuşu mümkünse gerçek önceki ekrana döner.
- Ortak bir ekran (davet kodu, işletme ayarı, çalışan detayı gibi) profil tarafından açıldıysa akış sonunda profile; yönetim tarafından açıldıysa yönetime döner.
- Tab ekranları stack içine yanlışlıkla tekrar eklenmez. Bir modal/booking akışından çıkış, kullanıcıyı eski/boş bir ekranda bırakmaz.
- `router.back`, `dismiss`, `dismissTo`, `replace` kullanımları ekran türüne göre standardize edilir; rastgele karıştırılmaz.
- Geri davranışı hem müşteri hem işletme modunda; profil, yönetim, randevu, davet, çalışan ve ayarlar akışlarında manuel test edilir.
- Geçiş sırasında yükleme/hata oluşursa kullanıcı boş veya kilitli ekranda kalmaz; tekrar deneme ya da güvenli geri dönüş sunulur.

**Tamamlanma ölçütü:** Her ana akış için “açılış noktası → alt ekran → geri → beklenen ekran” matrisi çıkarılır ve iOS küçük ekranında uçtan uca test edilir.

### 1. İşletme taslağı, yayın ve randevuya açılma

İşletme kurulabilir; fakat eksik profille keşfette veya randevuya açık yayınlanamaz.

| Durum | Zorunlu koşullar | Yasak |
| --- | --- | --- |
| Taslak işletme | İşletme adı ve owner | Keşfette görünme, herkese randevu alma |
| Yayınlanabilir işletme | Adres/koordinat, işletme telefonu, profil ve kapak görseli, en az 2 galeri fotoğrafı | Eksik vitrinle keşfette görünme |
| Randevuya açık işletme | Yayın koşulları + en az 1 aktif hizmet + hizmete atanmış en az 1 aktif/bookable çalışan + çalışma saati | Hizmeti veya uygun çalışanı olmayan işletmeden slot üretme |

- İşletme oluşturma akışında temel bilgiler zorunludur; hizmet, çalışan ve çalışma saati tamamlanmadıysa işletme **taslak** kalır.
- Owner, işlemi tamamlamadan keşfet görünürlüğünü veya herkese açık randevuyu açamaz.
- İşletme galerisine tek işlemde birden fazla fotoğraf seçilebilir; galeri toplamda en fazla 8 fotoğraf tutar.
- Hizmet pasife alınırsa o hizmet için yeni randevu alınamaz; mevcut randevunun snapshot bilgisi değişmez.
- Bir çalışan pasif, izinde veya hizmete atanmamışsa yeni slot üretilmez.
- İl, ilçe, mahalle ve açık adres alanları işletmenin yazılı adres kaydıdır; bu alanlar haritadaki işaretçiyi otomatik taşımaz. Harita konumu, harita ekranındaki arama veya işaretçi seçimiyle ayrıca belirlenir.

#### 1.1. Çalışma saatleri ve slot aralığı değişiklikleri

- Yayındaki bir işletmede çalışma saatleri veya randevu dakika aralığı değiştirildiğinde değişiklik aynı gün başlamaz; en erken işletmenin bir sonraki yerel takvim gününde yürürlüğe girer.
- Yeni çalışma saatleri mevcut onaylanmış/geldi durumundaki randevulardan biriyle çakışıyorsa eski program, çakışan son randevunun gün sonuna kadar korunur. Yeni program sonraki gün başlar.
- Süresi 45 dakikadan 30 dakikaya düşen slot aralığı mevcut randevuların zamanını, süresini veya kaydını değiştirmez; yalnız yürürlük tarihinden sonra üretilecek yeni uygunlukları etkiler.
- Taslak işletmenin ilk çalışma saati ve ilk slot aralığı kurulumu hemen uygulanır; erteleme yalnız yayındaki işletmenin sonradan yaptığı değişikliklerde kullanılır.
- Mobil uygulama düzenleme ekranında planlanan yeni değeri gösterir; müşteri availability sonucu ise randevu tarihine göre o gün gerçekten yürürlükte olan değerden üretilir.

**Uygulama durumu (25 Eylül 2026):**

- [x] Keşfet görünürlüğü (`isDiscoverable`) ile işletmenin randevu kabul etme tercihi (`acceptsBookings`) ayrıldı.
- [x] Gerçek randevu durumu; yayın, işletme tercihi ve zorunlu hazırlık kontrollerinden türetilen `isBookingOpen` ile belirleniyor.
- [x] Kapalı işletme için availability ve yeni randevu oluşturma backend tarafından `BARBERSHOP_BOOKING_CLOSED` hatasıyla engelleniyor.
- [x] İşletme sahibi yönetimden yeni randevuları durdurup yeniden açabiliyor; mevcut randevular korunuyor.
- [x] Müşteri işletme profilinde kapalı durumu görüyor ve kapalı işletmeyle randevu akışına devam edemiyor.
- [x] Yayınlanabilir işletme için telefon, profil/kapak görseli ve asgari 2 galeri fotoğrafı kontrolleri merkezi readiness servisine eklendi.

### 2. Randevu durumları ve yetkiler

`CONFIRMED → ARRIVED → COMPLETED` ana akıştır. `CANCELLED` ve `NO_SHOW` terminal durumdur.

- Müşteri yalnız kendi randevusunu ve işletmenin tanımladığı iptal penceresi içinde iptal edebilir.
- Owner/manager tüm işletme randevularını; çalışan yalnız kendisine atanmış randevuları yönetebilir.
- `COMPLETED`, `CANCELLED` ve `NO_SHOW` durumundaki randevu yeniden aktif hâle getirilemez; gerekiyorsa yeni randevu oluşturulur.
- “Müşteri Geldi” işlemi randevu başlangıcından en erken 15 dakika önce açılır ve bu sınır backend tarafından uygulanır.
- Çakışma kontrolü UI'da değil, availability motorunda ve PostgreSQL kuralında uygulanır.
- Randevu tarih/saat, çalışan veya hizmet sonradan değişse bile tamamlanmış kayıttaki hizmet/fiyat snapshot'ı korunur.
- İşletme; onaylanmış randevunun saatini, çalışanını, hizmetini veya fiyatını müşteriye bildirmeden değiştiremez. Değişiklik bir teklif olarak gönderilir; müşteri kabul etmeden uygulanmaz.
- İşletmenin gönderdiği değişiklik teklifi ve işletme kaynaklı iptal, müşteriye gösterilecek anlamlı bir açıklama olmadan oluşturulamaz. Açıklama işlem geçmişinde saklanır.
- Müşteri değişiklik teklifini reddederse cezasız iptal hakkına sahiptir.
- Müşteri aynı randevuyu en fazla iki kez taşıyabilir. İşletmenin teklif ettiği değişiklikler müşterinin taşıma hakkından düşmez.
- İptal penceresi kapandıktan sonra müşteri randevuyu taşıyamaz; işletmenin yaptığı taşıma da availability ve çakışma kurallarından geçer.
- İşletme fiyatı değiştirse bile daha önce onaylanmış randevunun fiyatı yükseltilemez. Müşterinin açıkça kabul etmediği ek hizmet veya ücret randevuya eklenemez.

**Uygulama durumu (25 Eylül 2026):**

- [x] Müşteri yalnız kendi randevusunu ve işletmenin iptal penceresi içinde iptal edebiliyor.
- [x] Owner/manager tüm işletme randevularını; berber yalnız kendisine atanmış randevuları yönetebiliyor.
- [x] Geldi, geliş kaydını geri al, tamamla, iptal et, gelmedi ve yeniden planla işlemleri mevcut durumu veritabanında atomik olarak doğruluyor; eşzamanlı istek terminal kaydı değiştiremiyor.
- [x] İşletmenin saat/çalışan/hizmet/fiyat değişikliği doğrudan uygulanmıyor; müşteriye süreli teklif ve bildirim gönderiliyor. Müşteri kabul ederse uygunluk yeniden doğrulanıp randevu atomik olarak güncelleniyor, reddederse mevcut randevu korunuyor ve cezasız iptal hakkı açılıyor.
- [ ] Müşteri kaynaklı yeniden planlama hakkı en fazla iki ile sınırlandırılmalı.

#### 2.1. Günlük randevu sınırı ve başkası adına randevu

Sınır müşteri hesabına değil, hizmeti alacak kişiye uygulanır: **aynı kişi aynı yerel takvim gününde yalnız bir randevuya sahip olabilir.** Böylece kullanıcı kendisi için aynı güne ikinci randevu açamaz; fakat çocuğu veya bakmakla yükümlü olduğu kişi için ayrı bir katılımcı profili seçerek randevu alabilir.

- Normal randevunun katılımcısı varsayılan olarak hesabın sahibidir.
- Aynı kişi için `CONFIRMED`, `ARRIVED`, `COMPLETED` veya `NO_SHOW` durumundaki bir kayıt o günün hakkını kullanır. `CANCELLED` kayıt yeni randevuyu engellemez.
- Gün sınırı işletmenin saat dilimindeki randevu tarihi üzerinden hesaplanır; yalnız mobilde değil, oluşturma ve taşıma sırasında backend tarafından tekrar doğrulanır.
- Aynı hesaptan aynı güne birden fazla randevu yalnız farklı katılımcılar için açılabilir. Her katılımcı için günlük sınır ayrıca uygulanır.
- Randevu onaylandıktan sonra katılımcı başka bir kişiyle değiştirilemez; yanlış kişi seçildiyse randevu iptal edilip yeniden oluşturulur.
- Eşzamanlı iki isteğin sınırı aşmaması için kontrol transaction/veritabanı seviyesinde de güvenceye alınır.

**Bağımlı/misafir profilinin ilk sürümü:**

- Randevu akışına “Kimin için?” adımı eklenir: **Kendim için** veya kayıtlı bağımlı profil.
- Bağımlı profil; görünen ad, ilişki (`Çocuğum`, `Bakmakla yükümlü olduğum kişi`) ve yaş grubu tutar. Ayrı telefon, e-posta, parola veya Trimly hesabı istemez.
- Serbest ve anonim “misafir adı” yerine önce kayıtlı bağımlı profili kullanılır; böylece günlük sınır kolayca delinmez ve geçmiş doğru kişide tutulur.
- İşletme ve berber randevuda hesabın sahibini değil, hizmeti alacak kişinin görünen adını görür; iletişim ve bildirimler hesabın sahibine gider.
- Bağımlının randevu, no-show ve tıraş geçmişi hesap sahibinin geçmişinden ayrı gösterilir.
- Reşit olmayan katılımcıda fotoğraf varsayılan olarak kapalıdır. Özel geçmiş fotoğrafı ve portföy yayını için veli onayı ayrı ayrı gerekir; portföy izni varsayılan kapalı kalır.

**Teknik karar:** Randevuya nullable `dependentProfileId`, değiştirilemeyen `attendeeNameSnapshot` ve işletme saat diliminde `appointmentLocalDate` eklenmeli. Self randevularda benzersizlik kullanıcı + yerel tarih, bağımlı randevularda bağımlı profil + yerel tarih üzerinden uygulanmalıdır.

**Uygulama durumu (7 Ekim 2026):** Yakın profili modeli, sahiplik korumalı CRUD, güvenli silme/arşivleme, müşteri profilindeki **Yakınlarım** girişi ve randevu akışındaki **Kimin için?** adımı tamamlandı. Randevu katılımcısı işletme kartı, takvim, bildirim ve tıraş kaydında snapshot adıyla gösteriliyor. Katılımcı bazlı günlük sınır oluşturma ve değişiklik teklifi kabulünde backend tarafından; eşzamanlı isteklerde PostgreSQL trigger/advisory lock ile uygulanıyor. İptal edilen kayıt hakkı yeniden açıyor. Yakının randevuları Randevularım ekranında kişi filtresiyle ayrılıyor. Reşit olmayan katılımcının özel tıraş fotoğrafı varsayılan kapalı; rezervasyonu yapan hesap sahibi randevu detayından izin verebiliyor veya geri çekebiliyor. Geri çekilince ilgili fotoğraf kayıtları ve onlara bağlı portföy yayınları kaldırılıyor. Herkese açık yayın için mevcut ayrı portföy onayı da zorunlu. Gerçek cihazda uçtan uca izin akışı ayrıca kontrol edilmeli.

**Tıraş geçmişi güncellemesi (8 Ekim 2026):** Kaydettiğim Stiller ekranındaki Tıraş Geçmişi bölümünde varsayılan kişi Ben; Tümü, aktif yakınlar ve geçmişi bulunan arşivlenmiş yakınlar seçilebilir. Her kayıt katılımcının snapshot adı, tarih, işletme/berber, not ve varsa fotoğraflarla gösterilir. Fotoğrafsız gerçek kayıtlar da görünür; beğenilen stiller hesap genelinde ayrı sekmede kalır. API yalnız oturumdaki hesap sahibinin randevularını getirir.

#### 2.2. Müşteri no-show tespiti, itiraz ve cezalar

No-show cezası yalnız doğrulanmış gelmeme kayıtlarına uygulanır. Müşterinin geç kalması, zamanında iptal etmesi veya işletmenin neden olduğu bir aksaklık no-show değildir.

- Yalnız `CONFIRMED` randevu no-show yapılabilir; işletmenin iptal ettiği veya taşıdığı kayıt no-show yapılamaz.
- Randevu başlangıç saati ve en az 15 dakikalık bekleme süresi geçmeden çalışan “Gelmedi” işlemini kullanamaz.
- İşaretleme yetkisi owner, manager veya randevuya atanmış çalışandadır ve işlem zaman/aktör bilgisiyle denetim kaydına yazılır.
- Müşteriye anında bildirim gider ve müşteri 48 saat içinde itiraz edebilir. İtiraz süresince kayıt geçici durumdadır ve ceza sayacına eklenmez.
- İtiraz kabul edilirse no-show ve bütün ceza etkileri kaldırılır. Çok sayıda haksız işaretlemesi doğrulanan işletme ayrıca incelenir.
- Ceza hesabı son 90 günlük hareketli pencereyle yapılır; araya tek başarılı randevu girmesi sayacı sıfırlamaz.

| Doğrulanmış ihlal | Sonuç |
| --- | --- |
| İlk no-show | Uyarı ve 1 no-show kaydı; yeni randevu engellenmez |
| Aynı işletmede ikinci no-show | İlgili işletmeden 14 gün yeni randevu alamama |
| Aynı işletmede üçüncü no-show | İlgili işletmeden 30 gün yeni randevu alamama |
| Trimly genelinde toplam üçüncü no-show | Bütün uygulamada 7 gün yeni randevu alamama |
| Genel ceza sonrasında yeniden üç no-show | 30 gün uygulama geneli kısıtlama ve hesap incelemesi |

- Üç no-show aynı işletmede gerçekleşirse işletmeye özel 30 günlük ve Trimly geneli 7 günlük kısıtlama birlikte uygulanır.
- 90 gün yeni doğrulanmış ihlal olmazsa aktif ceza puanları temizlenir; geçmiş kayıtlar denetim için korunur.
- Bağımlı/çocuk randevusunun no-show sorumluluğu rezervasyonu yapan hesaba aittir. Kayıt hem bağımlı profile hem ana hesaba bağlanır; yeni bağımlı profili açmak cezayı aşma yöntemi olamaz.
- Ceza kesinleşmeden önce onaylanmış gelecek randevular korunur; ceza nedeniyle otomatik iptal veya yeniden onay zorunluluğu uygulanmaz. Kısıtlama yalnız yeni randevu ve mevcut randevunun yeniden planlanması/değişiklik teklifi için geçerlidir; müşteri mevcut randevusuna gidebilir veya normal iptal koşullarını kullanabilir. Somut kötüye kullanım şüphesinde mevcut randevu ancak ayrı manuel inceleme ve açık bildirimle ele alınır.

**Teknik karar:** No-show kaydı `PENDING_DISPUTE`, `CONFIRMED` ve `REVOKED` yaşam döngüsüne; `markedBy`, `markedAt`, `disputeDeadline`, müşteri itirazı ve inceleme sonucuna sahip olmalıdır. İşletme ve platform kısıtlamaları ayrı tutulmalı ve bütün create/reschedule endpoint'lerinde backend tarafından uygulanmalıdır.

**Uygulama durumu (30 Eylül 2026):** Gelmedi işaretleme randevu başlangıcından 15 dakika sonra açılıyor; yalnız yetkili çalışan/owner/manager kullanabiliyor ve açık değişiklik teklifi varken kullanılamıyor. Aktör, zaman, müşteri ve yakın bilgisi ayrı gelmedi kaydında saklanıyor. Müşteriye bildirim ve 48 saatlik itiraz hakkı veriliyor; bu süre ve inceleme boyunca ceza yok. İtirazsız kayıt süre bitince kesinleşiyor. Son 90 gün içindeki kesinleşmiş kayıtlardan işletme ve platform kısıtları hesaplanıp yeni randevu ile değişiklik teklifinde backend tarafından kontrol ediliyor. Yetkili platform moderatörü için inceleme API'si var; operasyonda kullanılacak moderatör hesabı ayrıca tanımlanmalı. Haksız işaretleme analizi ve gerçek cihaz turu henüz tamamlanmadı.

**E2E kontrolü (4 Ekim 2026):** Müşteri itirazı incelemedeyken ceza sayılmaması, kabul edilince gelmedi kaydının geri alınması ve iki reddedilen itirazdan sonra işletmeye özel kısıt oluşması doğrulandı.

**Ek E2E kontrolü (4 Ekim 2026):** Aynı işletmede ikinci kayıt için 14 gün, üçüncü kayıt için 30 gün; platform genelinde üçüncü kayıt için 7 gün ve altıncı kesinleşmiş kayıt için 30 gün süreleri doğrulandı. Haklı itiraz edilen kayıt sayacı artırmadı; başka işletmede yeni randevu isteği reddedilirken ceza öncesinde onaylanmış gelecek randevu `CONFIRMED` kaldı. Altıncı ihlal için operasyonel hesap inceleme akışı, gerçek cihaz turu ve moderatör hesabı kurulumu hâlâ açık.

#### 2.3. İşletme kaynaklı iptal ve güvenilirlik cezası

İşletme cezası yalnız sayıya değil, müşteriye verilen zararı gösteren iptal zamanına göre hesaplanır. Puanlar son 90 günlük hareketli pencerede tutulur.

| İşletmenin iptal zamanı | Ceza puanı |
| --- | ---: |
| Randevudan 24 saatten daha önce | 0; yalnız iptal oranına kaydedilir |
| Randevuya 6–24 saat kala | 1 |
| Randevuya 2–6 saat kala | 2 |
| Randevuya 2 saatten az kala | 3 |
| Randevu saati geçtikten veya müşteri geldikten sonra | 3 |

| Son 90 günlük puan | Sonuç |
| --- | --- |
| 3 puan | Owner'a uyarı ve çalışma saatlerini/programı kontrol etme zorunluluğu |
| 5 puan belirli çalışanda yoğunlaşmışsa | İlgili çalışan owner programını doğrulayana kadar randevuya kapatılır |
| 5 puan işletme geneline yayılmışsa | İşletmenin keşfet sıralaması 7 gün hafifçe düşürülür |
| 8 puan | İşletme 72 saat yeni randevu alamaz |
| Ceza sonrasında yeniden 8 puan | 7 günlük kısıtlama ve manuel inceleme |
| Sistematik tekrar veya sahtecilik | İşletmenin geçici/kalıcı olarak yayından kaldırılması değerlendirilebilir |

- İptal belirli bir çalışandan kaynaklanıyorsa olay hem çalışanın güvenilirlik kaydına hem işletme toplamına yazılır; ilk yaptırım mümkünse sorunlu çalışana uygulanır.
- İşletme başka çalışan/saat önerir ve müşteri açıkça kabul ederse olay iptal sayılmaz. Müşteri kabul etmezse gerçek işletme iptali olarak kaydedilir.
- İşletme iptal nedeni seçmek zorundadır. “Müşteri istedi” nedeni müşterinin onayı olmadan kullanılamaz.
- Platform arızası puan oluşturmaz; doğal afet veya belgelenebilir ciddi acil durum incelemeyle puandan çıkarılabilir.
- İşletmenin iptal ettiği randevu müşterinin iptal/no-show sayacını etkileyemez ve sonradan no-show yapılamaz.
- Müşteriye aynı işletmedeki alternatif çalışan/saatler ve uygun yakın işletmeler gösterilir. Ödeme/kapora eklendiğinde işletme iptalinde tutar eksiksiz ve otomatik iade edilir.
- Yüksek hacimde yalnız ham sayı kullanılmaz; en az randevu eşiğinden sonra son dakika iptal oranı da değerlendirmeye katılır.
- Günlük yoğunluk, art arda iptal ve haftalık erken iptal kontrolleri aynı olaya ikinci bir puan yazmaz; çalışma programını düzeltmeye yönelik operasyonel risk sinyali üretir.
- Son 30 günlük işletme iptal oranı, işletme iptallerinin tamamlanan + doğrulanmış no-show + işletme iptali toplamına oranıdır. On sonuçlanan kayda ulaşmadan yalnız bilgi amaçlı gösterilir; otomatik oran yaptırımları gerçek kullanım verisiyle ayrıca kesinleştirilir.
- Başarıyla tamamlanan randevu işletme iptal serisini sıfırlar. Müşteri iptali seriyi ne artırır ne sıfırlar; müşterinin kabul ettiği değişiklik teklifi iptal sayılmaz.

**Teknik karar:** İşletme iptalinde `cancelledBy`, zorunlu `cancellationReason`, `cancelledAt`, başlangıca kalan dakika, puanın hangi zaman kuralından üretildiğini gösteren değişmez `pointReason` ve etkilenen `businessMemberId` snapshot olarak tutulmalıdır. Güvenilirlik puanı olaylardan türetilmeli; yönetici doğrudan puan değiştirememelidir.

**Uygulama durumu (4 Ekim 2026):** İşletme iptali neden, yapan kullanıcı, ilgili çalışan, iptal zamanı, randevuya kalan dakika ve 0–3 puanla ayrı denetim olayına yazılıyor; müşteri nedenli iptaller bu hesaba girmiyor. Müşteriye neden ve cezasızlık bilgisi bildirim/randevu detayında gösteriliyor. Son 90 gün puanı yönetimde görülüyor. 3 puanda uyarı, 5 puan aynı çalışanda birikirse owner program doğrulamasına dek o çalışanın yeni slotlarının kapanması, işletmeye yayılmışsa 7 günlük hafif keşfet geri sıralaması, 8 puanda 72 saat ve ikinci 8 puanda 7 gün yeni randevu kısıtı backend'de uygulanıyor. Mevcut randevular korunuyor. İşletme sahibi/yöneticisi puanlı iptale bir kez gerekçeli itiraz açabiliyor; platform moderatörü platform arızası, mücbir sebep veya doğrulanmış hata nedeniyle kabul/reddedebiliyor. Kabul edilen kayıt son 90 gün puanından çıkarılıyor ve artık eşiği karşılamayan aktif yaptırımlar çözülüyor; karar başvurana bildiriliyor. İnceleme sürerken mevcut yaptırım devam ediyor. İşletme iptalinde müşteri detay ekranı aynı hizmet için aynı işletmenin önümüzdeki yedi gündeki müsait saatlerini gösteriyor; seçim yeni randevu akışına taşınıyor ve müşteri son onayı veriyor. Uygun saat yoksa aynı hizmeti sunan yakındaki açık profilli işletmeler gösteriliyor. İptal → alternatif saat → yeniden rezervasyon, başka hesabın erişim reddi ve işletme kapanınca önerilerin kapanması backend E2E'de doğrulandı. Operasyon için moderatör hesabı ayrıca tanımlanmalı. Müşteri talebini doğrulama, iptal öncesi işletmenin alternatif teklif akışı, ceza/itiraz E2E sınırları ve gerçek cihaz kontrolü henüz tamamlanmadı.

**Görünürlük ve açıklama güncellemesi (5 Ekim 2026):** İptal onayından önce oluşması beklenen puan Trimly temalı uyarıda gösteriliyor; işlemden sonra backend'in hesapladığı kesin puan, son 90 günlük toplam ve tetiklenen yaptırımlar sonuç kartında açıklanıyor. İşlemi yapan kullanıcı doğrudan sonucu görürken diğer aktif owner/manager kullanıcılarına uygulama içi ve push bildirim gönderiliyor. Yönetimde puan sıfır olsa da görünen kalıcı **İşletme Güvenilirliği** girişi; puanlama kurallarını, 3/5/8 eşiklerini, aktif yaptırımları, ayrıntılı iptal geçmişini ve itiraz durumunu tek ekranda topluyor. İptal olayındaki `pointReason` snapshot'ı sayesinde geçmiş kayıt açıklaması daha sonra kural değişse bile aynı kalıyor. Bildirim, puan nedeni, toplam ve yaptırım cevabı birim/E2E testleriyle doğrulandı; açık/koyu tema ve küçük ekran gerçek cihaz turu açık.

**Sadeleştirme güncellemesi (6 Ekim 2026):** Zaman puanı 24+, 6–24, 2–6 ve 2 saat altı aralıklarına ayrıldı. Günlük iptal yoğunluğu, aynı çalışandaki yoğunluk, art arda işletme iptali ve son 7 gündeki puansız erken iptaller ayrı ceza üretmeyen davranış sinyallerine dönüştürüldü. Güvenilirlik ekranı; zaman puanı, puanlara göre yaptırımlar, 30 günlük oran ve operasyon sinyallerini birbirinden ayırıyor. On sonuçlanan kayıttan önce oran yalnız bilgi amaçlıdır; oran bazlı otomatik yaptırım veri görülmeden açılmayacaktır. 5 puandaki işletme geneli keşfet etkisi 14 günden 7 günlük hafif düşüşe indirildi.

**E2E kontrolü (4 Ekim 2026):** Dört kısa süreli iptalin 8 puana ulaşması; 3 puan uyarısı, 5 puan çalışan kontrolü ve 8 puan yeni rezervasyon kısıtı doğrulandı. Yetkisiz inceleme reddediliyor; haklı itiraz puanı 6'ya indirince rezervasyon kısıtı çözülürken çalışan kontrolü kalıyor. İkinci 8 puan eşiği, gerçek cihaz ve operasyon moderatörü kurulumu açık.

### 3. Tıraş kaydı ve fotoğraf gizliliği

Bu alan müşteri verisi olduğu için en sıkı kurallar burada uygulanır.

- Berber yalnız **tamamlanmış** ve kendisine atanmış randevu için tıraş sonucu taslağı başlatabilir.
- İşletme fotoğrafı yalnız uygulama içi kamera ile çekilir; cihaz galerisi seçimi işletme tarafında kapalı kalır.
- Bir tıraş kaydına müşteri izniyle farklı açılardan art arda fotoğraf eklenebilir; toplam sınır 8 fotoğraftır. Fotoğraf eklemek kaydı kendiliğinden sonuçlandırmaz.
- İşletme fotoğrafı, randevunun tamamlanmasından sonraki 1 dakika içinde eklenebilir. Bu pencere kapandıktan sonra fotoğraf eklenemez; sonuçlandırılmamış kaydın metin notları düzenlenebilir.
- Kamera açılmadan önce çalışanın müşteriden izin aldığını onaylaması gerekir. Fotoğraf eklemek randevuyu tamamlama şartı değildir.
- Berber not/fotoğraf taslağını kaydedene kadar düzenleyebilir. Kaydı **sonuçlandırdıktan sonra** işletme tarafı not, fotoğraf ve modeli değiştiremez veya yeni fotoğraf ekleyemez.
- Tamamlanmış fakat sonuçlandırılmış tıraş kaydı bulunmayan randevu “Tıraş kaydı bekliyor” olarak işaretlenir; işletme randevu ekranındaki görev kartından doğrudan kayda gider. Fotoğraf yine zorunlu değildir ve müşteri iznine bağlıdır.
- Müşteri kendi geçmişinden sonradan fotoğraf ekleyebilir; bu fotoğraf `CUSTOMER` kaynaklıdır, işletme/berber API cevaplarında hiç görünmez.
- İşletme, müşterinin özel tıraş fotoğraflarını müşteriler ekranından veya geçmiş kaydından görüntüleyemez.
- Özel geçmiş fotoğrafı ile public portföy fotoğrafı iki ayrı rızadır. Portföy talebi müşteri uygulamasında açıkça kabul edilmeden fotoğraf yayınlanmaz; müşteri izni dilediği anda geri çekebilir.

**Teknik karar:** İşletme kaydına `DRAFT` / `FINALIZED` yaşam döngüsü ve `finalizedAt`, fotoğrafa `uploadedBy` alanı eklenmeli; fotoğraf ekleme/düzenleme endpoint'leri bu durumla backend'de kilitlenmelidir.

### 4. Yorum, puan ve portföy

- Yalnız `COMPLETED` randevunun müşterisi bir yorum bırakabilir; randevu başına en fazla bir yorum vardır.
- Yorum 1–5 yıldız, opsiyonel metin ve en fazla üç yorum fotoğrafından oluşur. Müşteri sonradan güncelleyebilir veya silebilir.
- İşletme ve çalışan genel puanı yorumların düz ortalaması değildir. Önce her müşterinin ilgili işletme/çalışan için verdiği bütün puanların ortalaması alınır, ardından müşteri ortalamaları eşit ağırlıkla ortalanır. Böylece aynı müşterinin çok sayıdaki ziyareti genel puanı orantısız biçimde değiştiremez.
- Public özette toplam yorum sayısı ile puana katılan benzersiz müşteri sayısı ayrı tutulur; yorum silme veya güncelleme sonrasında puan bu kuralla yeniden türetilir.
- Public yorumda müşterinin soyadı maskelenir. Berber/işletme yanıtı ve şikâyet/moderasyon, ilk sürümden sonra açılır.
- Portföyde yalnız yayın izni verilmiş işletme kamerası fotoğrafları görünür. Müşterinin kendi eklediği fotoğraf otomatik portföye taşınmaz.

### 5. Rol, erişim ve davet

- `OWNER` sahiplik, yayın, erişim kodu, çalışan ve ayarları yönetebilir.
- `MANAGER` yalnız açıkça verilen yönetim yetkilerini kullanır; sahiplik devredemez ve owner hesabını silemez.
- `BARBER` yalnız kendisine atanan randevulara, `APPRENTICE` ise varsayılan olarak randevuya kapalıdır.
- Davet kodu tek kullanımlık, süreli ve role bağlıdır. Davet kabul edilince kod tekrar kullanılamaz.
- İşletme erişim kodu ile çalışan davet kodu ayrı amaçlardır; biri diğerinin yerine kullanılamaz.

### 6. Kampanya ve fiyat kuralları

- Kampanyayı yalnız yetkili işletme oluşturur; müşteri kampanya tanımlayamaz.
- Kampanya, yüzde/sabit tutar indirim, hediye hizmet veya sadakat kuralı türlerinden biriyle açıkça tanımlanır.
- Randevu sırasında kampanya uygunluğu backend'de tekrar hesaplanır; uygulamadaki eski ekran verisi tek başına indirim sağlamaz.
- İndirim tutarı, kampanya açıklaması ve kullanılan kampanya randevu snapshot'ına kaydedilir.
- Süresi biten, kotası dolan veya hizmeti pasifleşen kampanya yeni randevuda kullanılamaz.

## P1 — Karar verilmesi gereken katı kurallar

Bu bölümdeki maddeler yapılacaklar listesidir; ürün kararı kesinleşmeden doğrudan geliştirmeye alınmaz. Karar verildiğinde ilgili madde P0 altındaki kalıcı kurala taşınır, backend doğrulaması ve test senaryosu birlikte yazılır.

### 1. Geç kalma ve hizmete başlama

- Müşteri için ücretsiz bekleme süresi ve hangi dakikadan sonra `NO_SHOW` işleminin açılacağı kesinleştirilecek.
- Müşteri geç kaldığında hizmetin kısaltılması, sonraki randevuyu etkilemeyecek saate taşınması veya iptal edilmesi seçenekleri belirlenecek.
- Berber/işletme geciktiğinde müşterinin ne kadar bekleyeceği; cezasız ayrılma, alternatif çalışan ve yeniden planlama hakları tanımlanacak.
- Randevunun gerçek `startedAt` zamanı tutulacak; erken başlatma, geriye dönük oynama ve sahte gecikme kayıtları engellenecek.

### 2. Randevuyu tamamlama doğrulaması

- Randevu başlangıç saati gelmeden `COMPLETED` yapılamayacak; tamamlamanın kim tarafından ve ne zaman yapıldığı tutulacak.
- `CANCELLED` veya `NO_SHOW` kayıt tamamlanmışa çevrilemeyecek; yanlış işlem düzeltmesi normal durum değişikliği yerine denetimli itiraz akışıyla yapılacak.
- Sahte tamamlamanın puan, yorum hakkı, tamamlanan işlem sayısı ve ileride gelir/ödeme raporlarını etkilemesi önlenecek.
- Gerekirse müşteriye “Randevunuz gerçekleşti mi?” doğrulaması gönderilecek; cevap vermemesi tek başına işletmeyi cezalandırmayacak.

### 3. Ek hizmet, süre ve fiyat onayı

- Randevu sırasında eklenen hizmet, yeni toplam fiyat ve tahmini bitiş süresi müşteriye gösterilip açık onay alınacak.
- Müşteri onayı olmadan ek hizmet veya ücret kaydedilemeyecek; onaylanan değerler randevu snapshot'ına yazılacak.
- Ek süre sonraki randevuyla çakışıyorsa sistem onaya izin vermeyecek veya güvenli bir çözüm önerecek.
- Ücretsiz ikram, indirim ve fiyat artışı birbirinden ayrı olay türleri olarak tutulacak.

### 4. Çalışanın ayrılması veya randevuya kapanması

**Uygulama durumu (8 Ekim 2026):** İki aşamalı kapanış uygulanır. Çalışan önce açık onayla yalnız yeni rezervasyonlara kapatılır; mevcut randevular iptal edilmez veya aktarılmaz. Gelecek/devam eden randevu ya da başlayan hizmet varken pasife alma ve çırak rolüne geçiş backend tarafından engellenir. Çalışan düzenleme ekranı kalan randevuları ve teklif bekleme durumunu gösterir; mevcut teklif/detay akışlarına yönlendirir. Müşteri kabul ederse atama değişir; reddederse mevcut cezasız müşteri iptali yolu kullanılır, işletme iptalinin güvenilirlik kuralları korunur. Aynı anda rezervasyon veya teklif kabulü sırasında kapanan çalışana yeni randevu yazılmaması için ortak işletme kilidi ve son durum doğrulaması vardır. Üyelik ve geçmiş kayıtları silinmez. Kalıcı isim/rol/fotoğraf snapshot'ı ve gerçek cihaz uçtan uca kontrolü ayrıca açıktır.

- Çalışan pasife alındığında gelecekteki randevular sessizce başka çalışana aktarılmayacak.
- Müşteriye alternatif çalışan/saat teklifi gönderilecek; müşteri kabul etmeden atama değişmeyecek.
- Müşteri alternatifi reddederse cezasız iptal hakkı olacak ve olay müşteri iptal sayacını etkilemeyecek.
- Ayrılan çalışan geçmiş kayıtlarda ad/rol snapshot'ıyla görünmeye devam edecek; geçmiş randevular yeni çalışana yazılmayacak.

### 5. Yorum, puan ve moderasyon kötüye kullanımı

- Hakaret, kişisel veri, tehdit, sahte yorum ve yorum silme baskısı için şikâyet kategorileri ve inceleme süreleri belirlenecek.
- İşletme yoruma yanıt verebilecek ancak müşterinin puanını veya metnini değiştiremeyecek.
- Moderasyon işlemleri neden, aktör ve zaman bilgisiyle denetim kaydına yazılacak; yorumun silinmesi ile görünmez yapılması ayrılacak.
- Sahte tamamlanmış randevu üzerinden puan üretme ve karşılıklı puan manipülasyonu tespit edilecek.

### 6. Fotoğraf iznini geri çekme ve veri yaşam döngüsü

- Portföy izni geri çekildiğinde fotoğraf public alanlardan gecikmeden kaldırılacak.
- Özel tıraş geçmişindeki fotoğrafın silinmesi ile portföyden kaldırılması farklı işlemler olacak.
- Fotoğraf onayı; izin türü, veren hesap, zaman ve ilgili randevuyla birlikte saklanacak. Çalışanın yalnızca kutu işaretlemesi public yayın izni sayılmayacak.
- Reşit olmayan katılımcılarda veli onayının kapsamı ve saklama süresi ayrıca tanımlanacak.

### 7. Hesap, işletme ve sahiplik yaşam döngüsü

- Aktif veya yaklaşan randevusu bulunan kullanıcı/işletmenin silme akışı, önce randevuları güvenli biçimde sonuçlandıracak.
- İşletme kapanırsa gelecek randevular bilgilendirilerek iptal edilecek ve müşteriye alternatifler gösterilecek.
- Owner ayrılmadan önce sahipliği devretmek veya işletmeyi kapatmak zorunda olacak; ownersız işletme bırakılamayacak.
- Kullanıcıya gösterilen içerik, denetim kayıtları ve ilerideki mali kayıtlar için ayrı saklama/silme süreleri belirlenecek.

### 8. Spam, ceza aşma ve sahtecilik

- Seri randevu oluşturma/iptal etme, davet kodu deneme ve doğrulama isteklerine hız sınırı konacak.
- Yeni hesap veya bağımlı profil açarak aktif cezayı aşma girişimleri risk kontrolüne alınacak.
- İlk randevudan önce telefon numarası SMS koduyla doğrulanacak; yalnız hesaba yazılmış, doğrulanmamış numara ceza eşleştirmesinde kullanılmayacak. Numara değişikliği de yeni numaranın doğrulanmasını gerektirecek.
- Kesinleşmiş no-show nedeniyle oluşan **aktif ve süreli randevu kısıtlaması**, aynı doğrulanmış telefon numarasıyla açılan yeni hesapta da uygulanacak. İhlal geçmişi yeni hesaba otomatik aktarılmayacak; kısıtlama süresi bitince bağlantılı engel kalkacak. İtiraz ve numaranın yeni sahibine geçmiş olma ihtimali için manuel inceleme yolu olacak.
- Cihaz kimliği veya aynı cihazdan çoklu hesap açılması yalnız ek risk sinyali sayılacak; tek başına otomatik/kalıcı ban nedeni olmayacak. Gerekirse ek doğrulama veya manuel inceleme istenecek. Push token cihaz kimliği olarak kullanılmayacak.
- Uygulama geneli hesap kapatma yerine önce mevcut no-show eşiklerine bağlı, süresi belirli **yeni randevu alma kısıtlaması** uygulanacak; yanlış eşleşme ve itirazlar çözülebilecek.
- Sahte çalışan, sahte tamamlanmış randevu, sahte no-show ve puan manipülasyonu için inceleme sinyalleri tanımlanacak.
- Otomatik kısıtlama ile manuel inceleme gerektiren durumlar ayrılacak; kullanıcıya itiraz yolu sunulacak.

### 9. Ödeme ve kapora politikası

Ödeme altyapısı geliştirilmeden önce aşağıdaki kararlar birlikte kesinleştirilecek:

- Kaporanın kim tarafından tutulduğu, işletmeye ne zaman aktarıldığı ve Trimly komisyonu.
- Müşteri iptali, işletme iptali, no-show ve mücbir sebepte iade oranları.
- İtiraz, ters ibraz, başarısız iade ve çift tahsilat akışları.
- Vergi/belge sorumluluğu, finansal kayıtların saklama süresi ve hesap kapatmanın bu kayıtlara etkisi.

### Uygulama sırası

1. Geç kalma, hizmete başlama ve tamamlama doğrulaması.
2. Ek hizmet, süre ve fiyat onayı.
3. Çalışanın ayrılması/pasife alınması durumundaki gelecek randevular.
4. Fotoğraf rızası ve hesap/işletme veri yaşam döngüsü.
5. Moderasyon, sahtecilik ve ceza aşma kontrolleri.
6. Ödeme özelliğinden hemen önce kapora ve iade politikası.

## P2 — İşletme içi berber profili

**Son ürün kararı (8 Ekim 2026):** Berberin ayrı düzenlediği bir profil olmayacak. Owner/manager profilindeki Benim Profilim / İşletme sekmeleri, Berber Profilim hızlı işlemi ve biyografi düzenleme kaldırıldı. Müşterinin işletme içinden gördüğü berber sayfası hesap adı/fotoğrafı, rol, atanmış hizmetler, randevu durumu, doğrulanmış puan/yorum ve izinli portföyden otomatik oluşturulur. Berber için Hakkında bölümü yoktur; işletmenin Hakkında bölümü korunur. İşletme ayarları Yönetim'de, kişisel hesap düzenlemesi normal profil akışında kalır.

Berberin ayrı global sosyal hesabıyla değil, önce çalıştığı işletmenin içinde açılmalı. Böylece müşteri işletmeye girdikten sonra “beni kim kesecek?” sorusunu yanıtlar ve randevu akışında o çalışan seçili gelir.

İlk sürüm içeriği:

- Hesap fotoğrafı, ad ve işletmedeki rol.
- Çalıştığı işletme ve randevuya açık durumu.
- Bu işletmedeki doğrulanmış ortalama puan, yorum sayısı ve tamamlanan randevu sayısı.
- Verdiği hizmetler.
- Açık rızalı portföy fotoğrafları ve son yorumlar.
- Tek CTA: **Bu berberden randevu al**; hizmet/çalışan seçimini önceden doldurur.

Gösterilmez: telefon/e-posta, gelir, iptal oranı, müşteri listesi, izinsiz müşteri fotoğrafları ve başka işletmelerle karışmış puanlar.

Mevcut veri modeli yorumun bağlı olduğu `businessMember` bilgisini zaten taşıyor. İlk teknik iş, public member-detail endpoint'i ile üye bazında tamamlanan randevu ve yorum özetini hesaplamaktır.

## P3 — `Yakında` etiketli işler

Bir özellik etiketini kaldırmak için yalnız ekran değil, gerçek veri ve davranış tamamlanmış olmalı.

1. **Randevu değişiklik bildirimleri:** Saat/çalışan/iptal değişiminde gerçek push ve tercih anahtarı.
   - 2 saat hatırlatması yalnız randevu bu eşikten önce oluşturulmuş veya son saatine taşınmışsa gönderilir; iki saatten az kala alınan randevuya geriye dönük hatırlatma gönderilmez.
2. **Favori berber bildirimleri:** Favori işletmenin yeni slotu, yeni hizmeti veya kampanyası için izinli bildirim.
3. **Uygulama duyuruları:** Segmentli duyuru altyapısı, gönderim kaydı ve kullanıcı tercihi.
4. **Bağlı hesaplar:** Apple/Google bağlama, güvenli hesap birleştirme ve ayırma.
5. **Abonelik planları:** Önce Plus kapsamı, fiyatlandırma, ödeme sağlayıcısı, iade/iptal ve erişim kontrolü netleşmeli.
6. **Konum tercihi:** Yakındaki işletmeler zaten çalışır; uygulama ayarlarındaki kalıcı konum/izin yönetimi ayrı tamamlanmalı.
7. **Yorum moderasyonu:** Berber yanıtı, şikâyet, gizleme ve yönetim incelemesi.
8. **Atlanabilir ilk kullanım rehberi:** Müşteri ilk girişi, işletme oluşturma ve işletme kurulduktan sonraki yönetim ekranları ayrı tanıtım akışlarına sahip olmalı. Rehber ekran üzerindeki önemli alanları adım adım vurgulamalı, istenirse atlanabilmeli ve ayarlardan yeniden başlatılabilmeli. Tanıtım rehberi zorunlu işletme kurulum kontrol listesinden ayrı tutulmalı; tamamlandı/atlandı durumu profil türü ve rehber sürümü bazında saklanmalı.

## P4 — Plus için kısa karar

Plus'ın omurgası: **Akıllı Stil Hafızası + Son Tıraşı Tekrarla + Öncelikli boş slot + kişisel berber/stil eşleştirmesi**.

Temel randevu, geçmiş, favori, normal kampanya, yorum ve stil keşfi ücretsiz kalır. Plus; otomasyon, kişiselleştirme ve zaman kazancı satar, temel erişimi satmaz.

## Uygulama kontrol listesi

Her yeni kural için aşağıdakiler tamamlanmadan “bitti” sayılmaz:

- Backend DTO/servis/guard doğrulaması.
- Mobilde doğru boş durum, disabled durum ve açıklayıcı hata mesajı.
- Rol matrisi testi.
- Tarih/saat ve eşzamanlı istek testi gerekiyorsa E2E senaryosu.
- Fotoğraf veya kişisel veri varsa erişim ve silme testi.
