import { libelleFromCodeNaf } from "../../companies/sirene/utils";
import type { UserResolvers, CompanyPrivate } from "@td/codegen-back";
import { prisma } from "@td/prisma";
import { toGqlCompanyPrivate } from "../../companies/converters";
import { getUserRoles } from "../../permissions";

const userResolvers: UserResolvers = {
  // Indique si le TOTP est activé sur le compte
  totpEnabled: parent => {
    const p = parent as {
      totpActivatedAt?: Date | null;
      totpSeed?: string | null;
    };
    return !!p.totpActivatedAt && !!p.totpSeed;
  },

  // A User can be resolved through queries other than `me`, so `parent` is not
  // necessarily the authenticated user. Only return companies the authenticated
  // user also belongs to to prevent exposing private data such as `securityCode`.
  // ticket tra-18691
  companies: async (parent, _, context) => {
    const userId = context.user!.id;
    const roles = await getUserRoles(userId);
    const userOrgIds = Object.keys(roles);

    const companyAssociations = await prisma.companyAssociation.findMany({
      where: {
        userId: parent.id,
        company: {
          orgId: {
            in: userOrgIds
          }
        }
      },
      include: { company: true }
    });

    const companies = companyAssociations.map(association => ({
      ...association.company,
      userRole: association.role
    }));

    return companies.map(async company => {
      const companyPrivate: CompanyPrivate = toGqlCompanyPrivate(company);

      const { codeNaf: naf, address } = company;
      const libelleNaf = libelleFromCodeNaf(naf!);

      return { ...companyPrivate, naf, libelleNaf, address };
    });
  },
  featureFlags: async ({ id }) => {
    const featureFlags = await prisma.user
      .findUnique({ where: { id } })
      .featureFlags({ where: { enabled: true } });

    return featureFlags?.map(ff => ff.name) ?? [];
  }
};

export default userResolvers;
