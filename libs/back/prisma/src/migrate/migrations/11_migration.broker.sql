CREATE TABLE "default$default"."BrokerReceipt"
(
    id              varchar(30)  not null constraint "BrokerReceipt_pkey" primary key,
    "receiptNumber" text         not null,
    "validityLimit" timestamp(3) not null,
    department      text         not null
);

ALTER TABLE "default$default"."BrokerReceipt"
    OWNER TO trackdechets;

ALTER TABLE "default$default"."Company"
    ADD COLUMN "brokerReceiptId" varchar(30);

ALTER TABLE "default$default"."Company"
    ADD CONSTRAINT Company_brokerReceipt_fkey
        FOREIGN KEY ("brokerReceiptId") references "default$default"."BrokerReceipt" (id) ON DELETE SET NULL ;

ALTER TABLE "default$default"."Form" ADD "brokerCompanyName" text;
ALTER TABLE "default$default"."Form" ADD "brokerCompanySiret" text;
ALTER TABLE "default$default"."Form" ADD "brokerCompanyAddress" text;
ALTER TABLE "default$default"."Form" ADD "brokerCompanyContact" text;
ALTER TABLE "default$default"."Form" ADD "brokerCompanyPhone" text;
ALTER TABLE "default$default"."Form" ADD "brokerCompanyMail" text;
ALTER TABLE "default$default"."Form" ADD "brokerReceipt" text;
ALTER TABLE "default$default"."Form" ADD "brokerDepartment" text;
ALTER TABLE "default$default"."Form" ADD "brokerValidityLimit" timestamp(3);

ALTER TABLE "default$default"."Company" ALTER COLUMN "companyTypes" TYPE VARCHAR(255);
DROP TYPE IF EXISTS "default$default"."CompanyType";
CREATE TYPE "default$default"."CompanyType" AS ENUM ('PRODUCER', 'COLLECTOR', 'WASTEPROCESSOR', 'TRANSPORTER', 'WASTE_VEHICLES', 'WASTE_CENTER', 'TRADER', 'ECO_ORGANISME', 'BROKER');
ALTER TABLE "default$default"."Company" ALTER COLUMN "companyTypes" TYPE "default$default"."CompanyType"[] USING ("companyTypes"::"default$default"."CompanyType"[]);
