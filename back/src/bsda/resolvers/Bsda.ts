import { BsdaResolvers } from "../../generated/graphql/types";
import prisma from "../../prisma";

export const Bsda: BsdaResolvers = {
  associations: async parent => {
    const bsdas = await prisma.bsda.findMany({
      where: {
        childBsdaId: parent.id
      }
    });

    return bsdas.map(bsda => ({
      id: bsda.id,
      status: bsda.status,
      cap: bsda.destinationCap,
      wasteCode: bsda.wasteCode,
      wasteDescription: [
        bsda.wasteName,
        bsda.wasteFamilyCode,
        bsda.wasteMaterialName
      ]
        .filter(Boolean)
        .join(" - "),
      wasteSealNumbers: bsda.wasteSealNumbers,
      wasteAdr: bsda.wasteAdr,
      totalQuantity: bsda.destinationReceptionQuantityValue,
      emissionDate: bsda.emitterEmissionSignatureDate
    }));
  }
};
