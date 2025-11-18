import { gql } from "graphql-tag";
import { formFactory, userWithCompanyFactory } from "../../__tests__/factories";
import makeClient from "../../__tests__/testClient";
import type {
  Mutation,
  MutationCreateFormRevisionRequestArgs
} from "@td/codegen-back";
import { getFormRevisionOrgIds } from "../elasticHelpers";
import { getFormForElastic } from "../elastic";
import { prisma } from "@td/prisma";
import { resetDatabase } from "../../../integration-tests/helper";
import { CompanyType, WasteProcessorType } from "@td/prisma";

const CREATE_FORM_REVISION_REQUEST = gql`
  mutation CreateFormRevisionRequest($input: CreateFormRevisionRequestInput!) {
    createFormRevisionRequest(input: $input) {
      id
    }
  }
`;

describe("getFormRevisionOrgIds", () => {
  afterEach(resetDatabase);

  it("should list organisation identifiers correct revision tabs", async () => {
    // Etape 1: on crée le bordereau
    const emitter = await userWithCompanyFactory("ADMIN");
    const transporter = await userWithCompanyFactory("ADMIN");
    const recipient = await userWithCompanyFactory("ADMIN", {
      companyTypes: [CompanyType.WASTEPROCESSOR],
      wasteProcessorTypes: [WasteProcessorType.DANGEROUS_WASTES_INCINERATION]
    });

    const form = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        status: "PROCESSED",
        emitterCompanySiret: emitter.company.siret,
        recipientCompanySiret: recipient.company.siret,
        transporters: {
          create: {
            transporterCompanySiret: transporter.company.siret,
            number: 1
          }
        }
      }
    });

    // A ce stade, les onglets de révisions devraient être vides
    const formForElastic = await getFormForElastic(form);
    const revisionOrgIds = getFormRevisionOrgIds(formForElastic);

    expect(revisionOrgIds.isPendingRevisionFor).toHaveLength(0);
    expect(revisionOrgIds.isEmittedRevisionFor).toHaveLength(0);
    expect(revisionOrgIds.isReceivedRevisionFor).toHaveLength(0);
    expect(revisionOrgIds.isReviewedRevisionFor).toHaveLength(0);

    // L'émetteur crée la révision
    const { mutate } = makeClient(emitter.user);
    const { errors, data } = await mutate<
      Pick<Mutation, "createFormRevisionRequest">,
      MutationCreateFormRevisionRequestArgs
    >(CREATE_FORM_REVISION_REQUEST, {
      variables: {
        input: {
          formId: form.id,
          authoringCompanySiret: emitter.company.siret!,
          comment: "oups",
          content: { wasteDetails: { code: "04 01 03*" } }
        }
      }
    });

    expect(errors).toBeUndefined();
    const revisionRequest = data.createFormRevisionRequest;

    // La révision devrait commencer à apparaître dans les différents onglets
    const formForElastic2 = await getFormForElastic(form);
    const revisionOrgIds2 = getFormRevisionOrgIds(formForElastic2);

    // L'émetteur et le destinataire voient la révisions dans "En cours"
    expect(revisionOrgIds2.isPendingRevisionFor).toHaveLength(2);
    expect(revisionOrgIds2.isPendingRevisionFor).toContain(
      emitter.company.siret
    );
    expect(revisionOrgIds2.isPendingRevisionFor).toContain(
      recipient.company.siret
    );

    // L'émetteur voit la révision dans "Émises"
    expect(revisionOrgIds2.isEmittedRevisionFor).toHaveLength(1);
    expect(revisionOrgIds2.isEmittedRevisionFor).toContain(
      emitter.company.siret
    );

    // Le destinataire voit la révision dans "Reçues"
    expect(revisionOrgIds2.isReceivedRevisionFor).toHaveLength(1);
    expect(revisionOrgIds2.isReceivedRevisionFor).toContain(
      recipient.company.siret
    );

    // Rien dans "Finalisées"
    expect(revisionOrgIds2.isReviewedRevisionFor).toHaveLength(0);

    // On passe la révision à acceptée
    await prisma.bsddRevisionRequest.update({
      where: { id: revisionRequest.id },
      data: { status: "ACCEPTED" }
    });

    const formForElastic3 = await getFormForElastic(form);
    const revisionOrgIds3 = getFormRevisionOrgIds(formForElastic3);

    // Les différents onglets ont bougé
    expect(revisionOrgIds3.isPendingRevisionFor).toHaveLength(0);
    expect(revisionOrgIds3.isEmittedRevisionFor).toHaveLength(0);
    expect(revisionOrgIds3.isReceivedRevisionFor).toHaveLength(0);
    expect(revisionOrgIds3.isReviewedRevisionFor).toHaveLength(2);
    expect(revisionOrgIds3.isReviewedRevisionFor).toContain(
      recipient.company.siret
    );
    expect(revisionOrgIds3.isReviewedRevisionFor).toContain(
      emitter.company.siret
    );

    // On crée une nouvelle demande de révision
    await mutate<
      Pick<Mutation, "createFormRevisionRequest">,
      MutationCreateFormRevisionRequestArgs
    >(CREATE_FORM_REVISION_REQUEST, {
      variables: {
        input: {
          formId: form.id,
          authoringCompanySiret: emitter.company.siret!,
          comment: "oups",
          content: { wasteDetails: { code: "04 01 03*" } }
        }
      }
    });

    // La révision ré-apparaître dans les différents onglets
    const formForElastic4 = await getFormForElastic(form);
    const revisionOrgIds4 = getFormRevisionOrgIds(formForElastic4);

    // L'émetteur et le destinataire voient la révisions dans "En cours"
    expect(revisionOrgIds4.isPendingRevisionFor).toHaveLength(2);
    expect(revisionOrgIds4.isPendingRevisionFor).toContain(
      emitter.company.siret
    );
    expect(revisionOrgIds4.isPendingRevisionFor).toContain(
      recipient.company.siret
    );

    // L'émetteur voit la révision dans "Émises"
    expect(revisionOrgIds4.isEmittedRevisionFor).toHaveLength(1);
    expect(revisionOrgIds4.isEmittedRevisionFor).toContain(
      emitter.company.siret
    );

    // Le destinataire voit la révision dans "Reçues"
    expect(revisionOrgIds4.isReceivedRevisionFor).toHaveLength(1);
    expect(revisionOrgIds4.isReceivedRevisionFor).toContain(
      recipient.company.siret
    );

    // Rien dans "Finalisées"
    expect(revisionOrgIds4.isReviewedRevisionFor).toHaveLength(0);
  });
});
