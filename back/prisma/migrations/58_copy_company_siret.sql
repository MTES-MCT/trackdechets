UPDATE "default$default"."Company" SET "orgId" = "siret";
UPDATE "default$default"."Company" SET "orgIdRegistry" = 'SIRENE';
ALTER TABLE "default$default"."Company" ALTER "orgIdRegistry" SET NOT NULL;
ALTER TABLE "default$default"."Company" ALTER "orgId" SET NOT NULL;
