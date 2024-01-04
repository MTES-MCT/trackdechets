import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { bsdasriFactory, initialData } from "../../../__tests__/factories";
import {
  Mutation,
  MutationDeleteBsdasriArgs
} from "../../../../generated/graphql/types";
import { prisma } from "@td/prisma";

const DELETE_DASRI = `
mutation DeleteDasri($id: ID!){
  deleteBsdasri(id: $id)  {
    id
  }
}
`;
describe("Mutation.deleteBsdasri", () => {
  afterEach(resetDatabase);

  it("should disallow unauthenticated user", async () => {
    const { company } = await userWithCompanyFactory("MEMBER");
    const dasri = await bsdasriFactory({
      opt: {
        emitterCompanySiret: company.siret
      }
    });
    const { mutate } = makeClient(); // unauthenticated user
    const { errors } = await mutate<
      Pick<Mutation, "deleteBsdasri">,
      MutationDeleteBsdasriArgs
    >(DELETE_DASRI, {
      variables: {
        id: dasri.id
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
  it("should disallow users not belonging to the deleted dasri", async () => {
    const { user } = await userWithCompanyFactory("MEMBER");
    const { company: otherCompany } = await userWithCompanyFactory("MEMBER");

    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(otherCompany)
      }
    });

    const { mutate } = makeClient(user); // emitter

    const { errors } = await mutate<
      Pick<Mutation, "deleteBsdasri">,
      MutationDeleteBsdasriArgs
    >(DELETE_DASRI, {
      variables: {
        id: dasri.id
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

  it("should forbid to delete a non INITIAL dasri", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(company),
        emitterEmissionSignatureDate: new Date(),
        transporterTransportSignatureDate: new Date(),
        status: "SENT"
      }
    });

    const { mutate } = makeClient(user); // emitter

    const { errors } = await mutate<
      Pick<Mutation, "deleteBsdasri">,
      MutationDeleteBsdasriArgs
    >(DELETE_DASRI, {
      variables: {
        id: dasri.id
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

  it("should allow emitter to delete a bsdasri with only his signature", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const bsdasri = await bsdasriFactory({
      opt: {
        ...initialData(company),
        emitterEmissionSignatureDate: new Date(),
        status: "SIGNED_BY_PRODUCER"
      }
    });
    const { mutate } = makeClient(user);

    const { errors } = await mutate<
      Pick<Mutation, "deleteBsdasri">,
      MutationDeleteBsdasriArgs
    >(DELETE_DASRI, {
      variables: {
        id: bsdasri.id
      }
    });

    expect(errors).toBeUndefined();

    const deletedBsdasri = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: bsdasri.id }
    });

    expect(deletedBsdasri.isDeleted).toBe(true);
  });

  it("should disallow emitter to delete a bsdasri with transporteur signature", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const bsdasri = await bsdasriFactory({
      opt: {
        ...initialData(company),
        emitterEmissionSignatureDate: new Date(),
        transporterTransportSignatureDate: new Date(),
        status: "SENT"
      }
    });
    const { mutate } = makeClient(user);

    const { errors } = await mutate<
      Pick<Mutation, "deleteBsdasri">,
      MutationDeleteBsdasriArgs
    >(DELETE_DASRI, {
      variables: {
        id: bsdasri.id
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Seuls les bordereaux en brouillon ou en attente de collecte peuvent être supprimés"
      })
    ]);
  });

  it("should mark a dasri as deleted", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");

    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(company)
      }
    });

    const { mutate } = makeClient(user); // emitter

    const { data } = await mutate<
      Pick<Mutation, "deleteBsdasri">,
      MutationDeleteBsdasriArgs
    >(DELETE_DASRI, {
      variables: {
        id: dasri.id
      }
    });

    expect(data.deleteBsdasri.id).toBe(dasri.id);

    const bsdasri = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id }
    });
    expect(bsdasri.isDeleted).toEqual(true);
  });
});
