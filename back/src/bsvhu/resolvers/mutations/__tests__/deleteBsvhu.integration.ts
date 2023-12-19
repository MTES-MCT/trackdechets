import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

import {
  Mutation,
  MutationDeleteBsvhuArgs
} from "../../../../generated/graphql/types";
import { bsvhuFactory } from "../../../__tests__/factories.vhu";
import { prisma } from "@td/prisma";
const DELETE_VHU = `
mutation DeleteVhu($id: ID!){
  deleteBsvhu(id: $id)  {
    id
  }
}
`;
describe("Mutation.deleteBsvhu", () => {
  afterEach(resetDatabase);

  it("should disallow unauthenticated user", async () => {
    const { company } = await userWithCompanyFactory("MEMBER");
    const vhu = await bsvhuFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });
    const { mutate } = makeClient(); // unauthenticated user
    const { errors } = await mutate<
      Pick<Mutation, "deleteBsvhu">,
      MutationDeleteBsvhuArgs
    >(DELETE_VHU, {
      variables: {
        id: vhu.id
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
  it("should disallow users not belonging to the deleted vhu", async () => {
    const { user: nonFormuser } = await userWithCompanyFactory("MEMBER");
    const { company: otherCompany } = await userWithCompanyFactory("MEMBER");

    const vhu = await bsvhuFactory({
      opt: {
        emitterCompanySiret: otherCompany.siret
      }
    });

    const { mutate } = makeClient(nonFormuser);

    const { errors } = await mutate<
      Pick<Mutation, "deleteBsvhu">,
      MutationDeleteBsvhuArgs
    >(DELETE_VHU, {
      variables: {
        id: vhu.id
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

  it("should forbid to delete a non INITIAL vhu", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const vhu = await bsvhuFactory({
      opt: {
        emitterCompanySiret: company.siret,
        status: "SENT"
      }
    });

    const { mutate } = makeClient(user); // emitter

    const { errors } = await mutate<
      Pick<Mutation, "deleteBsvhu">,
      MutationDeleteBsvhuArgs
    >(DELETE_VHU, {
      variables: {
        id: vhu.id
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

  it("should allow emitter to delete a bsvhu with only his signature", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const bsvhu = await bsvhuFactory({
      opt: {
        emitterCompanySiret: company.siret,
        emitterEmissionSignatureDate: new Date(),
        status: "SIGNED_BY_PRODUCER"
      }
    });

    const { mutate } = makeClient(user); // emitter
    const { errors } = await mutate<
      Pick<Mutation, "deleteBsvhu">,
      MutationDeleteBsvhuArgs
    >(DELETE_VHU, {
      variables: {
        id: bsvhu.id
      }
    });

    expect(errors).toBeUndefined();

    const deletedBsvhu = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: bsvhu.id }
    });

    expect(deletedBsvhu.isDeleted).toBe(true);
  });

  it("should disallow emitter to delete a bsvhu with transporteur signature", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const bsvhu = await bsvhuFactory({
      opt: {
        emitterCompanySiret: company.siret,
        emitterEmissionSignatureDate: new Date(),
        transporterTransportSignatureDate: new Date(),
        status: "SENT"
      }
    });

    const { mutate } = makeClient(user); // emitter
    const { errors } = await mutate<
      Pick<Mutation, "deleteBsvhu">,
      MutationDeleteBsvhuArgs
    >(DELETE_VHU, {
      variables: {
        id: bsvhu.id
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

  it("should mark a vhu as deleted", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const vhu = await bsvhuFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });

    const { mutate } = makeClient(user); // emitter

    const { data } = await mutate<
      Pick<Mutation, "deleteBsvhu">,
      MutationDeleteBsvhuArgs
    >(DELETE_VHU, {
      variables: {
        id: vhu.id
      }
    });

    expect(data.deleteBsvhu.id).toBe(vhu.id);

    const bsdvhu = await prisma.bsvhu.findUniqueOrThrow({
      where: { id: vhu.id }
    });
    expect(bsdvhu.isDeleted).toEqual(true);
  });
});
