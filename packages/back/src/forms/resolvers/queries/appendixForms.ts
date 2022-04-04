import { checkIsCompanyMember } from "../../../users/permissions";
import prisma from "../../../prisma";
import { checkIsAuthenticated } from "../../../common/permissions";
import { QueryResolvers } from "@trackdechets/codegen/src/back.gen";
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

  return queriedForms.map(f => expandFormFromDb(f));
};

export default appendixFormsResolver;
