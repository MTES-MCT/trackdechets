import { RevisionRequestStatus } from "@prisma/client";
import { resetDatabase } from "../../../../../../integration-tests/helper";
import {
  Mutation,
  MutationCancelBsdaRevisionRequestArgs
} from "../../../../../generated/graphql/types";
import { prisma } from "@td/prisma";
import { userWithCompanyFactory } from "../../../../../__tests__/factories";
import makeClient from "../../../../../__tests__/testClient";
import { bsdaFactory } from "../../../../__tests__/factories";

const CANCEL_BSDA_REVISION_REQUEST = `
  mutation CancelBsdaRevisionRequest($id: ID!) {
    cancelBsdaRevisionRequest(id: $id)
  }
`;

describe("Mutation.cancelBsdaRevisionRequest", () => {
  afterEach(() => resetDatabase());

  it("should fail if revision doesnt exist", async () => {
    const { user } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const { errors } = await mutate<
      Pick<Mutation, "cancelBsdaRevisionRequest">,
      MutationCancelBsdaRevisionRequestArgs
    >(CANCEL_BSDA_REVISION_REQUEST, {
      variables: { id: "i dont exist" }
    });

    expect(errors[0].message).toBe(`Révision introuvable.`);
  });

  it("should fail if current user is not the revision author", async () => {
    const { user } = await userWithCompanyFactory("ADMIN");
    const { company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsda = await bsdaFactory({
      opt: { emitterCompanySiret: company.siret }
    });

    const revisionRequest = await prisma.bsdaRevisionRequest.create({
      data: {
        bsdaId: bsda.id,
        authoringCompanyId: company.id,
        comment: ""
      }
    });

    const { errors } = await mutate<
      Pick<Mutation, "cancelBsdaRevisionRequest">,
      MutationCancelBsdaRevisionRequestArgs
    >(CANCEL_BSDA_REVISION_REQUEST, {
      variables: { id: revisionRequest.id }
    });

    expect(errors[0].message).toBe(
      `Vous n'êtes pas l'auteur de cette révision.`
    );
  });

  it("should fail if revision is not pending", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsda = await bsdaFactory({
      opt: { emitterCompanySiret: company.siret }
    });

    const revisionRequest = await prisma.bsdaRevisionRequest.create({
      data: {
        bsdaId: bsda.id,
        authoringCompanyId: company.id,
        comment: "",
        status: RevisionRequestStatus.ACCEPTED
      }
    });

    const { errors } = await mutate<
      Pick<Mutation, "cancelBsdaRevisionRequest">,
      MutationCancelBsdaRevisionRequestArgs
    >(CANCEL_BSDA_REVISION_REQUEST, {
      variables: { id: revisionRequest.id }
    });

    expect(errors[0].message).toBe(
      `La révision n'est pas annulable. Elle a déjà été acceptée ou refusée.`
    );
  });

  it("should delete revision", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsda = await bsdaFactory({
      opt: { emitterCompanySiret: company.siret }
    });

    const revisionRequest = await prisma.bsdaRevisionRequest.create({
      data: {
        bsdaId: bsda.id,
        authoringCompanyId: company.id,
        comment: ""
      }
    });

    const revisionsCountBefore = await prisma.bsdaRevisionRequest.count({
      where: { authoringCompanyId: company.id }
    });
    expect(revisionsCountBefore).toBe(1);

    await mutate<
      Pick<Mutation, "cancelBsdaRevisionRequest">,
      MutationCancelBsdaRevisionRequestArgs
    >(CANCEL_BSDA_REVISION_REQUEST, {
      variables: { id: revisionRequest.id }
    });

    const revisionsCountAfter = await prisma.bsdaRevisionRequest.count({
      where: { authoringCompanyId: company.id }
    });
    expect(revisionsCountAfter).toBe(0);
  });
});
