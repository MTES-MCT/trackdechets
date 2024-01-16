-- AddColumns
ALTER TABLE "default$default"."Company"
    ADD COLUMN "vhuAgrementDemolisseurId" VARCHAR(40),
    ADD COLUMN "vhuAgrementBroyeurId" VARCHAR(40);

-- CreateTable
CREATE TABLE "default$default"."VhuAgrement" (
    "id" VARCHAR(40) NOT NULL,
    "agrementNumber" VARCHAR(50) NOT NULL,
    "department" VARCHAR(50) NOT NULL,

    PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "default$default"."Company" ADD FOREIGN KEY ("vhuAgrementDemolisseurId") REFERENCES "default$default"."VhuAgrement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "default$default"."Company" ADD FOREIGN KEY ("vhuAgrementBroyeurId") REFERENCES "default$default"."VhuAgrement"("id") ON DELETE SET NULL ON UPDATE CASCADE;