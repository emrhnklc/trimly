ALTER TABLE "DependentProfile"
ADD COLUMN "relationshipLabel" TEXT;

UPDATE "DependentProfile"
SET "relationshipLabel" = 'Yakınım'
WHERE "relationship" = 'DEPENDENT';
