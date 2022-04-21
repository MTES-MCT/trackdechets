import { checkIsCompanyMember } from "../../../users/permissions";
import prisma from "../../../prisma";
import { checkIsAuthenticated } from "../../../common/permissions";
import { QueryResolvers } from "../../../generated/graphql/types";
import { expandFormFromDb } from "../../form-converter";

const appendixFormsResolver: QueryResolvers["appendixForms"] = async (
  _,
  { wasteCode, siret },
  context
) => {
  const user = checkIsAuthenticated(context);
  await checkIsCompanyMember(user, { siret });

  const queriedForms = await prisma.form.findMany({
    where: {
      AND: [
        ...(wasteCode ? [{ wasteDetailsCode: wasteCode }] : []),
        { status: "AWAITING_GROUP" },
        {
          OR: [
            { recipientCompanySiret: siret },
            {
              recipientIsTempStorage: true,
              temporaryStorageDetail: { destinationCompanySiret: siret }
            }
          ]
        },
        { isDeleted: false },
        { appendix2RootFormId: null }
      ]
    }
  });

  const r = await prisma.$queryRaw`SELECT "id"
  FROM "default$default"."Form" F
  WHERE "status" = 'AWAITING_GROUP'
  AND "quantityReceived" > (
  SELECT COALESCE(SUM(g."quantity"), 0)
  FROM "default$default"."Form" f
  LEFT JOIN "default$default"."FormGroupement" g
  ON f."id" = g."initialFormId"
  WHERE f."id" = F."id");`;

  console.log(r);

  return queriedForms.map(f => expandFormFromDb(f));
};

export default appendixFormsResolver;
