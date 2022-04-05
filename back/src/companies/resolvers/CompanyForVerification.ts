import { UserRole } from "@prisma/client";
import { CompanyForVerificationResolvers } from "../../generated/graphql/types";
import prisma from "../../prisma";

const companyForVerificationResolvers: CompanyForVerificationResolvers = {
  admin: async parent => {
    // returns first admin who joined
    const admin = await prisma.companyAssociation
      .findFirst({
        where: { company: { id: parent.id }, role: UserRole.ADMIN }
      })
      .user();
    return admin;
  }
};

export default companyForVerificationResolvers;
