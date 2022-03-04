UPDATE "default$default"."Company" SET "orgId" = "siret";
UPDATE "default$default"."Company" SET "orgRegistry" = 'SIRENE';
ALTER TABLE "default$default"."Company" ALTER "orgIdRegistry" "default$default"."OrgRegistry" SET NOT NULL;
