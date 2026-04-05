-- CreateEnum
CREATE TYPE "ServiceCategory" AS ENUM ('HVAC', 'PLUMBING', 'ELECTRICAL', 'PEST_CONTROL', 'CLEANING', 'LANDSCAPING', 'GENERAL_REPAIR', 'PAINTING', 'ROOFING', 'SECURITY');

-- AlterTable
ALTER TABLE "MaintenanceRequest" ADD COLUMN     "vendorAssignedAt" TIMESTAMP(3),
ADD COLUMN     "vendorId" TEXT;

-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "serviceCategories" "ServiceCategory"[];

-- CreateIndex
CREATE INDEX "MaintenanceRequest_vendorId_idx" ON "MaintenanceRequest"("vendorId");

-- CreateIndex
CREATE INDEX "Vendor_serviceCategories_idx" ON "Vendor"("serviceCategories");

-- AddForeignKey
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
