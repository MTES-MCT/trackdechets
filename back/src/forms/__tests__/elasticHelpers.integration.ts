import { gql } from "graphql-tag";
import { formFactory, userWithCompanyFactory } from "../../__tests__/factories";
import makeClient from "../../__tests__/testClient";
import {
  Mutation,
  MutationCreateFormRevisionRequestArgs
} from "../../generated/graphql/types";
import { getFormRevisionOrgIds } from "../elasticHelpers";
import { getFormForElastic } from "../elastic";
import { prisma } from "@td/prisma";
import { resetDatabase } from "../../../integration-tests/helper";

const CREATE_FORM_REVISION_REQUEST = gql`
  mutation CreateFormRevisionRequest($input: CreateFormRevisionRequestInput!) {
    createFormRevisionRequest(input: $input) {
      id
    }
  }
`;

describe("getFormRevisionOrgIds", () => {
  afterEach(resetDatabase);

  it("should list organisation identifiers in `isInRevisionFor` and `isRevisedFor`", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const transporter = await userWithCompanyFactory("ADMIN");
    const recipient = await userWithCompanyFactory("ADMIN");

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

    const { mutate } = makeClient(emitter.user);

    const formForElastic = await getFormForElastic(form);
    const revisionOrgIds = getFormRevisionOrgIds(formForElastic);

    expect(revisionOrgIds.isInRevisionFor).toHaveLength(0);
    expect(revisionOrgIds.isRevisedFor).toHaveLength(0);

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

    const revisionRequest = data.createFormRevisionRequest;

    expect(errors).toBeUndefined();

    const formForElastic2 = await getFormForElastic(form);
    const revisionOrgIds2 = getFormRevisionOrgIds(formForElastic2);

    // Une demande de révision est en cours, les bordereaux doivent apparaitre dans
    // l'onglet "Révision en cours"
    expect(revisionOrgIds2.isInRevisionFor).toHaveLength(2);
    expect(revisionOrgIds2.isInRevisionFor).toContain(emitter.company.siret);
    expect(revisionOrgIds2.isInRevisionFor).toContain(recipient.company.siret);
    expect(revisionOrgIds2.isRevisedFor).toHaveLength(0);

    await prisma.bsddRevisionRequest.update({
      where: { id: revisionRequest.id },
      data: { status: "ACCEPTED" }
    });

    const formForElastic3 = await getFormForElastic(form);
    const revisionOrgIds3 = getFormRevisionOrgIds(formForElastic3);

    // La demande de révision a été accepté, les bordereaux doivent apparaitre
    // dans l'onglet "Révisions passés"
    expect(revisionOrgIds3.isInRevisionFor).toHaveLength(0);
    expect(revisionOrgIds3.isRevisedFor).toHaveLength(2);
    expect(revisionOrgIds3.isRevisedFor).toContain(emitter.company.siret);
    expect(revisionOrgIds3.isRevisedFor).toContain(recipient.company.siret);

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

    const formForElastic4 = await getFormForElastic(form);
    const revisionOrgIds4 = getFormRevisionOrgIds(formForElastic4);

    // Une nouvelle demande de révision a été effectuée, le bordereau doit
    // rebasculer dans l'onglet "Révision en cours"
    expect(revisionOrgIds4.isInRevisionFor).toHaveLength(2);
    expect(revisionOrgIds4.isInRevisionFor).toContain(emitter.company.siret);
    expect(revisionOrgIds4.isInRevisionFor).toContain(recipient.company.siret);
    expect(revisionOrgIds4.isRevisedFor).toHaveLength(0);
  });
});
