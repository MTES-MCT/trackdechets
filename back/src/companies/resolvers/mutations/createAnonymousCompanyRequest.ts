import * as yup from "yup";
import { renderMail, createAnonymousCompanyRequestEmail } from "@td/mail";
import { prisma } from "@td/prisma";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import {
  CreateAnonymousCompanyRequestInput,
  MutationResolvers
} from "../../../generated/graphql/types";
import { sendMail } from "../../../mailer/mailing";
import { getCodeCommune } from "../../geo/getCodeCommune";
import { validateAndExtractSireneDataFromPDFInBase64 } from "./createAnonymousCompanyRequest.helpers";
import { base64, siret } from "../../../common/validation";

const anonymousCompanyRequestInputSchema: yup.SchemaOf<CreateAnonymousCompanyRequestInput> =
  yup.object({
    siret: siret.required(),
    pdf: base64.required()
  });

const createAnonymousCompanyRequestResolver: MutationResolvers["createAnonymousCompanyRequest"] =
  async (_, { input }, context) => {
    applyAuthStrategies(context, [AuthType.Session]);
    const user = checkIsAuthenticated(context);

    // Yup validation
    await anonymousCompanyRequestInputSchema.validate(input);

    const { siret, pdf } = input;

    // Run verifications & extract data from PDF
    const data = await validateAndExtractSireneDataFromPDFInBase64(pdf);

    if (data.siret !== siret) {
      throw new Error(
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
      throw new Error(`L'entreprise avec le SIRET ${data.siret} existe déjà`);
    }

    // Verify creation request does not already exist
    const request = await prisma.anonymousCompanyRequest.findFirst({
      where: {
        siret: data.siret
      }
    });
    if (request) {
      throw new Error(
        `Une demande pour l'entreprise ${data.siret} est déjà en cours`
      );
    }

    // Retrieve the codeCommune (can be null, admins will complete)
    const codeCommune = await getCodeCommune(data.address);

    // Create the request
    await prisma.anonymousCompanyRequest.create({
      data: {
        ...data,
        codeCommune: codeCommune,
        userId: user.id,
        pdf
      }
    });

    // Send an email
    await sendMail(
      renderMail(createAnonymousCompanyRequestEmail, {
        to: [{ name: user.name ?? "", email: user.email }],
        variables: { siret: data.siret }
      })
    );

    return true;
  };

export default createAnonymousCompanyRequestResolver;
