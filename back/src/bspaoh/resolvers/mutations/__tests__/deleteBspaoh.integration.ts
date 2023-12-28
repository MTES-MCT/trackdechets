import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { bspaohFactory } from "../../../__tests__/factories";
import {
  Mutation,
  MutationDeleteBspaohArgs
} from "../../../../generated/graphql/types";
import prisma from "../../../../prisma";
import { BspaohStatus } from "@prisma/client";

const DELETE_BSPAOH = `
mutation DeleteBspaoh($id: ID!){
  deleteBspaoh(id: $id)  {
    id
  }
}
`;
describe("Mutation.deleteBspaoh", () => {
  afterEach(resetDatabase);

  it("should disallow unauthenticated user", async () => {
    const { company } = await userWithCompanyFactory("MEMBER");
    const bspaoh = await bspaohFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });
    const { mutate } = makeClient(); // unauthenticated user
    const { errors } = await mutate<
      Pick<Mutation, "deleteBspaoh">,
      MutationDeleteBspaohArgs
    >(DELETE_BSPAOH, {
      variables: {
        id: bspaoh.id
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous n'êtes pas connecté.",
        extensions: expect.objectContaining({
          code: ErrorCode.UNAUTHENTICATED
        })
      })
    ]);
  });

  it("should disallow users not belonging to the deleted bspaoh", async () => {
    const { user } = await userWithCompanyFactory("MEMBER");
    const { company: otherCompany } = await userWithCompanyFactory("MEMBER");

    const bspaoh = await bspaohFactory({
      opt: {
        emitterCompanySiret: otherCompany.siret
      }
    });

    const { mutate } = makeClient(user); // emitter

    const { errors } = await mutate<
      Pick<Mutation, "deleteBspaoh">,
      MutationDeleteBspaohArgs
    >(DELETE_BSPAOH, {
      variables: {
        id: bspaoh.id
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous n'êtes pas autorisé à supprimer ce bordereau.",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });

  it("should disallow users not belonging to the draft bspaoh creators", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const bspaoh = await bspaohFactory({
      opt: {
        status: BspaohStatus.DRAFT,
        emitterCompanySiret: company.siret,
        canAccessDraftSirets: ["1234"]
      }
    });

    const { mutate } = makeClient(user); // emitter

    const { errors } = await mutate<
      Pick<Mutation, "deleteBspaoh">,
      MutationDeleteBspaohArgs
    >(DELETE_BSPAOH, {
      variables: {
        id: bspaoh.id
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous n'êtes pas autorisé à supprimer ce bordereau.",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });
  it("should forbid to delete a non INITIAL bspaoh", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const bspaoh = await bspaohFactory({
      opt: {
        emitterCompanySiret: company.siret,
        status: "SENT"
      }
    });

    const { mutate } = makeClient(user); // emitter

    const { errors } = await mutate<
      Pick<Mutation, "deleteBspaoh">,
      MutationDeleteBspaohArgs
    >(DELETE_BSPAOH, {
      variables: {
        id: bspaoh.id
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Seuls les bordereaux en brouillon ou en attente de collecte peuvent être supprimés",
        extensions: expect.objectContaining({
          code: ErrorCode.FORBIDDEN
        })
      })
    ]);
  });

  it("should allow emitter to delete a bspaoh with only his signature", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const bspaoh = await bspaohFactory({
      opt: {
        emitterCompanySiret: company.siret,
        emitterEmissionSignatureDate: new Date(),
        status: "SIGNED_BY_PRODUCER"
      }
    });
    const { mutate } = makeClient(user);

    const { errors } = await mutate<
      Pick<Mutation, "deleteBspaoh">,
      MutationDeleteBspaohArgs
    >(DELETE_BSPAOH, {
      variables: {
        id: bspaoh.id
      }
    });

    expect(errors).toBeUndefined();

    const deletedBspaoh = await prisma.bspaoh.findUniqueOrThrow({
      where: { id: bspaoh.id }
    });

    expect(deletedBspaoh.isDeleted).toBe(true);
  });

  it("should disallow emitter to delete a bspaoh with transporter signature", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const bspaoh = await bspaohFactory({
      opt: {
        emitterCompanySiret: company.siret,
        emitterEmissionSignatureDate: new Date(),
        status: "SENT",

        transporters: {
          create: { transporterTransportSignatureDate: new Date(), number: 1 }
        }
      }
    });

    const { mutate } = makeClient(user);

    const { errors } = await mutate<
      Pick<Mutation, "deleteBspaoh">,
      MutationDeleteBspaohArgs
    >(DELETE_BSPAOH, {
      variables: {
        id: bspaoh.id
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Seuls les bordereaux en brouillon ou en attente de collecte peuvent être supprimés"
      })
    ]);
  });

  it("should mark a bspaoh as deleted", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const bsd = await bspaohFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });

    const { mutate } = makeClient(user); // emitter

    const { data } = await mutate<
      Pick<Mutation, "deleteBspaoh">,
      MutationDeleteBspaohArgs
    >(DELETE_BSPAOH, {
      variables: {
        id: bsd.id
      }
    });

    expect(data.deleteBspaoh.id).toBe(bsd.id);

    const deleted = await prisma.bspaoh.findUniqueOrThrow({
      where: { id: bsd.id }
    });
    expect(deleted.isDeleted).toEqual(true);
  });
});
