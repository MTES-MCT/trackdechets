import { UserRole } from "@prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  Mutation,
  MutationDeleteBsffArgs
} from "../../../../generated/graphql/types";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import {
  createBsff,
  createBsffAfterEmission
} from "../../../__tests__/factories";

const DELETE_BSFF = `
  mutation DeleteBsff($id: ID!) {
    deleteBsff(id: $id) {
      id
    }
  }
`;

describe("Mutation.deleteBsff", () => {
  afterEach(resetDatabase);

  it("should allow user to delete a bsff", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const { mutate } = makeClient(emitter.user);

    const bsff = await createBsff({ emitter });
    const { data } = await mutate<
      Pick<Mutation, "deleteBsff">,
      MutationDeleteBsffArgs
    >(DELETE_BSFF, {
      variables: {
        id: bsff.id
      }
    });

    expect(data.deleteBsff.id).toBeTruthy();
  });

  it("should disallow unauthenticated user from deleting a bsff", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate<
      Pick<Mutation, "deleteBsff">,
      MutationDeleteBsffArgs
    >(DELETE_BSFF, {
      variables: {
        id: "123"
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

    const bsff = await createBsff();
    const { errors } = await mutate<
      Pick<Mutation, "deleteBsff">,
      MutationDeleteBsffArgs
    >(DELETE_BSFF, {
      variables: {
        id: bsff.id
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Vous ne pouvez pas éditer un bordereau sur lequel le SIRET de votre entreprise n'apparaît pas."
      })
    ]);
  });

  it("should throw an error if the bsff being deleted doesn't exist", async () => {
    const { user } = await userWithCompanyFactory(UserRole.ADMIN);
    const { mutate } = makeClient(user);

    const { errors } = await mutate<
      Pick<Mutation, "deleteBsff">,
      MutationDeleteBsffArgs
    >(DELETE_BSFF, {
      variables: {
        id: "123"
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Le bordereau de fluides frigorigènes n°123 n'existe pas."
      })
    ]);
  });

  it("should throw an error if the bsff has already been deleted", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const { mutate } = makeClient(emitter.user);

    const bsff = await createBsff({ emitter }, { isDeleted: true });
    const { errors } = await mutate<
      Pick<Mutation, "deleteBsff">,
      MutationDeleteBsffArgs
    >(DELETE_BSFF, {
      variables: {
        id: bsff.id
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `Le bordereau de fluides frigorigènes n°${bsff.id} n'existe pas.`
      })
    ]);
  });

  it("should disallow deleting a bsff with a signature", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const { mutate } = makeClient(emitter.user);

    const bsff = await createBsffAfterEmission({
      emitter,
      transporter,
      destination
    });
    const { errors } = await mutate<
      Pick<Mutation, "deleteBsff">,
      MutationDeleteBsffArgs
    >(DELETE_BSFF, {
      variables: {
        id: bsff.id
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `Il n'est pas possible de supprimer un bordereau qui a été signé par un des acteurs`
      })
    ]);
  });
});
