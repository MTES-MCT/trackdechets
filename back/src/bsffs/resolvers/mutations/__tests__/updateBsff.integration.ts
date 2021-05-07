import { UserRole } from ".prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import getReadableId, { ReadableIdPrefix } from "../../../../forms/readableId";
import {
  Mutation,
  MutationUpdateBsffArgs
} from "../../../../generated/graphql/types";
import prisma from "../../../../prisma";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

const UPDATE_BSFF = `
  mutation UpdateBsff($id: ID!, $input: BsffInput!) {
    updateBsff(id: $id, input: $input) {
      id
    }
  }
`;

describe("Mutation.updateBsff", () => {
  afterEach(resetDatabase);

  it("should allow user to update a bsff", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);
    const { mutate } = makeClient(user);

    const bsff = await prisma.bsff.create({
      data: {
        id: getReadableId(ReadableIdPrefix.FF),
        emitterCompanySiret: company.siret
      }
    });
    const { data, errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          emitter: {
            company: {
              name: company.name
            }
          }
        }
      }
    });

    expect(errors).toBeUndefined();
    expect(data.updateBsff.id).toBeTruthy();
  });

  it("should disallow unauthenticated user from updating a bsff", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: "123",
        input: {}
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        extensions: {
          code: "UNAUTHENTICATED"
        }
      })
    ]);
  });

  it("should disallow user that is not a contributor on the bsff", async () => {
    const { user } = await userWithCompanyFactory(UserRole.ADMIN);
    const { mutate } = makeClient(user);

    const bsff = await prisma.bsff.create({
      data: {
        id: getReadableId(ReadableIdPrefix.FF)
      }
    });
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {}
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Vous ne pouvez pas éditer un bordereau sur lequel le SIRET de votre entreprise n'apparaît pas."
      })
    ]);
  });

  it("should throw an error if the bsff being updated doesn't exist", async () => {
    const { user } = await userWithCompanyFactory(UserRole.ADMIN);
    const { mutate } = makeClient(user);

    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: "123",
        input: {}
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Le bordereau de fluides frigorigènes n°123 n'existe pas."
      })
    ]);
  });

  it("should throw an error if the bsff being updated is deleted", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);
    const { mutate } = makeClient(user);

    const bsff = await prisma.bsff.create({
      data: {
        id: getReadableId(ReadableIdPrefix.FF),
        emitterCompanySiret: company.siret,
        isDeleted: true
      }
    });
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          emitter: {
            company: {
              name: company.name
            }
          }
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `Le bordereau de fluides frigorigènes n°${bsff.id} n'existe pas.`
      })
    ]);
  });

  it("should disallow removing a company from the bsff", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);
    const { mutate } = makeClient(user);

    const bsff = await prisma.bsff.create({
      data: {
        id: getReadableId(ReadableIdPrefix.FF),
        emitterCompanySiret: company.siret
      }
    });
    const { errors } = await mutate<
      Pick<Mutation, "updateBsff">,
      MutationUpdateBsffArgs
    >(UPDATE_BSFF, {
      variables: {
        id: bsff.id,
        input: {
          emitter: {
            company: {
              siret: "1".repeat(14)
            }
          }
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Vous ne pouvez pas éditer un bordereau sur lequel le SIRET de votre entreprise n'apparaît pas."
      })
    ]);
  });

  it.todo("should disallow updating emitter if they signed already");
  it.todo("should allow updating emitter if they didn't sign");
  it.todo(
    "should disallow updating waste and quantity if emitter signed already"
  );
  it.todo("should allow updating waste and quantity if emitter didn't sign");
  it.todo("should disallow updating transporter if they signed already");
  it.todo("should allow updating transporter if they didn't sign");
  it.todo("should disallow updating packagings if transporter signed alrady");
  it.todo("should allow updating packagings if transporter didn't sign");
  it.todo("should disallow updating destination if they signed already");
  it.todo("should allow updating destination if they didn't sign");
});
