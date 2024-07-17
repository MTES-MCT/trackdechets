import { Prisma } from "@prisma/client";
import { CompanyType, WasteProcessorType } from "@prisma/client";

/**
 *
 *  Select CREMATORIUM companies
 *  Add CREMATION to wasteProcessorTypes
 *  Add WASTEPROCESSOR to companyTypes if needed
 *  Remove CREMATORIUM from companyTypes
 */
export async function run(tx: Prisma.TransactionClient) {
  const crematoriums = await tx.company.findMany({
    where: {
      companyTypes: { has: CompanyType.CREMATORIUM }
    }
  });
  // prisma does not provide array item removing, we have to update the few relevant companies one by one to update companyTypes
  for (const crematorium of crematoriums) {
    await tx.company.update({
      where: { id: crematorium.id },
      data: {
        wasteProcessorTypes: { push: WasteProcessorType.CREMATION },
        companyTypes: [
          ...crematorium.companyTypes.filter(
            type => type !== CompanyType.CREMATORIUM
          ),
          CompanyType.WASTEPROCESSOR
        ]
      }
    });
  }
}
