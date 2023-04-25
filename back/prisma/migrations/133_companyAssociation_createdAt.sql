ALTER TABLE
    "default$default"."CompanyAssociation"
ADD COLUMN
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
   
UPDATE 
	"default$default"."CompanyAssociation"
SET "createdAt" = null;