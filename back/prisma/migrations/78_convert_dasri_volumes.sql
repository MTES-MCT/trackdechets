-- AlterTable
ALTER TABLE "default$default"."Bsdasri"
	ALTER COLUMN "emitterWasteVolume" SET DATA TYPE DOUBLE PRECISION USING "emitterWasteVolume"::float,
	ALTER COLUMN "transporterWasteVolume" SET DATA TYPE DOUBLE PRECISION USING "transporterWasteVolume"::float,
	ALTER COLUMN "destinationReceptionWasteVolume" SET DATA TYPE DOUBLE PRECISION USING "destinationReceptionWasteVolume"::float;