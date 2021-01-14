import prisma from "src/prisma";
import { checkIsAuthenticated } from "../../../common/permissions";
import { QueryResolvers } from "../../../generated/graphql/types";
import { getUserCompanies } from "../../../users/database";

const statsResolver: QueryResolvers["stats"] = async (
  parent,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);

  const userCompanies = await getUserCompanies(user.id);

  return userCompanies.map(async userCompany => {
    const queriedForms = await prisma.form.findMany({
      where: {
        OR: [
          { owner: { id: user.id } },
          { recipientCompanySiret: userCompany.siret },
          { emitterCompanySiret: userCompany.siret }
        ],
        status: "PROCESSED",
        isDeleted: false
      }
    });

    const stats = queriedForms.reduce((prev, cur) => {
      prev[cur.wasteDetailsCode] = prev[cur.wasteDetailsCode] || {
        wasteCode: cur.wasteDetailsCode,
        incoming: 0,
        outgoing: 0
      };
      cur.recipientCompanySiret === userCompany.siret
        ? (prev[cur.wasteDetailsCode].incoming += cur.quantityReceived)
        : (prev[cur.wasteDetailsCode].outgoing += cur.quantityReceived);

      prev[cur.wasteDetailsCode].incoming =
        Math.round(prev[cur.wasteDetailsCode].incoming * 100) / 100;
      prev[cur.wasteDetailsCode].outgoing =
        Math.round(prev[cur.wasteDetailsCode].outgoing * 100) / 100;

      return prev;
    }, {});

    return {
      company: userCompany,
      stats: Object.keys(stats).map(key => stats[key])
    };
  });
};

export default statsResolver;
