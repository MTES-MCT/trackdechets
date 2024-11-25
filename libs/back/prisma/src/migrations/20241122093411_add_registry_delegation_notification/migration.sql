-- AlterTable
ALTER TABLE "CompanyAssociation" ADD COLUMN     "notificationIsActiveRegistryDelegation" BOOLEAN NOT NULL DEFAULT false;

-- Notifications are on by default for admins
update "CompanyAssociation" set "notificationIsActiveRegistryDelegation" = true where "role" = 'ADMIN';