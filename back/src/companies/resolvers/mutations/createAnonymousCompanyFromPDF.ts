import * as yup from "yup";
import { prisma } from "@td/prisma";
import { applyAuthStrategies, AuthType } from "../../../auth/auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import type {
  CreateAnonymousCompanyFromPdfInput,
  MutationResolvers
} from "@td/codegen-back";
import { getCodeCommune } from "../../geo/getCodeCommune";
import { validateAndExtractSireneDataFromPDFInBase64 } from "./createAnonymousCompanyFromPDF.helpers";
import { base64, siret } from "../../../common/validation";
import { UserInputError } from "../../../common/errors";
import { libelleFromCodeNaf } from "../../sirene/utils";

const ONE_MB = 1024 * 1024;

const anonymousCompanyInputSchema: yup.SchemaOf<CreateAnonymousCompanyFromPdfInput> =
  yup.object({
    siret: siret.required(),
    pdf: base64.max(3 * ONE_MB).required()
  });

const createAnonymousCompanyFromPDFResolver: MutationResolvers["createAnonymousCompanyFromPDF"] =
  async (_, { input }, context) => {
    applyAuthStrategies(context, [AuthType.Session]);
    checkIsAuthenticated(context);

    // Yup validation
    await anonymousCompanyInputSchema.validate(input);

    const { siret, pdf } = input;

    console.log("pdf", pdf.length);

    // Run verifications & extract data from PDF
    const data = await validateAndExtractSireneDataFromPDFInBase64(pdf);

    if (data.siret !== siret) {
      throw new UserInputError(
        `Le certificat d'inscription ne correspond pas au SIRET renseigné`
      );
    }

    // Verify company is not already created
    const anonymousCompany = await prisma.anonymousCompany.findFirst({
      where: {
        orgId: data.siret
      }
    });
    const company = await prisma.company.findFirst({
      where: {
        orgId: data.siret
      }
    });
    if (anonymousCompany || company) {
      throw new UserInputError(
        `L'entreprise avec le SIRET "${data.siret}" existe déjà`
      );
    }

    // Retrieve the codeCommune (can be null)
    const codeCommune = await getCodeCommune(data.address);

    if (!codeCommune) {
      throw new UserInputError(
        `Le code commune associé au SIRET "${data.siret}" n'a pas pu être trouvé`
      );
    }

    // Create the request
    await prisma.anonymousCompany.create({
      data: {
        ...data,
        orgId: input.siret,
        codeCommune,
        libelleNaf: libelleFromCodeNaf(data.codeNaf)
      }
    });

    return true;
  };

export default createAnonymousCompanyFromPDFResolver;
