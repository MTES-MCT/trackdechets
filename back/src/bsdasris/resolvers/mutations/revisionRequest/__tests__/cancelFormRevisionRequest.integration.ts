import { RevisionRequestStatus } from "@td/prisma";
import { resetDatabase } from "../../../../../../integration-tests/helper";
import type {
  Mutation,
  MutationCancelBsdaRevisionRequestArgs
} from "@td/codegen-back";
import { prisma } from "@td/prisma";
import { userWithCompanyFactory } from "../../../../../__tests__/factories";
import makeClient from "../../../../../__tests__/testClient";
import { bsdasriFactory } from "../../../../__tests__/factories";

const CANCEL_BSDASRI_REVISION_REQUEST = `
  mutation CancelBsdasriRevisionRequest($id: ID!) {
    cancelBsdasriRevisionRequest(id: $id)
  }
`;

describe("Mutation.cancelBsdasriRevisionRequest", () => {
  afterEach(() => resetDatabase());

  it("should fail if revision doesnt exist", async () => {
    const { user } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const { errors } = await mutate<
      Pick<Mutation, "cancelBsdasriRevisionRequest">,
      MutationCancelBsdaRevisionRequestArgs
    >(CANCEL_BSDASRI_REVISION_REQUEST, {
      variables: { id: "i dont exist" }
    });

    expect(errors[0].message).toBe(`Révision introuvable.`);
  });

  it("should fail if current user is not the revision author", async () => {
    const { user } = await userWithCompanyFactory("ADMIN");
    const { company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsdasri = await bsdasriFactory({
      opt: { emitterCompanySiret: company.siret }
    });

    const revisionRequest = await prisma.bsdasriRevisionRequest.create({
      data: {
        bsdasriId: bsdasri.id,
        authoringCompanyId: company.id,
        comment: ""
      }
    });

    const { errors } = await mutate<
      Pick<Mutation, "cancelBsdasriRevisionRequest">,
      MutationCancelBsdaRevisionRequestArgs
    >(CANCEL_BSDASRI_REVISION_REQUEST, {
      variables: { id: revisionRequest.id }
    });

    expect(errors[0].message).toBe(
      `Vous n'êtes pas l'auteur de cette révision.`
    );
  });

  it("should fail if revision is not pending", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsdasri = await bsdasriFactory({
      opt: { emitterCompanySiret: company.siret }
    });

    const revisionRequest = await prisma.bsdasriRevisionRequest.create({
      data: {
        bsdasriId: bsdasri.id,
        authoringCompanyId: company.id,
        comment: "",
        status: RevisionRequestStatus.ACCEPTED
      }
    });

    const { errors } = await mutate<
      Pick<Mutation, "cancelBsdasriRevisionRequest">,
      MutationCancelBsdaRevisionRequestArgs
    >(CANCEL_BSDASRI_REVISION_REQUEST, {
      variables: { id: revisionRequest.id }
    });

    expect(errors[0].message).toBe(
      `La révision n'est pas annulable. Elle a déjà été acceptée ou refusée.`
    );
  });

  it("should delete revision", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsdasri = await bsdasriFactory({
      opt: { emitterCompanySiret: company.siret }
    });

    const revisionRequest = await prisma.bsdasriRevisionRequest.create({
      data: {
        bsdasriId: bsdasri.id,
        authoringCompanyId: company.id,
        comment: ""
      }
    });

    const revisionsCountBefore = await prisma.bsdasriRevisionRequest.count({
      where: { authoringCompanyId: company.id }
    });
    expect(revisionsCountBefore).toBe(1);

    await mutate<
      Pick<Mutation, "cancelBsdasriRevisionRequest">,
      MutationCancelBsdaRevisionRequestArgs
    >(CANCEL_BSDASRI_REVISION_REQUEST, {
      variables: { id: revisionRequest.id }
    });

    const revisionsCountAfter = await prisma.bsdasriRevisionRequest.count({
      where: { authoringCompanyId: company.id }
    });
    expect(revisionsCountAfter).toBe(0);
  });
});
