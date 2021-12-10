import { RevisionRequestStatus } from "@prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  Mutation,
  MutationCancelBsddRevisionRequestArgs
} from "../../../../generated/graphql/types";
import prisma from "../../../../prisma";
import {
  formFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

const CANCEL_BSDD_REVISION_REQUEST = `
  mutation CancelBsddRevisionRequest($id: ID!) {
    cancelBsddRevisionRequest(id: $id)
  }
`;

describe("Mutation.cancelBsddRevisionRequest", () => {
  afterEach(() => resetDatabase());

  it("should fail if revision doesnt exist", async () => {
    const { user } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const { errors } = await mutate<
      Pick<Mutation, "cancelBsddRevisionRequest">,
      MutationCancelBsddRevisionRequestArgs
    >(CANCEL_BSDD_REVISION_REQUEST, {
      variables: { id: "i dont exist" }
    });

    expect(errors[0].message).toBe(`Révision introuvable.`);
  });

  it("should fail if current user is not the revision author", async () => {
    const { user } = await userWithCompanyFactory("ADMIN");
    const { company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsdd = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: company.siret }
    });

    const revisionRequest = await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: bsdd.id,
        authorId: company.id,
        content: {},
        comment: ""
      }
    });

    const { errors } = await mutate<
      Pick<Mutation, "cancelBsddRevisionRequest">,
      MutationCancelBsddRevisionRequestArgs
    >(CANCEL_BSDD_REVISION_REQUEST, {
      variables: { id: revisionRequest.id }
    });

    expect(errors[0].message).toBe(
      `Vous n'êtes pas l'auteur de cette révision.`
    );
  });

  it("should fail if revision is not pending", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsdd = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: company.siret }
    });

    const revisionRequest = await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: bsdd.id,
        authorId: company.id,
        content: {},
        comment: "",
        status: RevisionRequestStatus.ACCEPTED
      }
    });

    const { errors } = await mutate<
      Pick<Mutation, "cancelBsddRevisionRequest">,
      MutationCancelBsddRevisionRequestArgs
    >(CANCEL_BSDD_REVISION_REQUEST, {
      variables: { id: revisionRequest.id }
    });

    expect(errors[0].message).toBe(
      `La révision n'est pas annulable. Elle a déjà été acceptée ou refusée.`
    );
  });

  it("should delete revision", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsdd = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: company.siret }
    });

    const revisionRequest = await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: bsdd.id,
        authorId: company.id,
        content: {},
        comment: ""
      }
    });

    const revisionsCountBefore = await prisma.bsddRevisionRequest.count({
      where: { authorId: company.id }
    });
    expect(revisionsCountBefore).toBe(1);

    await mutate<
      Pick<Mutation, "cancelBsddRevisionRequest">,
      MutationCancelBsddRevisionRequestArgs
    >(CANCEL_BSDD_REVISION_REQUEST, {
      variables: { id: revisionRequest.id }
    });

    const revisionsCountAfter = await prisma.bsddRevisionRequest.count({
      where: { authorId: company.id }
    });
    expect(revisionsCountAfter).toBe(0);
  });
});
