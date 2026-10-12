CREATE OR REPLACE FUNCTION "enforceAppointmentDailyAttendeeLimit"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  attendee_key TEXT;
BEGIN
  IF NEW."status" = 'CANCELLED' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE'
    AND OLD."status" <> 'CANCELLED'
    AND OLD."customerId" = NEW."customerId"
    AND OLD."dependentProfileId" IS NOT DISTINCT FROM NEW."dependentProfileId"
    AND OLD."appointmentLocalDate" = NEW."appointmentLocalDate"
  THEN
    RETURN NEW;
  END IF;

  attendee_key := CASE
    WHEN NEW."dependentProfileId" IS NULL
      THEN 'self:' || NEW."customerId"
    ELSE 'dependent:' || NEW."dependentProfileId"
  END;

  PERFORM pg_advisory_xact_lock(
    hashtextextended(attendee_key || ':' || NEW."appointmentLocalDate"::TEXT, 0)
  );

  IF EXISTS (
    SELECT 1
    FROM "Appointment" AS existing
    WHERE existing."id" <> NEW."id"
      AND existing."status" <> 'CANCELLED'
      AND existing."appointmentLocalDate" = NEW."appointmentLocalDate"
      AND (
        (
          NEW."dependentProfileId" IS NULL
          AND existing."dependentProfileId" IS NULL
          AND existing."customerId" = NEW."customerId"
        )
        OR (
          NEW."dependentProfileId" IS NOT NULL
          AND existing."dependentProfileId" = NEW."dependentProfileId"
        )
      )
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '23505',
      CONSTRAINT = 'Appointment_daily_attendee_limit',
      MESSAGE = 'An attendee can only have one appointment per local date.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "Appointment_daily_attendee_limit_trigger"
BEFORE INSERT OR UPDATE OF "customerId", "dependentProfileId", "appointmentLocalDate", "status"
ON "Appointment"
FOR EACH ROW
EXECUTE FUNCTION "enforceAppointmentDailyAttendeeLimit"();
