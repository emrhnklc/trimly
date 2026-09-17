# Yayına Hazırlık / Polish Listesi

## Veri dışa aktarma

- Mevcut JSON çıktısı teknik veri taşınabilirliği için korunacak.
- Kullanıcıya ayrıca okunabilir bir PDF özet sunulacak: profil, randevu özeti, favoriler ve stil geçmişi.
- Randevular için gerekirse Excel/CSV dökümü seçeneği eklenecek.
- İndirme ekranında kullanıcı hangi çıktıyı istediğini seçebilecek; JSON varsayılan kullanıcı deneyimi olmayacak.

## Kontrol edilecekler

- Gerçek cihazda PDF/CSV paylaşımı ve Dosyalar uygulamasına kaydetme.
- Dışa aktarılan içerikte şifre, oturum, erişim kodu ve diğer gizli alanların bulunmadığını tekrar denetleme.

## Hesap silme kuralları

- İşlem, kayıtlı e-postaya gönderilen tek kullanımlık kodla doğrulanacak.
- Müşterinin profil, favori, bildirim, oturum ve stil verileri silinecek.
- Geçmiş randevular işletme kaydında korunacak; müşteri kişisel bilgileri anonimleştirilecek.
- Gelecekteki onaylı randevular silme öncesi iptal edilecek.
- İşletme sahibi hesaplarında sahiplik devri zorunlu olacak. Devralacak kimse yoksa işletme silme, ayrı ve açık onayla yürütülecek.
