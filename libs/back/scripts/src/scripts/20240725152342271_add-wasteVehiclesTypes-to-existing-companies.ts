import { CompanyType, Prisma, WasteVehiclesType } from "@prisma/client";

/**
 * Set wasteVehiclesTypes based on provided agreements
 */
export async function run(tx: Prisma.TransactionClient) {
  const vhuCompanies = await tx.company.findMany({
    where: {
      companyTypes: { has: CompanyType.WASTE_VEHICLES }
    },
    select: {
      id: true,
      vhuAgrementBroyeurId: true,
      vhuAgrementDemolisseurId: true
    }
  });

  for (const vhuCompany of vhuCompanies) {
    const wasteVehiclesTypes: WasteVehiclesType[] = [];

    if (vhuCompany.vhuAgrementBroyeurId) {
      wasteVehiclesTypes.push(WasteVehiclesType.BROYEUR);
    }

    if (vhuCompany.vhuAgrementDemolisseurId) {
      wasteVehiclesTypes.push(WasteVehiclesType.DEMOLISSEUR);
    }

    if (wasteVehiclesTypes.length) {
      await tx.company.update({
        where: { id: vhuCompany.id },
        data: {
          wasteVehiclesTypes
        }
      });
    }
  }
}
