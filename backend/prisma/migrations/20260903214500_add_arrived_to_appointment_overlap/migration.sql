-- ARRIVED randevuları da çalışan takviminde dolu zaman aralığıdır.
-- Availability katmanıyla veritabanı kuralını aynı duruma getiririz.
ALTER TABLE "Appointment"
DROP CONSTRAINT "Appointment_member_time_no_overlap";

ALTER TABLE "Appointment"
ADD CONSTRAINT "Appointment_member_time_no_overlap"
EXCLUDE USING GIST (
    "businessMemberId" WITH =,
    tsrange("startsAt", "endsAt", '[)') WITH &&
)
WHERE ("status" IN ('CONFIRMED', 'ARRIVED', 'COMPLETED', 'NO_SHOW'));
